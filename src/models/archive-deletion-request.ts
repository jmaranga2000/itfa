import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  ARCHIVE_RECORD_TYPES,
  DELETION_STATUSES,
} from "@/features/archive/types";

const archiveDeletionRequestSchema = new Schema(
  {
    requestReference: { type: String, required: true, unique: true, index: true },
    archiveRecordId: { type: Schema.Types.ObjectId, ref: "ArchiveRecord", required: true, index: true },
    recordType: { type: String, enum: ARCHIVE_RECORD_TYPES, required: true, index: true },
    recordReference: { type: String, required: true },
    retentionExpiryDate: { type: Date, default: null, index: true },
    legalHoldStatus: { type: String, default: "" },
    requestedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    requestedByName: { type: String, default: "System" },
    requestedAt: { type: Date, default: Date.now, index: true },
    deletionReason: { type: String, required: true },
    approvedByUserId: { type: Schema.Types.ObjectId, default: null },
    approvedByName: { type: String, default: "" },
    approvedAt: { type: Date, default: null },
    scheduledDeletionDate: { type: Date, default: null, index: true },
    status: { type: String, enum: DELETION_STATUSES, default: "deletion_requested", index: true },
    finalConfirmation: { type: String, default: "" },
  },
  {
    collection: "archive_deletion_requests",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

archiveDeletionRequestSchema.index({ archiveRecordId: 1, status: 1 });

export type ArchiveDeletionRequestDocument = InferSchemaType<typeof archiveDeletionRequestSchema>;

export const ArchiveDeletionRequestModel =
  (mongoose.models.ArchiveDeletionRequest as
    | Model<ArchiveDeletionRequestDocument>
    | undefined) ??
  mongoose.model<ArchiveDeletionRequestDocument>(
    "ArchiveDeletionRequest",
    archiveDeletionRequestSchema,
  );
