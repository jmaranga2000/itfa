import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const financeDeliveryJobSchema = new Schema(
  {
    aggregateType: { type: String, enum: ["INVOICE", "CREDIT_NOTE", "DEBIT_NOTE"], required: true, index: true },
    aggregateId: { type: Schema.Types.ObjectId, required: true, index: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PARTIALLY_DELIVERED", "COMPLETED", "RETRY_REQUIRED", "DEAD_LETTER"],
      default: "PENDING",
      index: true,
    },
    portalStatus: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "PENDING" },
    emailStatus: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "PENDING" },
    pdfStatus: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "PENDING" },
    attemptCount: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    nextAttemptAt: { type: Date, default: null, index: true },
    processingLeaseExpiresAt: { type: Date, default: null, index: true },
    lastErrorMessage: { type: String, default: "" },
    completedAt: { type: Date, default: null },
  },
  { collection: "finance_delivery_jobs", timestamps: true, optimisticConcurrency: true },
);

financeDeliveryJobSchema.index({ aggregateType: 1, aggregateId: 1 }, { unique: true });
financeDeliveryJobSchema.index({ status: 1, nextAttemptAt: 1 });

export type FinanceDeliveryJobDocument = InferSchemaType<typeof financeDeliveryJobSchema>;
export const FinanceDeliveryJobModel =
  (mongoose.models.FinanceDeliveryJob as Model<FinanceDeliveryJobDocument> | undefined)
  ?? mongoose.model<FinanceDeliveryJobDocument>("FinanceDeliveryJob", financeDeliveryJobSchema);
