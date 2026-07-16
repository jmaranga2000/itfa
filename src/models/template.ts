import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_STATUSES,
} from "@/features/templates/types";

const templateApprovalRulesSchema = new Schema(
  {
    requiredApproval: { type: Boolean, default: true },
    requiredReviewerRole: { type: String, default: "admin" },
    signatureRequired: { type: Boolean, default: false },
    humanReviewRequired: { type: Boolean, default: true },
  },
  { _id: false },
);

const templateUsageSummarySchema = new Schema(
  {
    totalUses: { type: Number, default: 0 },
    activeEngagements: { type: Number, default: 0 },
    historicalEngagements: { type: Number, default: 0 },
    generatedDocuments: { type: Number, default: 0 },
    generatedMessages: { type: Number, default: 0 },
    generatedReports: { type: Number, default: 0 },
  },
  { _id: false },
);

const templateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    category: { type: String, enum: TEMPLATE_CATEGORIES, required: true, index: true },
    description: { type: String, required: true },
    purpose: { type: String, default: "" },
    status: { type: String, enum: TEMPLATE_STATUSES, default: "draft", index: true },
    currentVersionNumber: { type: Number, default: 1 },
    publishedVersionNumber: { type: Number, default: null },
    applicableServices: { type: [String], default: [] },
    applicableClientTypes: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    ownerRole: { type: String, default: "admin" },
    approvalRules: { type: templateApprovalRulesSchema, default: () => ({}) },
    usageSummary: { type: templateUsageSummarySchema, default: () => ({}) },
    createdByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    updatedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    reviewedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    publishedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    archivedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    reviewedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null, index: true },
    lastUsedAt: { type: Date, default: null },
  },
  {
    collection: "templates",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

templateSchema.index({ category: 1, status: 1, updatedAt: -1 });
templateSchema.index({ name: "text", description: "text", purpose: "text", tags: "text" });

export type TemplateDocument = InferSchemaType<typeof templateSchema>;

export const TemplateModel =
  (mongoose.models.Template as Model<TemplateDocument> | undefined) ??
  mongoose.model<TemplateDocument>("Template", templateSchema);
