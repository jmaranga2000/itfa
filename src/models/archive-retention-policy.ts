import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  ARCHIVE_RECORD_TYPES,
  RETENTION_TRIGGERS,
} from "@/features/archive/types";

const archiveRetentionPolicySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    recordType: { type: String, enum: ARCHIVE_RECORD_TYPES, required: true, index: true },
    version: { type: Number, default: 1 },
    retentionPeriodMonths: { type: Number, required: true },
    retentionStartTrigger: { type: String, enum: RETENTION_TRIGGERS, default: "archive_date" },
    warningDays: { type: [Number], default: [90, 30, 7, 0] },
    legalHoldBehavior: {
      type: String,
      enum: ["suspend_expiry", "continue_expiry_block_deletion"],
      default: "suspend_expiry",
    },
    restoreEligible: { type: Boolean, default: true },
    deletionEligible: { type: Boolean, default: false },
    requiredApproval: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
    updatedByUserId: { type: Schema.Types.ObjectId, default: null },
    updatedByName: { type: String, default: "System" },
    disabledAt: { type: Date, default: null },
  },
  {
    collection: "archive_retention_policies",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

archiveRetentionPolicySchema.index({ recordType: 1, active: 1 });
archiveRetentionPolicySchema.index({ name: 1, version: 1 }, { unique: true });

export type ArchiveRetentionPolicyDocument = InferSchemaType<typeof archiveRetentionPolicySchema>;

export const ArchiveRetentionPolicyModel =
  (mongoose.models.ArchiveRetentionPolicy as
    | Model<ArchiveRetentionPolicyDocument>
    | undefined) ??
  mongoose.model<ArchiveRetentionPolicyDocument>(
    "ArchiveRetentionPolicy",
    archiveRetentionPolicySchema,
  );
