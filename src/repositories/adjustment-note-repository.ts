import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { hasPermission } from "@/features/authorization/access-control";
import { verifyPassword } from "@/features/auth/password";
import { writeAuditLog } from "@/features/audit/audit-service";
import type { AdjustmentNoteType } from "@/features/etims/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuthorizationError } from "@/lib/errors";
import { AdjustmentNoteModel } from "@/models/adjustment-note";
import { EtimsOutboxEventModel } from "@/models/etims-outbox-event";
import { FiscalInvoiceModel } from "@/models/fiscal-invoice";
import { UserModel } from "@/models/user";
import { createCommunicationNotification } from "@/repositories/communication-repository";
import { deterministicPayloadHash } from "@/repositories/fiscal-invoice-repository";
import { getEtimsConfiguration } from "@/repositories/etims-configuration-repository";

export type AdjustmentNoteRecord = {
  id: string;
  noteNumber: string;
  type: AdjustmentNoteType;
  status: string;
  originalInvoiceId: string;
  originalInternalInvoiceNumber: string;
  originalEtimsInvoiceNumber: string;
  clientUserId: string;
  clientName: string;
  clientEmail: string;
  workflowId: string;
  engagementReference: string;
  reasonCode: string;
  reasonDescription: string;
  internalExplanation: string;
  currency: string;
  lines: Array<{ lineId: string; description: string; adjustmentQuantity: number; adjustmentUnitPrice: number; taxTypeCode: string; taxRate: number; taxAmount: number; totalAmount: number }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  originalInvoiceTotal: number;
  adjustedInvoiceNetTotal: number;
  createdByAdminName: string;
  confirmedByAdminName: string;
  createdAt: string;
  confirmedAt: string | null;
  etimsStatus: string;
  kraReference: string;
  responseCode: string;
  responseMessage: string;
  receiptNumber: string;
  controlUnitId: string;
  finalPdfAvailable: boolean;
  portalPublishedAt: string | null;
  emailDeliveryStatus: string;
};

type RawNote = {
  _id: Types.ObjectId;
  noteNumber: string;
  type: AdjustmentNoteType;
  status: string;
  originalInvoiceId: Types.ObjectId;
  originalInternalInvoiceNumber: string;
  originalEtimsInvoiceNumber: string;
  clientUserId: Types.ObjectId;
  clientName: string;
  clientEmail: string;
  workflowId: Types.ObjectId;
  engagementReference: string;
  reasonCode: string;
  reasonDescription: string;
  internalExplanation: string;
  currency: string;
  lines: Array<{ lineId: string; description: string; adjustmentQuantity: number; adjustmentUnitPrice: number; taxTypeCode: string; taxRate: number; taxAmount: number; totalAmount: number }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  originalInvoiceTotal: number;
  adjustedInvoiceNetTotal: number;
  createdByAdminName: string;
  confirmedByAdminName?: string;
  createdAt: Date;
  confirmedAt?: Date | null;
  etims?: {
    status?: string;
    kraInvoiceNumber?: string;
    responseCode?: string;
    responseMessage?: string;
    receiptNumber?: string;
    controlUnitId?: string;
  };
  finalPdfStorageKey?: string;
  portalPublishedAt?: Date | null;
  emailDeliveryStatus?: string;
};

function serialise(note: RawNote): AdjustmentNoteRecord {
  return {
    id: note._id.toString(),
    noteNumber: note.noteNumber,
    type: note.type,
    status: note.status,
    originalInvoiceId: note.originalInvoiceId.toString(),
    originalInternalInvoiceNumber: note.originalInternalInvoiceNumber,
    originalEtimsInvoiceNumber: note.originalEtimsInvoiceNumber,
    clientUserId: note.clientUserId.toString(),
    clientName: note.clientName,
    clientEmail: note.clientEmail,
    workflowId: note.workflowId.toString(),
    engagementReference: note.engagementReference,
    reasonCode: note.reasonCode,
    reasonDescription: note.reasonDescription,
    internalExplanation: note.internalExplanation,
    currency: note.currency,
    lines: note.lines,
    subtotal: note.subtotal,
    taxAmount: note.taxAmount,
    totalAmount: note.totalAmount,
    originalInvoiceTotal: note.originalInvoiceTotal,
    adjustedInvoiceNetTotal: note.adjustedInvoiceNetTotal,
    createdByAdminName: note.createdByAdminName,
    confirmedByAdminName: note.confirmedByAdminName ?? "",
    createdAt: note.createdAt.toISOString(),
    confirmedAt: note.confirmedAt?.toISOString() ?? null,
    etimsStatus: note.etims?.status ?? "NOT_SUBMITTED",
    kraReference: note.etims?.kraInvoiceNumber ?? "",
    responseCode: note.etims?.responseCode ?? "",
    responseMessage: note.etims?.responseMessage ?? "",
    receiptNumber: note.etims?.receiptNumber ?? "",
    controlUnitId: note.etims?.controlUnitId ?? "",
    finalPdfAvailable: Boolean(note.finalPdfStorageKey),
    portalPublishedAt: note.portalPublishedAt?.toISOString() ?? null,
    emailDeliveryStatus: note.emailDeliveryStatus ?? "NOT_QUEUED",
  };
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function createAdjustmentNote(input: {
  actor: Principal;
  originalInvoiceId: string;
  type: AdjustmentNoteType;
  reasonCode: string;
  reasonDescription: string;
  internalExplanation: string;
  lines: Array<{
    originalInvoiceLineId: string;
    adjustmentQuantity: number;
    adjustmentUnitPrice: number;
  }>;
}) {
  if (!hasPermission(input.actor, "adjustment_note.create")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(input.actor.id) || !Types.ObjectId.isValid(input.originalInvoiceId)) {
    return { ok: false as const, reason: "not_found" };
  }
  if (!input.reasonCode.trim() || !input.reasonDescription.trim() || !input.internalExplanation.trim()) {
    return { ok: false as const, reason: "validation" };
  }
  await connectToDatabase();
  const noteId = new Types.ObjectId();
  const now = new Date();
  const invoice = await FiscalInvoiceModel.findOneAndUpdate(
    {
      _id: input.originalInvoiceId,
      archivedAt: null,
      status: { $in: ["ETIMS_ACCEPTED", "DELIVERY_QUEUED", "PARTIALLY_DELIVERED", "DELIVERED"] },
      "etims.status": "ACCEPTED",
      "etims.kraInvoiceNumber": { $ne: "" },
      adjustmentStatus: "NONE",
      adjustmentNoteId: null,
    },
    {
      $set: {
        adjustmentStatus: "RESERVED",
        adjustmentNoteId: noteId,
        adjustmentType: input.type,
        adjustmentReservedAt: now,
      },
    },
    { returnDocument: "after" },
  ).lean().exec();
  if (!invoice) return { ok: false as const, reason: "not_eligible" };

  try {
    const originalById = new Map(invoice.lines.map((line) => [line.lineId, line]));
    const lines = input.lines.flatMap((line) => {
      const original = originalById.get(line.originalInvoiceLineId);
      if (!original || !original.serviceMappingId) return [];
      const adjustmentQuantity = Math.max(0, line.adjustmentQuantity);
      const adjustmentUnitPrice = Math.max(0, line.adjustmentUnitPrice);
      if (input.type === "CREDIT_NOTE" && adjustmentQuantity > original.quantity) return [];
      const taxableAmount = roundMoney(adjustmentQuantity * adjustmentUnitPrice);
      const taxAmount = roundMoney(taxableAmount * original.taxRate / 100);
      return [{
        lineId: randomUUID(),
        originalInvoiceLineId: original.lineId,
        serviceMappingId: original.serviceMappingId,
        description: original.description,
        originalQuantity: original.quantity,
        adjustmentQuantity,
        originalUnitPrice: original.unitPrice,
        adjustmentUnitPrice,
        taxableAmount,
        taxTypeCode: original.taxTypeCode,
        taxRate: original.taxRate,
        taxAmount,
        totalAmount: roundMoney(taxableAmount + taxAmount),
      }];
    });
    const subtotal = roundMoney(lines.reduce((total, line) => total + line.taxableAmount, 0));
    const taxAmount = roundMoney(lines.reduce((total, line) => total + line.taxAmount, 0));
    const totalAmount = roundMoney(subtotal + taxAmount);
    if (lines.length === 0 || totalAmount <= 0) throw new Error("No valid adjustment lines were supplied.");
    if (input.type === "CREDIT_NOTE" && totalAmount > invoice.netAmount) {
      throw new Error("The credit cannot exceed the current net invoice amount.");
    }
    const adjustedInvoiceNetTotal = input.type === "CREDIT_NOTE"
      ? roundMoney(invoice.netAmount - totalAmount)
      : roundMoney(invoice.netAmount + totalAmount);
    const year = now.getFullYear();
    const prefix = input.type === "CREDIT_NOTE" ? "CN" : "DN";
    const noteNumber = `${prefix}-${year}-${randomBytes(4).toString("hex").toUpperCase()}`;
    await AdjustmentNoteModel.create({
      _id: noteId,
      noteNumber,
      type: input.type,
      status: "DRAFT",
      originalInvoiceId: invoice._id,
      originalInternalInvoiceNumber: invoice.invoiceNumber,
      originalEtimsInvoiceNumber: invoice.etims.kraInvoiceNumber,
      originalReceiptNumber: invoice.etims.receiptNumber,
      originalControlUnitId: invoice.etims.controlUnitId,
      clientUserId: invoice.clientUserId,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      workflowId: invoice.workflowId,
      engagementReference: invoice.engagementReference,
      reasonCode: input.reasonCode.trim(),
      reasonDescription: input.reasonDescription.trim(),
      internalExplanation: input.internalExplanation.trim(),
      currency: invoice.currency,
      lines,
      subtotal,
      taxAmount,
      totalAmount,
      originalInvoiceTotal: invoice.totalAmount,
      adjustedInvoiceNetTotal,
      createdByAdminId: new Types.ObjectId(input.actor.id),
      createdByAdminName: input.actor.displayName || input.actor.email,
    });
    await writeAuditLog({
      actor: input.actor,
      action: input.type === "CREDIT_NOTE" ? "credit_note.created" : "debit_note.created",
      resourceType: "AdjustmentNote",
      resourceId: noteId.toString(),
      newValues: {
        noteNumber,
        originalInvoiceId: invoice._id.toString(),
        type: input.type,
        totalAmount,
        adjustmentStatus: "RESERVED",
      },
    });
    return { ok: true as const, noteId: noteId.toString() };
  } catch (error) {
    await FiscalInvoiceModel.updateOne(
      { _id: invoice._id, adjustmentNoteId: noteId, adjustmentStatus: "RESERVED" },
      {
        $set: { adjustmentStatus: "NONE", adjustmentNoteId: null, adjustmentType: null },
        $unset: { adjustmentReservedAt: "" },
      },
    ).exec();
    return {
      ok: false as const,
      reason: "validation",
      message: error instanceof Error ? error.message : "The adjustment note is invalid.",
    };
  }
}

async function verifyRecentPassword(actor: Principal, password: string) {
  if (!Types.ObjectId.isValid(actor.id) || !password) return false;
  const user = await UserModel.findById(actor.id).select("+passwordHash").lean().exec();
  return Boolean(user?.passwordHash && await verifyPassword(password, user.passwordHash));
}

export async function confirmAdjustmentNote(input: {
  actor: Principal;
  noteId: string;
  password: string;
  confirmationPhrase: string;
}) {
  if (!hasPermission(input.actor, "adjustment_note.confirm")
    || !hasPermission(input.actor, "adjustment_note.submit")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(input.noteId)) return { ok: false as const, reason: "not_found" };
  const database = await connectToDatabase();
  const note = await AdjustmentNoteModel.findOne({
    _id: input.noteId,
    status: "DRAFT",
    archivedAt: null,
  }).lean().exec();
  if (!note) return { ok: false as const, reason: "not_found" };
  const expectedPhrase = note.type === "CREDIT_NOTE" ? "ISSUE CREDIT NOTE" : "ISSUE DEBIT NOTE";
  if (input.confirmationPhrase.trim().toUpperCase() !== expectedPhrase) {
    return { ok: false as const, reason: "confirmation" };
  }
  if (!(await verifyRecentPassword(input.actor, input.password))) {
    return { ok: false as const, reason: "authentication" };
  }
  const [configuration, originalInvoice] = await Promise.all([
    getEtimsConfiguration(),
    FiscalInvoiceModel.findById(note.originalInvoiceId).select("snapshot").lean().exec(),
  ]);
  if (!configuration.readiness.ready) {
    return { ok: false as const, reason: "configuration" };
  }
  if (
    note.type === "DEBIT_NOTE"
    && (
      !configuration.debitNotePath
      || (configuration.environment === "PRODUCTION" && !configuration.debitNoteProductionVerified)
    )
  ) {
    return { ok: false as const, reason: "debit_mapping" };
  }
  const now = new Date();
  const snapshot = {
    noteId: note._id.toString(),
    noteNumber: note.noteNumber,
    type: note.type,
    originalInvoiceId: note.originalInvoiceId.toString(),
    originalInvoiceNumber: note.originalInternalInvoiceNumber,
    originalKraInvoiceNumber: note.originalEtimsInvoiceNumber,
    clientId: note.clientUserId.toString(),
    clientName: note.clientName,
    clientEmail: note.clientEmail,
    workflowId: note.workflowId.toString(),
    reasonCode: note.reasonCode,
    reasonDescription: note.reasonDescription,
    internalExplanation: note.internalExplanation,
    currency: note.currency,
    lines: note.lines,
    subtotal: note.subtotal,
    taxAmount: note.taxAmount,
    totalAmount: note.totalAmount,
    originalInvoiceTotal: note.originalInvoiceTotal,
    adjustedInvoiceNetTotal: note.adjustedInvoiceNetTotal,
    taxpayerPin: configuration.taxpayerPin,
    seller: ((originalInvoice?.snapshot as Record<string, unknown> | null)?.seller as Record<string, unknown> | undefined) ?? {},
    branchId: configuration.branchId,
    deviceId: configuration.deviceId,
    confirmedByAdminId: input.actor.id,
    confirmedAt: now.toISOString(),
    payloadVersion: 1,
  };
  const payloadHash = deterministicPayloadHash(snapshot);
  const idempotencyKey = createHash("sha256")
    .update(`adjustment:${note._id.toString()}:${note.noteNumber}:${payloadHash}`)
    .digest("hex");
  const session = await database.startSession();
  let queued = false;
  try {
    await session.withTransaction(async () => {
      const updated = await AdjustmentNoteModel.updateOne(
        { _id: note._id, status: "DRAFT", lockedAt: null },
        {
          $set: {
            status: "ETIMS_QUEUED",
            confirmedByAdminId: input.actor.id,
            confirmedByAdminName: input.actor.displayName || input.actor.email,
            confirmedAt: now,
            lockedAt: now,
            snapshot,
            payloadHash,
            payloadVersion: 1,
            "etims.provider": configuration.providerName,
            "etims.environment": configuration.environment,
            "etims.status": "QUEUED",
            "etims.idempotencyKey": idempotencyKey,
          },
        },
        { session },
      ).exec();
      if (updated.modifiedCount !== 1) throw new Error("ADJUSTMENT_QUEUE_CONFLICT");
      const reserved = await FiscalInvoiceModel.updateOne(
        { _id: note.originalInvoiceId, adjustmentNoteId: note._id, adjustmentStatus: "RESERVED" },
        { $set: { adjustmentStatus: "SUBMITTING" } },
        { session },
      ).exec();
      if (reserved.modifiedCount !== 1) throw new Error("ADJUSTMENT_QUEUE_CONFLICT");
      await EtimsOutboxEventModel.create([{
        aggregateType: note.type,
        aggregateId: note._id,
        eventType: note.type === "CREDIT_NOTE" ? "SUBMIT_CREDIT_NOTE" : "SUBMIT_DEBIT_NOTE",
        status: "PENDING",
        idempotencyKey,
        payloadHash,
        payloadVersion: 1,
        maxAttempts: configuration.maxAttempts,
        nextAttemptAt: now,
      }], { session });
      queued = true;
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "ADJUSTMENT_QUEUE_CONFLICT") throw error;
  } finally {
    await session.endSession();
  }
  if (!queued) return { ok: false as const, reason: "conflict" };  await writeAuditLog({
    actor: input.actor,
    action: "adjustment_note.confirmed_and_queued",
    resourceType: "AdjustmentNote",
    resourceId: note._id.toString(),
    previousValues: { status: "DRAFT" },
    newValues: { status: "ETIMS_QUEUED", payloadHash, idempotencyKey },
  });
  return { ok: true as const };
}

export async function cancelAdjustmentNoteDraft(actor: Principal, noteId: string, reason: string) {
  if (!hasPermission(actor, "adjustment_note.create")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(noteId) || !reason.trim()) return false;
  await connectToDatabase();
  const note = await AdjustmentNoteModel.findOneAndUpdate(
    { _id: noteId, status: "DRAFT", archivedAt: null },
    { $set: { status: "CANCELLED" } },
    { returnDocument: "after" },
  ).lean().exec();
  if (!note) return false;
  await FiscalInvoiceModel.updateOne(
    { _id: note.originalInvoiceId, adjustmentNoteId: note._id, adjustmentStatus: "RESERVED" },
    {
      $set: { adjustmentStatus: "NONE", adjustmentNoteId: null, adjustmentType: null },
      $unset: { adjustmentReservedAt: "" },
    },
  ).exec();
  await writeAuditLog({
    actor,
    action: "adjustment_note.cancelled",
    resourceType: "AdjustmentNote",
    resourceId: noteId,
    reason,
    newValues: { status: "CANCELLED", reservationReleased: true },
  });
  return true;
}

function accessFilter(principal: Principal): Record<string, unknown> {
  if (principal.roleKeys.some((role) => role === "admin" || role === "super_admin")) {
    return { archivedAt: null };
  }
  if (principal.roleKeys.includes("finance_officer")) {
    return { archivedAt: null };
  }
  return {
    clientUserId: principal.id,
    archivedAt: null,
    status: { $in: ["ETIMS_ACCEPTED", "DELIVERY_QUEUED", "PARTIALLY_DELIVERED", "DELIVERED"] },
    "etims.status": "ACCEPTED",
    portalPublishedAt: { $ne: null },
  };
}

export async function listAdjustmentNotes(principal: Principal, originalInvoiceId?: string) {
  await connectToDatabase();
  const records = await AdjustmentNoteModel.find({
    ...accessFilter(principal),
    ...(originalInvoiceId && Types.ObjectId.isValid(originalInvoiceId)
      ? { originalInvoiceId }
      : {}),
  } as never).sort({ createdAt: -1 }).lean().exec();
  return (records as unknown as RawNote[]).map(serialise);
}

export async function getAdjustmentNote(principal: Principal, noteId: string) {
  if (!Types.ObjectId.isValid(noteId)) return null;
  await connectToDatabase();
  const note = await AdjustmentNoteModel.findOne({ _id: noteId, ...accessFilter(principal) } as never).lean().exec();
  return note ? serialise(note as unknown as RawNote) : null;
}

export async function notifyAdjustmentCreator(noteId: string, title: string, description: string) {
  const note = await AdjustmentNoteModel.findById(noteId).select("createdByAdminId").lean().exec();
  if (!note) return;
  await createCommunicationNotification({
    recipientUserId: note.createdByAdminId.toString(),
    type: "engagement_update",
    title,
    description,
    relatedModule: "invoices",
    relatedRecordId: noteId,
    actionUrl: `/admin/finance/etims/adjustments/${noteId}`,
  });
}
export async function getAdjustmentNotePdfAccess(principal: Principal, noteId: string) {
  if (!Types.ObjectId.isValid(noteId)) return null;
  await connectToDatabase();
  const note = await AdjustmentNoteModel.findOne({
    _id: noteId,
    ...accessFilter(principal),
    finalPdfStorageKey: { $ne: "" },
    "etims.status": "ACCEPTED",
  } as never).select("finalPdfStorageKey finalPdfFileName").lean().exec();
  if (!note?.finalPdfStorageKey) return null;
  return {
    storageKey: note.finalPdfStorageKey,
    fileName: note.finalPdfFileName || "fiscal-adjustment-note.pdf",
  };
}