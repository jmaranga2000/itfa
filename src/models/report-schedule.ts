import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { REPORT_EXPORT_FORMATS } from "@/features/reports/types";

const reportScheduleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    savedReportId: { type: Schema.Types.ObjectId, default: null, index: true },
    reportKey: { type: String, required: true, index: true },
    recipients: { type: [String], default: [] },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly", "custom"],
      default: "weekly",
      index: true,
    },
    deliveryTime: { type: String, default: "08:00" },
    timezone: { type: String, default: "Africa/Nairobi" },
    exportFormat: { type: String, enum: REPORT_EXPORT_FORMATS, default: "xlsx" },
    emailSubject: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
    lastDeliveredAt: { type: Date, default: null },
    nextDeliveryAt: { type: Date, default: null, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
  },
  {
    collection: "report_schedules",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

export type ReportScheduleDocument = InferSchemaType<typeof reportScheduleSchema>;

export const ReportScheduleModel =
  (mongoose.models.ReportSchedule as Model<ReportScheduleDocument> | undefined) ??
  mongoose.model<ReportScheduleDocument>("ReportSchedule", reportScheduleSchema);
