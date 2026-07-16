import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { TEMPLATE_CATEGORIES } from "@/features/templates/types";

const templateUsageSchema = new Schema(
  {
    templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true, index: true },
    versionId: { type: Schema.Types.ObjectId, ref: "TemplateVersion", required: true, index: true },
    templateVersion: { type: Number, required: true, index: true },
    templateCategory: { type: String, enum: TEMPLATE_CATEGORIES, required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, default: null, index: true },
    clientName: { type: String, default: "" },
    engagementId: { type: Schema.Types.ObjectId, default: null, index: true },
    engagementReference: { type: String, default: "" },
    generatedRecordType: { type: String, required: true },
    generatedRecordId: { type: String, required: true, index: true },
    renderedContent: { type: String, default: "" },
    variableSnapshot: { type: Schema.Types.Mixed, default: {} },
    usedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    usedByName: { type: String, default: "" },
    usedAt: { type: Date, default: Date.now, index: true },
  },
  {
    collection: "template_usage",
    timestamps: { createdAt: true, updatedAt: false },
  },
);

templateUsageSchema.index({ templateId: 1, templateVersion: 1, usedAt: -1 });
templateUsageSchema.index({ generatedRecordType: 1, generatedRecordId: 1 }, { unique: true });

export type TemplateUsageDocument = InferSchemaType<typeof templateUsageSchema>;

export const TemplateUsageModel =
  (mongoose.models.TemplateUsage as Model<TemplateUsageDocument> | undefined) ??
  mongoose.model<TemplateUsageDocument>("TemplateUsage", templateUsageSchema);
