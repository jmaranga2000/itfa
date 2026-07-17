import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const pushSubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, default: "" },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { collection: "push_subscriptions", timestamps: true },
);

pushSubscriptionSchema.index({ userId: 1, updatedAt: -1 });

export type PushSubscriptionDocument = InferSchemaType<typeof pushSubscriptionSchema>;

export const PushSubscriptionModel =
  (mongoose.models.PushSubscription as Model<PushSubscriptionDocument> | undefined) ??
  mongoose.model<PushSubscriptionDocument>("PushSubscription", pushSubscriptionSchema);
