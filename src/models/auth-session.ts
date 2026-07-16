import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const authSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null, index: true },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    collection: "auth_sessions",
    timestamps: true,
  },
);

authSessionSchema.index({ userId: 1, expiresAt: 1 });

export type AuthSessionDocument = InferSchemaType<typeof authSessionSchema>;

export const AuthSessionModel =
  (mongoose.models.AuthSession as Model<AuthSessionDocument> | undefined) ??
  mongoose.model<AuthSessionDocument>("AuthSession", authSessionSchema);
