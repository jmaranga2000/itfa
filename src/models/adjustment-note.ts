import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  ADJUSTMENT_NOTE_STATUSES,
  ADJUSTMENT_NOTE_TYPES,
  ETIMS_FISCAL_STATUSES,
} from "@/features/etims/types";

const adjustmentLineSchema = new Schema(
  {
    lineId: { type: String, required: true },
    originalInvoiceLineId: { type: String, required: true },
    serviceMappingId: { type: Schema.Types.ObjectId, required: true },
    description: { type: String, required: true },
    originalQuantity: { type: Number, required: true, min: 0 },
    adjustmentQuantity: { type: Number, required: true, min: 0.000001 },
    originalUnitPrice: { type: Number, required: true, min: 0 },
    adjustmentUnitPrice: { type: Number, required: true, min: 0 },
    taxableAmount: { type: Number, required: true, min: 0 },
    taxTypeCode: { type: String, required: true },
    taxRate: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const adjustmentNoteSchema = new Schema(
  {
    noteNumber: { type: String, required: true, unique: true, immutable: true, index: true },
    type: { type: String, enum: ADJUSTMENT_NOTE_TYPES, required: true, immutable: true, index: true },
    status: { type: String, enum: ADJUSTMENT_NOTE_STATUSES, default: "DRAFT", index: true },
    originalInvoiceId: { type: Schema.Types.ObjectId, required: true, immutable: true, index: true },
    originalInternalInvoiceNumber: { type: String, required: true, immutable: true },
    originalEtimsInvoiceNumber: { type: String, required: true, immutable: true },
    originalReceiptNumber: { type: String, default: "" },
    originalControlUnitId: { type: String, default: "" },
    clientUserId: { type: Schema.Types.ObjectId, required: true, immutable: true, index: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    workflowId: { type: Schema.Types.ObjectId, required: true, immutable: true, index: true },
    engagementReference: { type: String, required: true },
    reasonCode: { type: String, required: true },
    reasonDescription: { type: String, required: true },
    internalExplanation: { type: String, required: true },
    supportingDocumentId: { type: Schema.Types.ObjectId, default: null },
    currency: { type: String, required: true },
    lines: { type: [adjustmentLineSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    originalInvoiceTotal: { type: Number, required: true, min: 0 },
    adjustedInvoiceNetTotal: { type: Number, required: true, min: 0 },
    createdByAdminId: { type: Schema.Types.ObjectId, required: true, index: true },
    createdByAdminName: { type: String, required: true },
    confirmedByAdminId: { type: Schema.Types.ObjectId, default: null },
    confirmedAt: { type: Date, default: null },
    lockedAt: { type: Date, default: null },
    snapshot: { type: Schema.Types.Mixed, default: null },
    payloadHash: { type: String, default: "" },
    payloadVersion: { type: Number, default: 1 },
    etims: {
      provider: { type: String, default: "" },
      environment: { type: String, enum: ["SANDBOX", "PRODUCTION"], default: "SANDBOX" },
      status: { type: String, enum: ETIMS_FISCAL_STATUSES, default: "NOT_SUBMITTED" },
      traderInvoiceNumber: { type: String, default: "" },
      kraInvoiceNumber: { type: String, default: "" },
      originalKraInvoiceNumber: { type: String, default: "" },
      controlUnitId: { type: String, default: "" },
      receiptNumber: { type: String, default: "" },
      receiptSignature: { type: String, default: "" },
      internalData: { type: String, default: "" },
      qrData: { type: String, default: "" },
      responseCode: { type: String, default: "" },
      responseMessage: { type: String, default: "" },
      requestId: { type: String, default: "" },
      idempotencyKey: { type: String, default: "" },
      submittedAt: { type: Date, default: null },
      acceptedAt: { type: Date, default: null },
      rejectedAt: { type: Date, default: null },
      lastAttemptAt: { type: Date, default: null },
      attemptCount: { type: Number, default: 0 },
      connectorResponse: { type: Schema.Types.Mixed, default: {} },
    },
    finalPdfStorageKey: { type: String, default: "" },
    finalPdfFileName: { type: String, default: "" },
    finalPdfGeneratedAt: { type: Date, default: null },
    portalPublishedAt: { type: Date, default: null },
    emailDeliveryStatus: {
      type: String,
      enum: ["NOT_QUEUED", "PENDING", "SENT", "FAILED"],
      default: "NOT_QUEUED",
    },
    emailedTo: { type: String, default: "" },
    emailSentAt: { type: Date, default: null },
    emailDeliveryError: { type: String, default: "" },
    archivedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "adjustment_notes",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

adjustmentNoteSchema.index(
  { originalInvoiceId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["ETIMS_ACCEPTED", "DELIVERY_QUEUED", "PARTIALLY_DELIVERED", "DELIVERED"] } },
    name: "one_accepted_adjustment_per_invoice",
  },
);
adjustmentNoteSchema.index({ clientUserId: 1, status: 1, createdAt: -1 });

export type AdjustmentNoteDocument = InferSchemaType<typeof adjustmentNoteSchema>;
export const AdjustmentNoteModel =
  (mongoose.models.AdjustmentNote as Model<AdjustmentNoteDocument> | undefined)
  ?? mongoose.model<AdjustmentNoteDocument>("AdjustmentNote", adjustmentNoteSchema);
