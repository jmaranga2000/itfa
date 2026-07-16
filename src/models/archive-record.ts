import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  ARCHIVE_RECORD_TYPES,
  ARCHIVE_STATUSES,
  DELETION_STATUSES,
  LEGAL_HOLD_STATUSES,
} from "@/features/archive/types";

const archiveRecordSchema = new Schema(
  {
    archiveReference: { type: String, required: true, unique: true, index: true },
    recordId: { type: String, required: true, index: true },
    recordType: { type: String, enum: ARCHIVE_RECORD_TYPES, required: true, index: true },
    recordReference: { type: String, required: true, index: true },
    recordName: { type: String, required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, default: null, index: true },
    clientName: { type: String, default: "", index: true },
    clientOrganizationId: { type: Schema.Types.ObjectId, default: null, index: true },
    engagementId: { type: Schema.Types.ObjectId, default: null, index: true },
    engagementReference: { type: String, default: "", index: true },
    serviceId: { type: String, default: null, index: true },
    serviceName: { type: String, default: "", index: true },
    originalStatus: { type: String, required: true },
    archiveStatus: { type: String, enum: ARCHIVE_STATUSES, default: "archived", index: true },
    archiveReason: { type: String, required: true },
    archivedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    archivedByName: { type: String, default: "System" },
    archivedAt: { type: Date, default: Date.now, index: true },
    retentionPolicyId: { type: Schema.Types.ObjectId, default: null, index: true },
    retentionPolicyName: { type: String, required: true },
    retentionStartDate: { type: Date, default: Date.now, index: true },
    retentionExpiryDate: { type: Date, default: null, index: true },
    legalHoldStatus: { type: String, enum: LEGAL_HOLD_STATUSES, default: null, index: true },
    legalHoldReason: { type: String, default: "" },
    restoreEligible: { type: Boolean, default: true, index: true },
    deleteEligible: { type: Boolean, default: false, index: true },
    deletionStatus: { type: String, enum: DELETION_STATUSES, default: "not_eligible", index: true },
    readOnly: { type: Boolean, default: true },
    previousLocation: { type: String, default: "" },
    archiveNotes: { type: String, default: "" },
    clientVisible: { type: Boolean, default: false, index: true },
    snapshot: { type: Schema.Types.Mixed, default: {} },
    restoredAt: { type: Date, default: null },
    restoredByUserId: { type: Schema.Types.ObjectId, default: null },
    restoreReason: { type: String, default: "" },
    permanentlyDeletedAt: { type: Date, default: null },
    deletionEvidence: { type: String, default: "" },
  },
  {
    collection: "archive_records",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

archiveRecordSchema.index({ recordType: 1, archiveStatus: 1, archivedAt: -1 });
archiveRecordSchema.index({ retentionExpiryDate: 1, legalHoldStatus: 1 });
archiveRecordSchema.index({
  recordName: "text",
  recordReference: "text",
  clientName: "text",
  engagementReference: "text",
  archiveReference: "text",
});

export type ArchiveRecordDocument = InferSchemaType<typeof archiveRecordSchema>;

export const ArchiveRecordModel =
  (mongoose.models.ArchiveRecord as Model<ArchiveRecordDocument> | undefined) ??
  mongoose.model<ArchiveRecordDocument>("ArchiveRecord", archiveRecordSchema);
