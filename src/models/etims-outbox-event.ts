import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ETIMS_OUTBOX_STATUSES } from "@/features/etims/types";

const etimsOutboxEventSchema = new Schema(
  {
    aggregateType: { type: String, enum: ["INVOICE", "CREDIT_NOTE", "DEBIT_NOTE"], required: true, index: true },
    aggregateId: { type: Schema.Types.ObjectId, required: true, index: true },
    eventType: {
      type: String,
      enum: ["SUBMIT_SALE", "SUBMIT_CREDIT_NOTE", "SUBMIT_DEBIT_NOTE", "RECONCILE_TRANSACTION"],
      required: true,
      index: true,
    },
    status: { type: String, enum: ETIMS_OUTBOX_STATUSES, default: "PENDING", index: true },
    idempotencyKey: { type: String, required: true, unique: true, immutable: true, index: true },
    payloadHash: { type: String, required: true, immutable: true },
    payloadVersion: { type: Number, required: true, immutable: true },
    attemptCount: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    nextAttemptAt: { type: Date, default: null, index: true },
    processingStartedAt: { type: Date, default: null },
    processingLeaseExpiresAt: { type: Date, default: null, index: true },
    workerId: { type: String, default: "" },
    connectorRequestId: { type: String, default: "" },
    lastAttemptAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    lastErrorCategory: { type: String, default: "" },
    lastErrorCode: { type: String, default: "" },
    lastErrorMessage: { type: String, default: "" },
    manualRetryReason: { type: String, default: "" },
  },
  { collection: "etims_outbox_events", timestamps: true, optimisticConcurrency: true },
);

etimsOutboxEventSchema.index({ status: 1, nextAttemptAt: 1, processingLeaseExpiresAt: 1 });
etimsOutboxEventSchema.index({ aggregateType: 1, aggregateId: 1, createdAt: -1 });

export type EtimsOutboxEventDocument = InferSchemaType<typeof etimsOutboxEventSchema>;
export const EtimsOutboxEventModel =
  (mongoose.models.EtimsOutboxEvent as Model<EtimsOutboxEventDocument> | undefined)
  ?? mongoose.model<EtimsOutboxEventDocument>("EtimsOutboxEvent", etimsOutboxEventSchema);
