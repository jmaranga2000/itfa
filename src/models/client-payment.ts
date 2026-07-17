import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const clientPaymentSchema = new Schema(
  {
    clientUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    workflowId: { type: Schema.Types.ObjectId, required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: "KES" },
    method: { type: String, enum: ["bank_transfer", "mpesa", "card", "other"], required: true },
    transactionReference: { type: String, required: true, trim: true, index: true },
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending", index: true },
    submittedAt: { type: Date, default: Date.now, index: true },
    verifiedAt: { type: Date, default: null },
    reviewNote: { type: String, default: "" },
  },
  {
    collection: "client_payments",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

clientPaymentSchema.index({ clientUserId: 1, submittedAt: -1 });
clientPaymentSchema.index({ workflowId: 1, transactionReference: 1 }, { unique: true });

export type ClientPaymentDocument = InferSchemaType<typeof clientPaymentSchema>;

export const ClientPaymentModel =
  (mongoose.models.ClientPayment as Model<ClientPaymentDocument> | undefined) ??
  mongoose.model<ClientPaymentDocument>("ClientPayment", clientPaymentSchema);
