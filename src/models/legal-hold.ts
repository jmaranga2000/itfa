import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  ARCHIVE_RECORD_TYPES,
  LEGAL_HOLD_STATUSES,
} from "@/features/archive/types";

const legalHoldSchema = new Schema(
  {
    holdReference: { type: String, required: true, unique: true, index: true },
    archiveRecordId: { type: Schema.Types.ObjectId, ref: "ArchiveRecord", required: true, index: true },
    recordType: { type: String, enum: ARCHIVE_RECORD_TYPES, required: true, index: true },
    recordId: { type: String, required: true, index: true },
    reason: { type: String, required: true },
    appliedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    appliedByName: { type: String, default: "System" },
    appliedAt: { type: Date, default: Date.now, index: true },
    reviewDate: { type: Date, default: null, index: true },
    expiryDate: { type: Date, default: null, index: true },
    status: { type: String, enum: LEGAL_HOLD_STATUSES, default: "active", index: true },
    removedByUserId: { type: Schema.Types.ObjectId, default: null },
    removedByName: { type: String, default: "" },
    removedAt: { type: Date, default: null },
    removalReason: { type: String, default: "" },
  },
  {
    collection: "legal_holds",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

legalHoldSchema.index({ archiveRecordId: 1, status: 1 });

export type LegalHoldDocument = InferSchemaType<typeof legalHoldSchema>;

export const LegalHoldModel =
  (mongoose.models.LegalHold as Model<LegalHoldDocument> | undefined) ??
  mongoose.model<LegalHoldDocument>("LegalHold", legalHoldSchema);
