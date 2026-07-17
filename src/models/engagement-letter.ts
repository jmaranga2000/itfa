import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const ENGAGEMENT_LETTER_STATUSES = [
  "draft",
  "awaiting_signatures",
  "partially_signed",
  "completed",
  "void",
] as const;

const engagementLetterSignerSchema = new Schema(
  {
    role: { type: String, enum: ["ifta", "client"], required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    title: { type: String, default: "", trim: true },
    required: { type: Boolean, default: true },
    status: { type: String, enum: ["pending", "signed"], default: "pending" },
    signatureText: { type: String, default: null },
    method: { type: String, enum: ["typed"], default: "typed" },
    signedByUserId: { type: Schema.Types.ObjectId, default: null },
    signedAt: { type: Date, default: null },
    ipAddressHash: { type: String, default: null },
    userAgent: { type: String, default: null },
    contentHash: { type: String, default: null },
    signatureHash: { type: String, default: null },
  },
  { _id: true },
);

const engagementLetterSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    requestId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
    requestReference: { type: String, required: true, index: true },
    workflowId: { type: Schema.Types.ObjectId, default: null, index: true },
    clientUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, required: true, lowercase: true, trim: true },
    serviceNames: { type: [String], default: [] },
    scopeItems: { type: [String], default: [] },
    fee: { type: Number, default: null },
    currency: { type: String, default: "KES", trim: true, uppercase: true },
    paymentTerms: { type: String, required: true },
    governingLaw: { type: String, required: true },
    disputeResolution: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    contentHash: { type: String, required: true },
    companySnapshot: { type: Schema.Types.Mixed, required: true },
    templateId: { type: Schema.Types.ObjectId, default: null },
    templateVersion: { type: Number, default: null },
    version: { type: Number, default: 1 },
    status: { type: String, enum: ENGAGEMENT_LETTER_STATUSES, default: "draft", index: true },
    signers: { type: [engagementLetterSignerSchema], default: [] },
    generatedByUserId: { type: Schema.Types.ObjectId, default: null },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    sentAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    voidedAt: { type: Date, default: null },
  },
  { collection: "engagement_letters", timestamps: true, optimisticConcurrency: true },
);

engagementLetterSchema.index({ clientUserId: 1, createdAt: -1 });
engagementLetterSchema.index({ status: 1, expiresAt: 1 });

export type EngagementLetterDocument = InferSchemaType<typeof engagementLetterSchema>;
export const EngagementLetterModel =
  (mongoose.models.EngagementLetter as Model<EngagementLetterDocument> | undefined) ??
  mongoose.model<EngagementLetterDocument>("EngagementLetter", engagementLetterSchema);
