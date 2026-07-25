import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const ACCOUNT_CLOSURE_REQUEST_STATUSES = [
  "requested",
  "approved",
  "rejected",
  "completed",
] as const;
export type AccountClosureRequestStatus = (typeof ACCOUNT_CLOSURE_REQUEST_STATUSES)[number];

const accountClosureRequestSchema = new Schema(
  {
    requestReference: { type: String, required: true, unique: true, index: true },
    clientUserId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    requestedByUserId: { type: Schema.Types.ObjectId, default: null },
    requestedByName: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now, index: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ACCOUNT_CLOSURE_REQUEST_STATUSES,
      default: "requested",
      index: true,
    },
    reviewNotes: { type: String, default: "" },
    reviewedByUserId: { type: Schema.Types.ObjectId, default: null },
    reviewedByName: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    collection: "account_closure_requests",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

accountClosureRequestSchema.index({ clientUserId: 1, status: 1 });

export type AccountClosureRequestDocument = InferSchemaType<typeof accountClosureRequestSchema>;

export const AccountClosureRequestModel =
  (mongoose.models.AccountClosureRequest as Model<AccountClosureRequestDocument> | undefined) ??
  mongoose.model<AccountClosureRequestDocument>(
    "AccountClosureRequest",
    accountClosureRequestSchema,
  );
