import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const clientCartItemSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, required: true, index: true },
    pricingPlanId: { type: Schema.Types.ObjectId, default: null },
    quantity: { type: Number, min: 1, max: 10, default: 1 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const clientCartSchema = new Schema(
  {
    clientUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    guestTokenHash: { type: String, default: null, index: true },
    items: { type: [clientCartItemSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "submitted", "quotation_requested", "abandoned"],
      default: "active",
      index: true,
    },
    submittedRequestId: { type: Schema.Types.ObjectId, default: null },
  },
  {
    collection: "client_carts",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

clientCartSchema.index({ clientUserId: 1, status: 1 });
clientCartSchema.index({ guestTokenHash: 1, status: 1 });

export type ClientCartDocument = InferSchemaType<typeof clientCartSchema>;

export const ClientCartModel =
  (mongoose.models.ClientCart as Model<ClientCartDocument> | undefined) ??
  mongoose.model<ClientCartDocument>("ClientCart", clientCartSchema);
