import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const passwordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "password_reset_tokens",
    timestamps: true,
  },
);

passwordResetTokenSchema.index({ userId: 1, usedAt: 1, expiresAt: 1 });

export type PasswordResetTokenDocument = InferSchemaType<typeof passwordResetTokenSchema>;

export const PasswordResetTokenModel =
  (mongoose.models.PasswordResetToken as Model<PasswordResetTokenDocument> | undefined) ??
  mongoose.model<PasswordResetTokenDocument>("PasswordResetToken", passwordResetTokenSchema);
