import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  TEMPLATE_OUTPUT_FORMATS,
  TEMPLATE_STATUSES,
} from "@/features/templates/types";

const templateVariableSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    required: { type: Boolean, default: false },
    sampleValue: { type: String, default: "" },
  },
  { _id: false },
);

const templateValidationSchema = new Schema(
  {
    publishReady: { type: Boolean, default: false },
    errors: { type: [String], default: [] },
    warnings: { type: [String], default: [] },
    lastValidatedAt: { type: Date, default: null },
  },
  { _id: false, suppressReservedKeysWarning: true },
);

const templateVersionSchema = new Schema(
  {
    templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true, index: true },
    versionNumber: { type: Number, required: true, index: true },
    status: { type: String, enum: TEMPLATE_STATUSES, default: "draft", index: true },
    subject: { type: String, default: "" },
    previewText: { type: String, default: "" },
    content: { type: String, required: true },
    plainTextContent: { type: String, default: "" },
    outputFormat: { type: String, enum: TEMPLATE_OUTPUT_FORMATS, default: "rich_text" },
    variables: { type: [templateVariableSchema], default: [] },
    requiredSections: { type: [String], default: [] },
    applicableServices: { type: [String], default: [] },
    applicableClientTypes: { type: [String], default: [] },
    settings: { type: Schema.Types.Mixed, default: {} },
    changeSummary: { type: String, default: "" },
    validation: { type: templateValidationSchema, default: () => ({}) },
    usageCount: { type: Number, default: 0 },
    createdByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    reviewedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    publishedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    archivedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    reviewedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "template_versions",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

templateVersionSchema.index({ templateId: 1, versionNumber: 1 }, { unique: true });
templateVersionSchema.index({ status: 1, updatedAt: -1 });

export type TemplateVersionDocument = InferSchemaType<typeof templateVersionSchema>;

export const TemplateVersionModel =
  (mongoose.models.TemplateVersion as Model<TemplateVersionDocument> | undefined) ??
  mongoose.model<TemplateVersionDocument>("TemplateVersion", templateVersionSchema);
