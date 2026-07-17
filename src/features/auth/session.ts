import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { getPrincipalByUserId } from "@/repositories/user-repository";
import { getServerEnv } from "@/lib/env";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuthSessionModel } from "@/models/auth-session";

export const AUTH_COOKIE_NAME = "ifta_session";

type RequestMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getSessionExpiry() {
  const sessionDays = getServerEnv().AUTH_SESSION_DAYS;
  return new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);
}

export async function createSession(userId: string, metadata: RequestMetadata = {}) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Cannot create a session for an invalid user.");
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = getSessionExpiry();

  await AuthSessionModel.create({
    userId: new Types.ObjectId(userId),
    tokenHash: hashSessionToken(token),
    expiresAt,
    revokedAt: null,
    ipAddress: metadata.ipAddress ?? null,
    userAgent: metadata.userAgent ?? null,
  });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { expiresAt };
}

export async function getCurrentSessionPrincipal() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  await connectToDatabase();

  const session = await AuthSessionModel.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
    revokedAt: null,
  })
    .lean()
    .exec();

  if (!session) {
    return null;
  }

  return getPrincipalByUserId(session.userId.toString());
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    await connectToDatabase();
    await AuthSessionModel.updateOne(
      { tokenHash: hashSessionToken(token), revokedAt: null },
      { $set: { revokedAt: new Date() } },
    ).exec();
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function revokeUserSessions(userId: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userId)) {
    return null;
  }

  return AuthSessionModel.updateMany(
    { userId: new Types.ObjectId(userId), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  ).exec();
}
