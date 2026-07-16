import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  ARCHIVE_RECORD_TYPES,
  RESTORE_REQUEST_STATUSES,
  RESTORE_TYPES,
} from "@/features/archive/types";

const archiveRestoreRequestSchema = new Schema(
  {
    requestReference: { type: String, required: true, unique: true, index: true },
    archiveRecordId: { type: Schema.Types.ObjectId, ref: "ArchiveRecord", required: true, index: true },
    recordType: { type: String, enum: ARCHIVE_RECORD_TYPES, required: true, index: true },
    recordReference: { type: String, required: true },
    requestedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    requestedByName: { type: String, default: "System" },
    requestedAt: { type: Date, default: Date.now, index: true },
    restoreReason: { type: String, required: true },
    restoreType: { type: String, enum: RESTORE_TYPES, required: true },
    approvalStatus: { type: String, enum: RESTORE_REQUEST_STATUSES, default: "pending", index: true },
    assignedApproverUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    assignedApproverName: { type: String, default: "" },
    decision: { type: String, default: "" },
    decisionAt: { type: Date, default: null },
    decisionReason: { type: String, default: "" },
  },
  {
    collection: "archive_restore_requests",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

archiveRestoreRequestSchema.index({ archiveRecordId: 1, approvalStatus: 1 });

export type ArchiveRestoreRequestDocument = InferSchemaType<typeof archiveRestoreRequestSchema>;

export const ArchiveRestoreRequestModel =
  (mongoose.models.ArchiveRestoreRequest as
    | Model<ArchiveRestoreRequestDocument>
    | undefined) ??
  mongoose.model<ArchiveRestoreRequestDocument>(
    "ArchiveRestoreRequest",
    archiveRestoreRequestSchema,
  );
