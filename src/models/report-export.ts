import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  REPORT_CATEGORIES,
  REPORT_EXPORT_FORMATS,
} from "@/features/reports/types";

const reportExportSchema = new Schema(
  {
    reportKey: { type: String, required: true, index: true },
    reportName: { type: String, required: true },
    category: { type: String, enum: REPORT_CATEGORIES, required: true, index: true },
    filters: { type: Schema.Types.Mixed, default: {} },
    format: { type: String, enum: REPORT_EXPORT_FORMATS, required: true, index: true },
    generatedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    generatedByName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "expired"],
      default: "completed",
      index: true,
    },
    fileReference: { type: String, default: "" },
    expiresAt: { type: Date, default: null, index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "report_exports",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

reportExportSchema.index({ reportKey: 1, createdAt: -1 });

export type ReportExportDocument = InferSchemaType<typeof reportExportSchema>;

export const ReportExportModel =
  (mongoose.models.ReportExport as Model<ReportExportDocument> | undefined) ??
  mongoose.model<ReportExportDocument>("ReportExport", reportExportSchema);
