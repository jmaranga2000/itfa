import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  REPORT_CATEGORIES,
  REPORT_DATE_RANGES,
} from "@/features/reports/types";

const reportSavedViewSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    reportKey: { type: String, required: true, index: true },
    category: { type: String, enum: REPORT_CATEGORIES, required: true, index: true },
    dataSource: { type: String, default: "" },
    filters: { type: Schema.Types.Mixed, default: {} },
    columns: { type: [String], default: [] },
    grouping: { type: [String], default: [] },
    sorting: { type: Schema.Types.Mixed, default: {} },
    chartConfiguration: { type: Schema.Types.Mixed, default: {} },
    dateRangeKey: { type: String, enum: REPORT_DATE_RANGES, default: "last_30_days" },
    comparisonEnabled: { type: Boolean, default: true },
    visibility: {
      type: String,
      enum: ["private", "selected_users", "role", "department", "all_authorized_admins"],
      default: "private",
      index: true,
    },
    ownerUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    ownerName: { type: String, default: "" },
    sharedRole: { type: String, default: "" },
    lastOpenedAt: { type: Date, default: null, index: true },
    archivedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "report_saved_views",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

reportSavedViewSchema.index({ reportKey: 1, ownerUserId: 1 });

export type ReportSavedViewDocument = InferSchemaType<typeof reportSavedViewSchema>;

export const ReportSavedViewModel =
  (mongoose.models.ReportSavedView as Model<ReportSavedViewDocument> | undefined) ??
  mongoose.model<ReportSavedViewDocument>("ReportSavedView", reportSavedViewSchema);
