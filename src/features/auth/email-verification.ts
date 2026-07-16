import { createHash, randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { createTransport } from "nodemailer";
import { writeAuditLog } from "@/features/audit/audit-service";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getServerEnv } from "@/lib/env";
import { EmailVerificationTokenModel } from "@/models/email-verification-token";
import {
  findUserByEmailForVerification,
  getPrincipalByUserId,
  markUserEmailVerified,
} from "@/repositories/user-repository";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getVerificationExpiry() {
  const hours = getServerEnv().EMAIL_VERIFICATION_TOKEN_HOURS;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function buildVerificationUrl(token: string) {
  const baseUrl = getServerEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export async function createEmailVerificationToken(userId: string, email: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Cannot create a verification token for an invalid user.");
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = getVerificationExpiry();

  await EmailVerificationTokenModel.create({
    userId: new Types.ObjectId(userId),
    email,
    tokenHash: hashToken(token),
    expiresAt,
    usedAt: null,
  });

  return {
    token,
    expiresAt,
    verificationUrl: buildVerificationUrl(token),
  };
}

export async function sendVerificationEmail(email: string, verificationUrl: string) {
  const env = getServerEnv();

  if (!env.GMAIL_SMTP_USER || !env.GMAIL_SMTP_APP_PASSWORD) {
    return {
      delivered: false,
      reason: "Gmail SMTP is not configured.",
    };
  }

  try {
    const transporter = createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: env.GMAIL_SMTP_USER,
        pass: env.GMAIL_SMTP_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: {
        name: "IFTA Consulting",
        address: env.GMAIL_SMTP_USER,
      },
      to: email,
      subject: "Verify your IFTA Consulting portal account",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h1>Verify your email</h1>
          <p>Use the button below to verify your IFTA Consulting client portal account.</p>
          <p><a href="${verificationUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 16px;border-radius:6px;text-decoration:none;">Verify email</a></p>
          <p>If the button does not work, copy this link into your browser:</p>
          <p>${verificationUrl}</p>
        </div>
      `,
    });

    return {
      delivered: true,
    };
  } catch (error) {
    console.error("Gmail rejected a verification email.", error);

    return {
      delivered: false,
      reason: "Gmail rejected the message.",
    };
  }
}

export async function createAndSendVerificationEmail(userId: string, email: string) {
  const token = await createEmailVerificationToken(userId, email);
  const delivery = await sendVerificationEmail(email, token.verificationUrl);

  return {
    ...token,
    ...delivery,
  };
}

export async function verifyEmailToken(token: string) {
  await connectToDatabase();

  const record = await EmailVerificationTokenModel.findOneAndUpdate(
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
    return null;
  }

  await markUserEmailVerified(record.userId.toString());
  const principal = await getPrincipalByUserId(record.userId.toString());

  await writeAuditLog({
    actor: principal,
    action: "auth.email_verified",
    resourceType: "User",
    resourceId: record.userId.toString(),
    metadata: { email: record.email },
  });

  return principal;
}

export async function createVerificationForEmail(email: string) {
  const user = await findUserByEmailForVerification(email);

  if (!user || user.emailVerifiedAt) {
    return null;
  }

  return createAndSendVerificationEmail(user._id.toString(), user.email);
}
