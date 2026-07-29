import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { hasPermission } from "@/features/authorization/access-control";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuthorizationError } from "@/lib/errors";
import { AdjustmentNoteModel } from "@/models/adjustment-note";
import { EtimsOutboxEventModel } from "@/models/etims-outbox-event";
import { FinanceDeliveryJobModel } from "@/models/finance-delivery-job";
import { FiscalInvoiceModel } from "@/models/fiscal-invoice";

export type EtimsOperationRecord = {
  eventId: string;
  aggregateId: string;
  aggregateType: "INVOICE" | "CREDIT_NOTE" | "DEBIT_NOTE";
  reference: string;
  clientName: string;
  eventType: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  lastErrorCategory: string;
  lastErrorCode: string;
  lastErrorMessage: string;
  requestId: string;
  createdAt: string;
  lastAttemptAt: string | null;
  completedAt: string | null;
  delivery: {
    jobId: string;
    status: string;
    portalStatus: string;
    emailStatus: string;
    pdfStatus: string;
    attemptCount: number;
    lastErrorMessage: string;
  } | null;
};

type RawEvent = {
  _id: Types.ObjectId;
  aggregateId: Types.ObjectId;
  aggregateType: EtimsOperationRecord["aggregateType"];
  eventType: string;
  status: string;
  attemptCount?: number;
  maxAttempts?: number;
  connectorRequestId?: string;
  lastAttemptAt?: Date | null;
  completedAt?: Date | null;
  lastErrorCategory?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  createdAt: Date;
};

type RawDelivery = {
  _id: Types.ObjectId;
  aggregateId: Types.ObjectId;
  status: string;
  portalStatus: string;
  emailStatus: string;
  pdfStatus: string;
  attemptCount?: number;
  lastErrorMessage?: string;
};

export async function getEtimsOperations(principal: Principal) {
  if (!hasPermission(principal, "etims.transaction.read")) throw new AuthorizationError();
  await connectToDatabase();
  const events = await EtimsOutboxEventModel.find({})
    .sort({ createdAt: -1 })
    .limit(250)
    .lean()
    .exec() as unknown as RawEvent[];
  const aggregateIds = events.map((event) => event.aggregateId);
  const [invoices, notes, deliveries] = await Promise.all([
    FiscalInvoiceModel.find({ _id: { $in: aggregateIds } })
      .select("invoiceNumber clientName etims.requestId")
      .lean()
      .exec(),
    AdjustmentNoteModel.find({ _id: { $in: aggregateIds } })
      .select("noteNumber clientName etims.requestId")
      .lean()
      .exec(),
    FinanceDeliveryJobModel.find({ aggregateId: { $in: aggregateIds } })
      .lean()
      .exec() as unknown as Promise<RawDelivery[]>,
  ]);
  const invoiceById = new Map(invoices.map((invoice) => [invoice._id.toString(), invoice]));
  const noteById = new Map(notes.map((note) => [note._id.toString(), note]));
  const deliveryById = new Map(deliveries.map((delivery) => [delivery.aggregateId.toString(), delivery]));
  const records: EtimsOperationRecord[] = events.map((event) => {
    const aggregateId = event.aggregateId.toString();
    const invoice = invoiceById.get(aggregateId);
    const note = noteById.get(aggregateId);
    const delivery = deliveryById.get(aggregateId);
    return {
      eventId: event._id.toString(),
      aggregateId,
      aggregateType: event.aggregateType,
      reference: invoice?.invoiceNumber ?? note?.noteNumber ?? aggregateId,
      clientName: invoice?.clientName ?? note?.clientName ?? "Unknown client",
      eventType: event.eventType,
      status: event.status,
      attemptCount: event.attemptCount ?? 0,
      maxAttempts: event.maxAttempts ?? 0,
      lastErrorCategory: event.lastErrorCategory ?? "",
      lastErrorCode: event.lastErrorCode ?? "",
      lastErrorMessage: event.lastErrorMessage ?? "",
      requestId: event.connectorRequestId
        || invoice?.etims?.requestId
        || note?.etims?.requestId
        || "",
      createdAt: event.createdAt.toISOString(),
      lastAttemptAt: event.lastAttemptAt?.toISOString() ?? null,
      completedAt: event.completedAt?.toISOString() ?? null,
      delivery: delivery ? {
        jobId: delivery._id.toString(),
        status: delivery.status,
        portalStatus: delivery.portalStatus,
        emailStatus: delivery.emailStatus,
        pdfStatus: delivery.pdfStatus,
        attemptCount: delivery.attemptCount ?? 0,
        lastErrorMessage: delivery.lastErrorMessage ?? "",
      } : null,
    };
  });
  return {
    records,
    summary: {
      total: records.length,
      pending: records.filter((record) => ["PENDING", "PROCESSING", "RETRY_REQUIRED"].includes(record.status)).length,
      reconciliation: records.filter((record) => record.status === "RECONCILIATION_REQUIRED").length,
      deadLetter: records.filter((record) => record.status === "DEAD_LETTER").length,
      deliveryAttention: records.filter((record) =>
        record.delivery && ["PARTIALLY_DELIVERED", "RETRY_REQUIRED", "DEAD_LETTER"].includes(record.delivery.status)).length,
    },
  };
}

export async function getFiscalOperationForAggregate(principal: Principal, aggregateId: string) {
  if (!hasPermission(principal, "etims.transaction.read") || !Types.ObjectId.isValid(aggregateId)) return null;
  const data = await getEtimsOperations(principal);
  return data.records.find((record) => record.aggregateId === aggregateId) ?? null;
}
