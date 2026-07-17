import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const quotationLineSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, default: null },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const quotationSchema = new Schema(
  {
    number: { type: String, required: true, unique: true, index: true },
    requestId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
    clientUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: ["draft", "sent", "accepted", "declined", "expired"], default: "draft", index: true },
    currency: { type: String, required: true, default: "KES" },
    issueDate: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date, required: true },
    lines: { type: [quotationLineSchema], required: true, default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
    terms: { type: String, default: "" },
    createdByUserId: { type: Schema.Types.ObjectId, required: true },
    createdByName: { type: String, required: true },
    sentAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
  },
  { collection: "quotations", timestamps: true, optimisticConcurrency: true },
);

quotationSchema.index({ clientUserId: 1, createdAt: -1 });
quotationSchema.index({ status: 1, validUntil: 1 });

export type QuotationDocument = InferSchemaType<typeof quotationSchema>;

export const QuotationModel =
  (mongoose.models.Quotation as Model<QuotationDocument> | undefined) ??
  mongoose.model<QuotationDocument>("Quotation", quotationSchema);
