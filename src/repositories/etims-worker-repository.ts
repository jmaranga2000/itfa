import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { hasPermission } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { sendClientJourneyEmailToUser } from "@/features/engagements/client-journey-email";
import { createEtimsConnector } from "@/features/etims/connector";
import {
  createAdjustmentNotePdf,
  createFiscalInvoicePdf,
} from "@/features/etims/fiscal-pdf";
import type { EtimsSubmissionEnvelope, EtimsSubmissionResult } from "@/features/etims/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuthorizationError } from "@/lib/errors";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { AdjustmentNoteModel } from "@/models/adjustment-note";
import { EtimsConfigurationModel } from "@/models/etims-configuration";
import { EtimsOutboxEventModel } from "@/models/etims-outbox-event";
import { FinanceDeliveryJobModel } from "@/models/finance-delivery-job";
import { FiscalInvoiceModel } from "@/models/fiscal-invoice";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { createCommunicationNotification } from "@/repositories/communication-repository";
import { getOperationalEtimsConfiguration } from "@/repositories/etims-configuration-repository";
import { getPlatformSettings } from "@/repositories/platform-settings-repository";

type RawOutboxEvent = {
  _id: Types.ObjectId;
  aggregateType: "INVOICE" | "CREDIT_NOTE" | "DEBIT_NOTE";
  aggregateId: Types.ObjectId;
  eventType: "SUBMIT_SALE" | "SUBMIT_CREDIT_NOTE" | "SUBMIT_DEBIT_NOTE" | "RECONCILE_TRANSACTION";
  status: string;
  idempotencyKey: string;
  payloadHash: string;
  payloadVersion: number;
  attemptCount: number;
  maxAttempts: number;
};

function nextRetryDate(attemptCount: number, initialRetrySeconds: number) {
  const seconds = Math.min(86_400, initialRetrySeconds * (2 ** Math.max(0, attemptCount - 1)));
  return new Date(Date.now() + seconds * 1000);
}

async function loadEnvelope(event: RawOutboxEvent): Promise<EtimsSubmissionEnvelope | null> {
  const record = event.aggregateType === "INVOICE"
    ? await FiscalInvoiceModel.findById(event.aggregateId).select("snapshot").lean().exec()
    : await AdjustmentNoteModel.findById(event.aggregateId).select("snapshot").lean().exec();
  if (!record?.snapshot) return null;
  return {
    aggregateId: event.aggregateId.toString(),
    kind: event.aggregateType === "INVOICE" ? "SALE" : event.aggregateType,
    idempotencyKey: event.idempotencyKey,
    payloadHash: event.payloadHash,
    payloadVersion: event.payloadVersion,
    snapshot: record.snapshot as Record<string, unknown>,
  };
}

async function internalRecipients(event: RawOutboxEvent) {
  if (event.aggregateType === "INVOICE") {
    const invoice = await FiscalInvoiceModel.findById(event.aggregateId)
      .select("createdByUserId approvedByUserId")
      .lean()
      .exec();
    return [invoice?.createdByUserId, invoice?.approvedByUserId]
      .filter(Boolean)
      .map((value) => value!.toString());
  }
  const note = await AdjustmentNoteModel.findById(event.aggregateId)
    .select("createdByAdminId confirmedByAdminId")
    .lean()
    .exec();
  return [note?.createdByAdminId, note?.confirmedByAdminId]
    .filter(Boolean)
    .map((value) => value!.toString());
}

async function notifyInternal(event: RawOutboxEvent, title: string, description: string) {
  const recipients = new Set(await internalRecipients(event));
  await Promise.allSettled([...recipients].map((recipientUserId) =>
    createCommunicationNotification({
      recipientUserId,
      type: "action_required",
      title,
      description,
      relatedModule: "invoices",
      relatedRecordId: event.aggregateId.toString(),
      actionUrl: event.aggregateType === "INVOICE"
        ? `/admin/invoices/${event.aggregateId.toString()}`
        : `/admin/finance/etims/adjustments/${event.aggregateId.toString()}`,
    })));
}

async function markSubmitting(event: RawOutboxEvent, configuration: Awaited<ReturnType<typeof getOperationalEtimsConfiguration>>) {
  const now = new Date();
  if (event.aggregateType === "INVOICE") {
    const result = await FiscalInvoiceModel.updateOne(
      { _id: event.aggregateId, status: { $in: ["ETIMS_QUEUED", "ETIMS_RETRY_REQUIRED"] } },
      {
        $set: {
          status: "ETIMS_SUBMITTING",
          "etims.status": "SUBMITTING",
          "etims.provider": configuration.providerName,
          "etims.environment": configuration.environment,
          "etims.lastAttemptAt": now,
        },
        $inc: { "etims.attemptCount": 1 },
      },
    ).exec();
    return result.modifiedCount === 1;
  } else {
    const result = await AdjustmentNoteModel.updateOne(
      { _id: event.aggregateId, status: { $in: ["ETIMS_QUEUED", "ETIMS_RETRY_REQUIRED"] } },
      {
        $set: {
          status: "ETIMS_SUBMITTING",
          "etims.status": "SUBMITTING",
          "etims.provider": configuration.providerName,
          "etims.environment": configuration.environment,
          "etims.lastAttemptAt": now,
        },
        $inc: { "etims.attemptCount": 1 },
      },
    ).exec();
    return result.modifiedCount === 1;
  }
}

async function acceptTransaction(event: RawOutboxEvent, result: Extract<EtimsSubmissionResult, { outcome: "ACCEPTED" }>) {
  const now = new Date();
  const fiscalSet = {
    "etims.status": "ACCEPTED",
    "etims.traderInvoiceNumber": result.traderInvoiceNumber,
    "etims.kraInvoiceNumber": result.kraInvoiceNumber,
    "etims.controlUnitId": result.controlUnitId ?? "",
    "etims.receiptNumber": result.receiptNumber ?? "",
    "etims.receiptSignature": result.receiptSignature ?? "",
    "etims.internalData": result.internalData ?? "",
    "etims.qrData": result.qrData ?? "",
    "etims.responseCode": result.responseCode ?? "",
    "etims.responseMessage": result.responseMessage ?? "Accepted by KRA eTIMS.",
    "etims.requestId": result.requestId,
    "etims.submittedAt": now,
    "etims.acceptedAt": now,
    "etims.rejectedAt": null,
    "etims.connectorResponse": result.connectorResponse,
  };
  if (event.aggregateType === "INVOICE") {
    const invoice = await FiscalInvoiceModel.findOneAndUpdate(
      { _id: event.aggregateId, status: { $in: ["ETIMS_SUBMITTING", "ETIMS_RECONCILIATION_REQUIRED"] } },
      {
        $set: {
          status: "DELIVERY_QUEUED",
          ...fiscalSet,
          emailDeliveryStatus: "PENDING",
        },
      },
      { returnDocument: "after" },
    ).lean().exec();
    if (invoice) {
      await WorkflowInstanceModel.updateOne(
        { _id: invoice.workflowId, "financial.invoices.invoiceId": invoice.invoiceId },
        {
          $set: {
            "financial.invoices.$[item].status": "etims_accepted",
            "financial.invoiceStatus": "etims_accepted",
            "tasks.$[financeTask].status": "completed",
            "tasks.$[financeTask].completedAt": now,
            "tasks.$[financeTask].completedByUserId": invoice.approvedByUserId,
            "tasks.$[financeTask].completionNotes": `${invoice.invoiceNumber} accepted by KRA eTIMS.`,
            nextAction: "Preparing the accepted fiscal invoice for client delivery",
          },
        },
        { arrayFilters: [{ "item.invoiceId": invoice.invoiceId }, { "financeTask.key": { $in: ["approve_invoice", "issue_invoice"] } }] },
      ).exec();
    }
  } else {
    const note = await AdjustmentNoteModel.findOneAndUpdate(
      { _id: event.aggregateId, status: { $in: ["ETIMS_SUBMITTING", "ETIMS_RECONCILIATION_REQUIRED"] } },
      {
        $set: {
          status: "DELIVERY_QUEUED",
          ...fiscalSet,
          emailDeliveryStatus: "PENDING",
        },
      },
      { returnDocument: "after" },
    ).lean().exec();
    if (note) {
      await FiscalInvoiceModel.updateOne(
        {
          _id: note.originalInvoiceId,
          adjustmentNoteId: note._id,
          adjustmentStatus: { $in: ["RESERVED", "SUBMITTING", "RECONCILIATION_REQUIRED"] },
        },
        {
          $set: {
            adjustmentStatus: "ACCEPTED",
            adjustmentAcceptedAt: now,
            netAmount: note.adjustedInvoiceNetTotal,
          },
        },
      ).exec();
    }
  }
  await Promise.all([
    EtimsOutboxEventModel.updateOne(
      { _id: event._id },
      {
        $set: {
          status: "COMPLETED",
          completedAt: now,
          connectorRequestId: result.requestId,
          lastErrorCategory: "",
          lastErrorCode: "",
          lastErrorMessage: "",
        },
        $unset: { processingLeaseExpiresAt: "", workerId: "" },
      },
    ).exec(),
    FinanceDeliveryJobModel.updateOne(
      { aggregateType: event.aggregateType, aggregateId: event.aggregateId },
      {
        $setOnInsert: {
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          status: "PENDING",
          nextAttemptAt: now,
        },
      },
      { upsert: true },
    ).exec(),
    EtimsConfigurationModel.updateOne(
      { singletonKey: "primary" },
      { $set: { lastSuccessfulTransactionAt: now } },
    ).exec(),
  ]);
  await notifyInternal(
    event,
    "Accepted by KRA eTIMS",
    `${event.aggregateType.replaceAll("_", " ")} was accepted and is being prepared for client delivery.`,
  );
}

async function rejectTransaction(event: RawOutboxEvent, result: Extract<EtimsSubmissionResult, { outcome: "REJECTED" }>) {
  const now = new Date();
  const fiscalSet = {
    "etims.status": "REJECTED",
    "etims.responseCode": result.responseCode ?? "",
    "etims.responseMessage": result.responseMessage,
    "etims.requestId": result.requestId ?? "",
    "etims.rejectedAt": now,
    "etims.connectorResponse": result.connectorResponse,
  };
  if (event.aggregateType === "INVOICE") {
    const invoice = await FiscalInvoiceModel.findOneAndUpdate(
      { _id: event.aggregateId, status: { $in: ["ETIMS_SUBMITTING", "ETIMS_RECONCILIATION_REQUIRED"] } },
      { $set: { status: "ETIMS_REJECTED", ...fiscalSet } },
      { returnDocument: "after" },
    ).lean().exec();
    if (invoice) {
      await WorkflowInstanceModel.updateOne(
        { _id: invoice.workflowId, "financial.invoices.invoiceId": invoice.invoiceId },
        {
          $set: {
            "financial.invoices.$[item].status": "etims_rejected",
            "financial.invoiceStatus": "etims_rejected",
            nextAction: "Finance must resolve the eTIMS rejection",
          },
        },
        { arrayFilters: [{ "item.invoiceId": invoice.invoiceId }, { "financeTask.key": { $in: ["approve_invoice", "issue_invoice"] } }] },
      ).exec();
    }
  } else {
    const note = await AdjustmentNoteModel.findOneAndUpdate(
      { _id: event.aggregateId, status: { $in: ["ETIMS_SUBMITTING", "ETIMS_RECONCILIATION_REQUIRED"] } },
      { $set: { status: "ETIMS_REJECTED", ...fiscalSet } },
      { returnDocument: "after" },
    ).lean().exec();
    if (note) {
      await FiscalInvoiceModel.updateOne(
        { _id: note.originalInvoiceId, adjustmentNoteId: note._id },
        {
          $set: {
            adjustmentStatus: "NONE",
            adjustmentNoteId: null,
            adjustmentType: null,
          },
          $unset: { adjustmentReservedAt: "" },
        },
      ).exec();
    }
  }
  await Promise.all([
    EtimsOutboxEventModel.updateOne(
      { _id: event._id },
      {
        $set: {
          status: "COMPLETED",
          completedAt: now,
          lastErrorCategory: "CONFIRMED_REJECTION",
          lastErrorCode: result.responseCode ?? "",
          lastErrorMessage: result.responseMessage,
        },
        $unset: { processingLeaseExpiresAt: "", workerId: "" },
      },
    ).exec(),
    EtimsConfigurationModel.updateOne(
      { singletonKey: "primary" },
      { $set: { lastFailedTransactionAt: now } },
    ).exec(),
  ]);
  await notifyInternal(event, "Rejected by KRA eTIMS", result.responseMessage);
}

async function deferTransaction(
  event: RawOutboxEvent,
  result: Extract<EtimsSubmissionResult, { outcome: "RETRY_REQUIRED" | "RECONCILIATION_REQUIRED" }>,
  initialRetrySeconds: number,
) {
  const reconciliation = result.outcome === "RECONCILIATION_REQUIRED";
  const deadLetter = !reconciliation && event.attemptCount >= event.maxAttempts;
  const aggregateStatus = reconciliation
    ? "ETIMS_RECONCILIATION_REQUIRED"
    : "ETIMS_RETRY_REQUIRED";
  const outboxStatus = reconciliation
    ? "RECONCILIATION_REQUIRED"
    : deadLetter ? "DEAD_LETTER" : "RETRY_REQUIRED";
  const nextAttemptAt = reconciliation || deadLetter
    ? null
    : nextRetryDate(event.attemptCount, initialRetrySeconds);
  const aggregateUpdate = {
    $set: {
      status: aggregateStatus,
      "etims.status": reconciliation ? "RECONCILIATION_REQUIRED" : "SUBMITTING",
      "etims.requestId": result.requestId ?? "",
      "etims.responseCode": result.responseCode ?? "",
      "etims.responseMessage": result.responseMessage,
    },
  };
  if (event.aggregateType === "INVOICE") {
    await FiscalInvoiceModel.updateOne(
      { _id: event.aggregateId, status: "ETIMS_SUBMITTING" },
      aggregateUpdate,
    ).exec();
  } else {
    await AdjustmentNoteModel.updateOne(
      { _id: event.aggregateId, status: "ETIMS_SUBMITTING" },
      aggregateUpdate,
    ).exec();
  }
  if (event.aggregateType !== "INVOICE" && reconciliation) {
    const note = await AdjustmentNoteModel.findById(event.aggregateId).select("originalInvoiceId").lean().exec();
    if (note) {
      await FiscalInvoiceModel.updateOne(
        { _id: note.originalInvoiceId, adjustmentNoteId: note._id },
        { $set: { adjustmentStatus: "RECONCILIATION_REQUIRED" } },
      ).exec();
    }
  }
  await EtimsOutboxEventModel.updateOne(
    { _id: event._id },
    {
      $set: {
        status: outboxStatus,
        nextAttemptAt,
        lastErrorCategory: reconciliation ? "UNCERTAIN_SUBMISSION" : deadLetter ? "DEAD_LETTER" : "TEMPORARY_CONNECTOR_FAILURE",
        lastErrorCode: result.responseCode ?? "",
        lastErrorMessage: result.responseMessage,
      },
      $unset: { processingLeaseExpiresAt: "", workerId: "" },
    },
  ).exec();
  await notifyInternal(
    event,
    reconciliation ? "eTIMS reconciliation required" : deadLetter ? "eTIMS transaction needs Admin attention" : "eTIMS retry scheduled",
    result.responseMessage,
  );
}

async function recoverExpiredFiscalLeases(now: Date) {
  const expired = await EtimsOutboxEventModel.find({
    status: "PROCESSING",
    processingLeaseExpiresAt: { $lte: now },
  }).select("_id aggregateType aggregateId").limit(50).lean().exec();
  for (const event of expired) {
    const aggregateUpdate = {
      $set: {
        status: "ETIMS_RECONCILIATION_REQUIRED",
        "etims.status": "RECONCILIATION_REQUIRED",
        "etims.responseMessage": "The submission worker lease expired after processing started. Reconcile with KRA before any retry.",
      },
    };
    if (event.aggregateType === "INVOICE") {
      await FiscalInvoiceModel.updateOne(
        { _id: event.aggregateId, status: "ETIMS_SUBMITTING" },
        aggregateUpdate,
      ).exec();
    } else {
      await AdjustmentNoteModel.updateOne(
        { _id: event.aggregateId, status: "ETIMS_SUBMITTING" },
        aggregateUpdate,
      ).exec();
      const note = await AdjustmentNoteModel.findById(event.aggregateId).select("originalInvoiceId").lean().exec();
      if (note) {
        await FiscalInvoiceModel.updateOne(
          { _id: note.originalInvoiceId, adjustmentNoteId: note._id },
          { $set: { adjustmentStatus: "RECONCILIATION_REQUIRED" } },
        ).exec();
      }
    }
    await EtimsOutboxEventModel.updateOne(
      { _id: event._id, status: "PROCESSING" },
      {
        $set: {
          status: "RECONCILIATION_REQUIRED",
          nextAttemptAt: null,
          lastErrorCategory: "EXPIRED_SUBMISSION_LEASE",
          lastErrorMessage: "Processing ended without a confirmed response. Reconciliation is required.",
        },
        $unset: { processingLeaseExpiresAt: "", workerId: "" },
      },
    ).exec();
  }
}

async function claimEtimsEvent(workerId: string) {
  const now = new Date();
  await recoverExpiredFiscalLeases(now);
  return EtimsOutboxEventModel.findOneAndUpdate(
    {
      status: { $in: ["PENDING", "RETRY_REQUIRED"] },
      nextAttemptAt: { $lte: now },
      $or: [
        { processingLeaseExpiresAt: null },
        { processingLeaseExpiresAt: { $lte: now } },
      ],
    },
    {
      $set: {
        status: "PROCESSING",
        processingStartedAt: now,
        processingLeaseExpiresAt: new Date(now.getTime() + 2 * 60_000),
        lastAttemptAt: now,
        workerId,
      },
      $inc: { attemptCount: 1 },
    },
    { sort: { nextAttemptAt: 1, createdAt: 1 }, returnDocument: "after" },
  ).lean().exec() as unknown as RawOutboxEvent | null;
}

export async function processNextEtimsEvent(workerId = `worker-${randomUUID()}`) {
  await connectToDatabase();
  const event = await claimEtimsEvent(workerId);
  if (!event) return { processed: false as const };
  try {
    const [configuration, envelope] = await Promise.all([
      getOperationalEtimsConfiguration(),
      loadEnvelope(event),
    ]);
    const marked = await markSubmitting(event, configuration);
    if (!marked) {
      await EtimsOutboxEventModel.updateOne(
        { _id: event._id, status: "PROCESSING" },
        {
          $set: {
            status: "DEAD_LETTER",
            nextAttemptAt: null,
            lastErrorCategory: "STALE_AGGREGATE_STATE",
            lastErrorMessage: "The fiscal record is no longer eligible for submission.",
          },
          $unset: { processingLeaseExpiresAt: "", workerId: "" },
        },
      ).exec();
      return { processed: true as const, outcome: "stale_aggregate" };
    }
    if (!envelope) {
      await deferTransaction(
        event,
        { outcome: "RETRY_REQUIRED", responseMessage: "The immutable fiscal snapshot is missing." },
        configuration.initialRetrySeconds,
      );
      return { processed: true as const, outcome: "missing_snapshot" };
    }
    const connector = createEtimsConnector(configuration);
    const result = event.eventType === "SUBMIT_SALE"
      ? await connector.submitSale(envelope)
      : event.eventType === "SUBMIT_CREDIT_NOTE"
        ? await connector.submitCreditNote(envelope)
        : await connector.submitDebitNote(envelope);
    if (result.outcome === "ACCEPTED") await acceptTransaction(event, result);
    else if (result.outcome === "REJECTED") await rejectTransaction(event, result);
    else await deferTransaction(event, result, configuration.initialRetrySeconds);
    return { processed: true as const, outcome: result.outcome, aggregateId: event.aggregateId.toString() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The eTIMS worker failed unexpectedly.";
    const aggregateUpdate = {
      $set: {
        status: "ETIMS_RETRY_REQUIRED",
        "etims.status": "SUBMITTING",
        "etims.responseMessage": message.slice(0, 300),
      },
    };
    if (event.aggregateType === "INVOICE") {
      await FiscalInvoiceModel.updateOne(
        { _id: event.aggregateId, status: { $in: ["ETIMS_QUEUED", "ETIMS_SUBMITTING"] } },
        aggregateUpdate,
      ).exec();
    } else {
      await AdjustmentNoteModel.updateOne(
        { _id: event.aggregateId, status: { $in: ["ETIMS_QUEUED", "ETIMS_SUBMITTING"] } },
        aggregateUpdate,
      ).exec();
    }
    const deadLetter = event.attemptCount >= event.maxAttempts;
    await EtimsOutboxEventModel.updateOne(
      { _id: event._id },
      {
        $set: {
          status: deadLetter ? "DEAD_LETTER" : "RETRY_REQUIRED",
          nextAttemptAt: deadLetter ? null : nextRetryDate(event.attemptCount, 60),
          lastErrorCategory: deadLetter ? "DEAD_LETTER" : "WORKER_FAILURE",
          lastErrorMessage: message.slice(0, 300),
        },
        $unset: { processingLeaseExpiresAt: "", workerId: "" },
      },
    ).exec();
    return { processed: true as const, outcome: deadLetter ? "DEAD_LETTER" : "worker_failure", aggregateId: event.aggregateId.toString() };
  }
}

function companyDetails(
  settings: Awaited<ReturnType<typeof getPlatformSettings>>,
  snapshot: unknown,
) {
  const seller = snapshot && typeof snapshot === "object"
    ? (snapshot as { seller?: Record<string, unknown> }).seller
    : undefined;
  const text = (key: string, fallback: string) => {
    const value = seller?.[key];
    return typeof value === "string" && value.trim() ? value : fallback;
  };
  return {
    ...settings.company,
    legalName: text("legalName", settings.company.legalName),
    tradingName: text("tradingName", settings.company.tradingName),
    registrationNumber: text("registrationNumber", settings.company.registrationNumber),
    kraPin: text("kraPin", settings.company.kraPin),
    address: text("address", settings.company.address),
    email: text("email", settings.company.email),
    phone: text("phone", settings.company.phone),
    website: text("website", settings.company.website),
  };
}

async function storeFiscalPdf(key: string, bytes: Uint8Array) {
  const configuration = getR2Configuration();
  await getR2Client().send(new PutObjectCommand({
    Bucket: configuration.bucketName,
    Key: key,
    Body: bytes,
    ContentType: "application/pdf",
    CacheControl: "private, no-store",
  }));
}

async function claimDeliveryJob() {
  const now = new Date();
  await FinanceDeliveryJobModel.updateMany(
    { status: "PROCESSING", processingLeaseExpiresAt: { $lte: now } },
    { $set: { status: "RETRY_REQUIRED", nextAttemptAt: now, lastErrorMessage: "Delivery worker lease expired; delivery retry scheduled." }, $unset: { processingLeaseExpiresAt: "" } },
  ).exec();
  return FinanceDeliveryJobModel.findOneAndUpdate(
    {
      status: { $in: ["PENDING", "RETRY_REQUIRED", "PARTIALLY_DELIVERED"] },
      nextAttemptAt: { $lte: now },
      $or: [
        { processingLeaseExpiresAt: null },
        { processingLeaseExpiresAt: { $lte: now } },
      ],
    },
    {
      $set: {
        status: "PROCESSING",
        processingLeaseExpiresAt: new Date(now.getTime() + 2 * 60_000),
      },
      $inc: { attemptCount: 1 },
    },
    { sort: { nextAttemptAt: 1 }, returnDocument: "after" },
  ).exec();
}

export async function processNextFinanceDelivery() {
  await connectToDatabase();
  const job = await claimDeliveryJob();
  if (!job) return { processed: false as const };
  try {
    const settings = await getPlatformSettings();
    if (job.aggregateType === "INVOICE") {
      const invoice = await FiscalInvoiceModel.findOne({
        _id: job.aggregateId,
        "etims.status": "ACCEPTED",
        status: { $in: ["DELIVERY_QUEUED", "PARTIALLY_DELIVERED", "ETIMS_ACCEPTED"] },
      }).exec();
      if (!invoice) throw new Error("The accepted fiscal invoice could not be loaded.");
      let pdfBytes: Uint8Array;
      if (!invoice.finalPdfStorageKey || job.pdfStatus !== "COMPLETED") {
        pdfBytes = await createFiscalInvoicePdf({ invoice, company: companyDetails(settings, invoice.snapshot) });
        const key = `finance/invoices/${invoice._id.toString()}/${invoice.invoiceNumber}.pdf`;
        await storeFiscalPdf(key, pdfBytes);
        invoice.finalPdfStorageKey = key;
        invoice.finalPdfFileName = `${invoice.invoiceNumber}.pdf`;
        invoice.finalPdfGeneratedAt = new Date();
        job.pdfStatus = "COMPLETED";
      } else {
        const configuration = getR2Configuration();
        const response = await getR2Client().send(new GetObjectCommand({
          Bucket: configuration.bucketName,
          Key: invoice.finalPdfStorageKey,
        }));
        pdfBytes = new Uint8Array(await response.Body!.transformToByteArray());
      }
      if (!invoice.portalPublishedAt) {
        invoice.portalPublishedAt = new Date();
        job.portalStatus = "COMPLETED";
        await createCommunicationNotification({
          recipientUserId: invoice.clientUserId.toString(),
          type: "invoice_generated",
          title: "Your KRA eTIMS invoice is ready",
          description: `${invoice.invoiceNumber} is available in your portal.`,
          relatedModule: "invoices",
          relatedRecordId: invoice._id.toString(),
          actionUrl: `/client/invoices/${invoice.workflowId.toString()}`,
        });
      }
      const delivery = await sendClientJourneyEmailToUser({
        clientUserId: invoice.clientUserId.toString(),
        fallbackName: invoice.clientName,
        title: "Your KRA eTIMS fiscal invoice is ready",
        summary: `${invoice.invoiceNumber} for ${invoice.currency} ${invoice.totalAmount.toLocaleString("en-KE")} has been accepted by KRA eTIMS.`,
        actionLabel: "Open invoice",
        actionPath: `/client/invoices/${invoice.workflowId.toString()}`,
        attachments: [{
          filename: `${invoice.invoiceNumber}.pdf`,
          content: Buffer.from(pdfBytes),
          contentType: "application/pdf",
        }],
      });
      invoice.emailDeliveryStatus = delivery.delivered ? "SENT" : "FAILED";
      invoice.emailedTo = delivery.recipient;
      invoice.emailSentAt = delivery.delivered ? new Date() : null;
      invoice.emailDeliveryError = delivery.delivered ? "" : delivery.reason ?? "Email delivery failed.";
      invoice.status = delivery.delivered ? "DELIVERED" : "PARTIALLY_DELIVERED";
      job.emailStatus = delivery.delivered ? "COMPLETED" : "FAILED";
      await invoice.save();
      await WorkflowInstanceModel.updateOne(
        { _id: invoice.workflowId, "financial.invoices.invoiceId": invoice.invoiceId },
        {
          $set: {
            "financial.invoices.$[item].sentAt": invoice.portalPublishedAt,
            "financial.invoices.$[item].emailDeliveryStatus": delivery.delivered ? "sent" : "failed",
            "financial.invoices.$[item].emailedTo": delivery.recipient,
            "financial.invoices.$[item].emailSentAt": delivery.delivered ? new Date() : null,
            "financial.invoices.$[item].emailDeliveryError": delivery.delivered ? "" : delivery.reason ?? "Email delivery failed.",
            nextAction: "Await client payment",
          },
        },
        { arrayFilters: [{ "item.invoiceId": invoice.invoiceId }] },
      ).exec();
    } else {
      const note = await AdjustmentNoteModel.findOne({
        _id: job.aggregateId,
        "etims.status": "ACCEPTED",
        status: { $in: ["DELIVERY_QUEUED", "PARTIALLY_DELIVERED", "ETIMS_ACCEPTED"] },
      }).exec();
      if (!note) throw new Error("The accepted fiscal adjustment note could not be loaded.");
      let pdfBytes: Uint8Array;
      if (!note.finalPdfStorageKey || job.pdfStatus !== "COMPLETED") {
        pdfBytes = await createAdjustmentNotePdf({ note, company: companyDetails(settings, note.snapshot) });
        const key = `finance/adjustments/${note._id.toString()}/${note.noteNumber}.pdf`;
        await storeFiscalPdf(key, pdfBytes);
        note.finalPdfStorageKey = key;
        note.finalPdfFileName = `${note.noteNumber}.pdf`;
        note.finalPdfGeneratedAt = new Date();
        job.pdfStatus = "COMPLETED";
      } else {
        const configuration = getR2Configuration();
        const response = await getR2Client().send(new GetObjectCommand({
          Bucket: configuration.bucketName,
          Key: note.finalPdfStorageKey,
        }));
        pdfBytes = new Uint8Array(await response.Body!.transformToByteArray());
      }
      if (!note.portalPublishedAt) {
        note.portalPublishedAt = new Date();
        job.portalStatus = "COMPLETED";
        await createCommunicationNotification({
          recipientUserId: note.clientUserId.toString(),
          type: "invoice_generated",
          title: `${note.type === "CREDIT_NOTE" ? "Credit" : "Debit"} note issued`,
          description: `${note.noteNumber} is available in your portal.`,
          relatedModule: "invoices",
          relatedRecordId: note._id.toString(),
          actionUrl: `/client/invoices/${note.workflowId.toString()}`,
        });
      }
      const label = note.type === "CREDIT_NOTE" ? "credit note" : "debit note";
      const delivery = await sendClientJourneyEmailToUser({
        clientUserId: note.clientUserId.toString(),
        fallbackName: note.clientName,
        title: `Your KRA eTIMS ${label} is ready`,
        summary: `${note.noteNumber} adjusts ${note.originalInternalInvoiceNumber} by ${note.currency} ${note.totalAmount.toLocaleString("en-KE")}. ${note.reasonDescription}`,
        actionLabel: "Open invoice",
        actionPath: `/client/invoices/${note.workflowId.toString()}`,
        attachments: [{ filename: `${note.noteNumber}.pdf`, content: Buffer.from(pdfBytes), contentType: "application/pdf" }],
      });
      note.emailDeliveryStatus = delivery.delivered ? "SENT" : "FAILED";
      note.emailedTo = delivery.recipient;
      note.emailSentAt = delivery.delivered ? new Date() : null;
      note.emailDeliveryError = delivery.delivered ? "" : delivery.reason ?? "Email delivery failed.";
      note.status = delivery.delivered ? "DELIVERED" : "PARTIALLY_DELIVERED";
      job.emailStatus = delivery.delivered ? "COMPLETED" : "FAILED";
      await note.save();
    }
    const complete = job.portalStatus === "COMPLETED"
      && job.pdfStatus === "COMPLETED"
      && job.emailStatus === "COMPLETED";
    job.status = complete ? "COMPLETED" : "PARTIALLY_DELIVERED";
    job.completedAt = complete ? new Date() : null;
    job.nextAttemptAt = complete ? null : nextRetryDate(job.attemptCount, 60);
    job.processingLeaseExpiresAt = null;
    job.lastErrorMessage = complete ? "" : "One or more delivery channels still need attention.";
    await job.save();
    return { processed: true as const, outcome: complete ? "DELIVERED" : "PARTIALLY_DELIVERED" };
  } catch (error) {
    const deadLetter = job.attemptCount >= job.maxAttempts;
    job.status = deadLetter ? "DEAD_LETTER" : "RETRY_REQUIRED";
    job.nextAttemptAt = deadLetter ? null : nextRetryDate(job.attemptCount, 60);
    job.processingLeaseExpiresAt = null;
    job.lastErrorMessage = error instanceof Error ? error.message.slice(0, 300) : "Delivery failed.";
    await job.save();
    return { processed: true as const, outcome: deadLetter ? "DEAD_LETTER" : "RETRY_REQUIRED" };
  }
}

export async function processEtimsWorkBatch(limit = 10) {
  const fiscal: unknown[] = [];
  const delivery: unknown[] = [];
  for (let index = 0; index < Math.max(1, Math.min(limit, 50)); index += 1) {
    const result = await processNextEtimsEvent();
    if (!result.processed) break;
    fiscal.push(result);
  }
  for (let index = 0; index < Math.max(1, Math.min(limit, 50)); index += 1) {
    const result = await processNextFinanceDelivery();
    if (!result.processed) break;
    delivery.push(result);
  }
  return { fiscal, delivery };
}

export async function retryEtimsTransaction(actor: Principal, eventId: string, reason: string) {
  if (!hasPermission(actor, "etims.transaction.retry")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(eventId) || !reason.trim()) return false;
  await connectToDatabase();
  const event = await EtimsOutboxEventModel.findOneAndUpdate(
    {
      _id: eventId,
      status: { $in: ["RETRY_REQUIRED", "DEAD_LETTER"] },
    },
    {
      $set: {
        status: "PENDING",
        nextAttemptAt: new Date(),
        manualRetryReason: reason.trim(),
        lastErrorMessage: "",
      },
    },
    { returnDocument: "after" },
  ).lean().exec();
  if (!event) return false;
  if (event.aggregateType === "INVOICE") {
    await FiscalInvoiceModel.updateOne(
      { _id: event.aggregateId, status: "ETIMS_RETRY_REQUIRED" },
      { $set: { status: "ETIMS_QUEUED", "etims.status": "QUEUED" } },
    ).exec();
  } else {
    await AdjustmentNoteModel.updateOne(
      { _id: event.aggregateId, status: "ETIMS_RETRY_REQUIRED" },
      { $set: { status: "ETIMS_QUEUED", "etims.status": "QUEUED" } },
    ).exec();
  }
  await writeAuditLog({
    actor,
    action: "etims.manual_retry_requested",
    resourceType: "EtimsOutboxEvent",
    resourceId: eventId,
    reason,
    newValues: { aggregateId: event.aggregateId.toString(), status: "PENDING" },
  });
  return true;
}

export async function reconcileEtimsTransaction(actor: Principal, eventId: string) {
  if (!hasPermission(actor, "etims.transaction.reconcile")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(eventId)) return { ok: false as const, outcome: "not_found" };
  await connectToDatabase();
  const event = await EtimsOutboxEventModel.findOne({
    _id: eventId,
    status: "RECONCILIATION_REQUIRED",
  }).lean().exec() as unknown as RawOutboxEvent | null;
  if (!event) return { ok: false as const, outcome: "not_found" };
  const [configuration, envelope] = await Promise.all([
    getOperationalEtimsConfiguration(),
    loadEnvelope(event),
  ]);
  if (!envelope) return { ok: false as const, outcome: "missing_snapshot" };
  const result = await createEtimsConnector(configuration).reconcileTransaction(envelope);
  if (result.outcome === "ACCEPTED") await acceptTransaction(event, result.result);
  else if (result.outcome === "REJECTED") await rejectTransaction(event, result.result);
  else {
    await EtimsOutboxEventModel.updateOne(
      { _id: event._id },
      { $set: { lastErrorMessage: result.message } },
    ).exec();
  }
  await writeAuditLog({
    actor,
    action: "etims.reconciliation_completed",
    resourceType: "EtimsOutboxEvent",
    resourceId: eventId,
    newValues: { outcome: result.outcome },
  });
  return { ok: true as const, outcome: result.outcome };
}

export async function retryFinanceDelivery(actor: Principal, jobId: string, reason: string) {
  if (!hasPermission(actor, "finance_delivery.retry")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(jobId) || !reason.trim()) return false;
  await connectToDatabase();
  const result = await FinanceDeliveryJobModel.updateOne(
    { _id: jobId, status: { $in: ["PARTIALLY_DELIVERED", "RETRY_REQUIRED", "DEAD_LETTER"] } },
    {
      $set: {
        status: "RETRY_REQUIRED",
        nextAttemptAt: new Date(),
        lastErrorMessage: "",
      },
    },
  ).exec();
  await writeAuditLog({
    actor,
    action: "finance.delivery_retry_requested",
    resourceType: "FinanceDeliveryJob",
    resourceId: jobId,
    reason,
  });
  return result.modifiedCount > 0;
}
