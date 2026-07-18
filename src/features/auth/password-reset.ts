import { createHash, randomBytes } from "node:crypto";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getServerEnv } from "@/lib/env";
import { sendPortalEmail } from "@/lib/email/smtp";
import { AuthSessionModel } from "@/models/auth-session";
import { PasswordResetTokenModel } from "@/models/password-reset-token";
import { UserModel } from "@/models/user";
import { hashPassword } from "@/features/auth/password";
import { findUserByEmailForAuth } from "@/repositories/user-repository";

const RESET_TOKEN_HOURS = 1;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildResetUrl(token: string) {
  const baseUrl = getServerEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const delivery = await sendPortalEmail({
    recipientEmail: email,
    subject: "Reset your IFTA Consulting password",
    text: `Reset your IFTA Consulting password: ${resetUrl}`,
    html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h1>Reset your password</h1>
          <p>Use the button below to choose a new password for your IFTA Consulting portal account.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#03363D;color:#fff;padding:12px 16px;border-radius:6px;text-decoration:none;">Reset password</a></p>
          <p>This link expires in one hour. If you did not request it, you can safely ignore this email.</p>
        </div>
      `,
  });
  return delivery.delivered;
}

export async function requestPasswordReset(email: string) {
  const user = await findUserByEmailForAuth(email);

  if (!user) {
    return false;
  }

  await connectToDatabase();
  const token = randomBytes(32).toString("base64url");

  await PasswordResetTokenModel.updateMany(
    { userId: user._id, usedAt: null },
    { $set: { usedAt: new Date() } },
  ).exec();

  await PasswordResetTokenModel.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_HOURS * 60 * 60 * 1000),
    usedAt: null,
  });

  return sendPasswordResetEmail(user.email, buildResetUrl(token));
}

export async function resetPasswordWithToken(token: string, password: string) {
  await connectToDatabase();

  const record = await PasswordResetTokenModel.findOneAndUpdate(
    {
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } },
    { new: true },
  )
    .lean()
    .exec();

  if (!record) {
    return false;
  }

  await Promise.all([
    UserModel.updateOne({ _id: record.userId }, { $set: { passwordHash: await hashPassword(password) } }).exec(),
    AuthSessionModel.updateMany(
      { userId: record.userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    ).exec(),
  ]);

  return true;
}
