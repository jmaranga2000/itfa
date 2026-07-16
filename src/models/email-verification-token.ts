import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const emailVerificationTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "email_verification_tokens",
    timestamps: true,
  },
);

emailVerificationTokenSchema.index({ userId: 1, usedAt: 1, expiresAt: 1 });

export type EmailVerificationTokenDocument = InferSchemaType<typeof emailVerificationTokenSchema>;

export const EmailVerificationTokenModel =
  (mongoose.models.EmailVerificationToken as
    | Model<EmailVerificationTokenDocument>
    | undefined) ??
  mongoose.model<EmailVerificationTokenDocument>(
    "EmailVerificationToken",
    emailVerificationTokenSchema,
  );
