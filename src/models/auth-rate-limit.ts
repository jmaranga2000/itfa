import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const authRateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, required: true, default: 0, min: 0 },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    collection: "auth_rate_limits",
    timestamps: true,
  },
);

// MongoDB removes expired windows in the background, keeping this collection bounded.
authRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type AuthRateLimitDocument = InferSchemaType<typeof authRateLimitSchema>;

export const AuthRateLimitModel =
  (mongoose.models.AuthRateLimit as Model<AuthRateLimitDocument> | undefined) ??
  mongoose.model<AuthRateLimitDocument>("AuthRateLimit", authRateLimitSchema);
