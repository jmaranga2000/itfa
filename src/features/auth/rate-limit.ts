import { createHash } from "node:crypto";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuthRateLimitModel } from "@/models/auth-rate-limit";

type HeaderReader = Pick<Headers, "get">;

type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

type AuthRateLimitScope =
  | "sign-in"
  | "sign-up"
  | "verification-resend"
  | "password-reset";

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const MINUTE = 60_000;

const AUTH_RATE_LIMITS: Record<
  AuthRateLimitScope,
  { account?: RateLimitPolicy; network: RateLimitPolicy }
> = {
  "sign-in": {
    account: { limit: 5, windowMs: 15 * MINUTE },
    network: { limit: 20, windowMs: 15 * MINUTE },
  },
  "sign-up": {
    account: { limit: 3, windowMs: 60 * MINUTE },
    network: { limit: 10, windowMs: 60 * MINUTE },
  },
  "verification-resend": {
    account: { limit: 3, windowMs: 60 * MINUTE },
    network: { limit: 10, windowMs: 60 * MINUTE },
  },
  "password-reset": {
    account: { limit: 3, windowMs: 60 * MINUTE },
    network: { limit: 10, windowMs: 60 * MINUTE },
  },
};

function hashKey(scope: AuthRateLimitScope, target: "account" | "network", value: string) {
  return createHash("sha256")
    .update(`${scope}:${target}:${value}`)
    .digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function retryAfterSeconds(expiresAt: Date, now: Date) {
  return Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1_000));
}

async function consumeRateLimit(key: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
  await connectToDatabase();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + policy.windowMs);

    const activeWindow = await AuthRateLimitModel.findOneAndUpdate(
      {
        key,
        expiresAt: { $gt: now },
        count: { $lt: policy.limit },
      },
      { $inc: { count: 1 } },
      { new: true },
    ).lean();

    if (activeWindow) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const existing = await AuthRateLimitModel.findOne({ key, expiresAt: { $gt: now } })
      .select({ count: 1, expiresAt: 1 })
      .lean();

    if (existing) {
      if (existing.count >= policy.limit) {
        return {
          allowed: false,
          retryAfterSeconds: retryAfterSeconds(existing.expiresAt, now),
        };
      }

      continue;
    }

    const renewedWindow = await AuthRateLimitModel.findOneAndUpdate(
      { key, expiresAt: { $lte: now } },
      { $set: { count: 1, expiresAt } },
      { new: true },
    ).lean();

    if (renewedWindow) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    try {
      await AuthRateLimitModel.create({ key, count: 1, expiresAt });
      return { allowed: true, retryAfterSeconds: 0 };
    } catch (error) {
      if (!(error instanceof Error) || !/E11000|duplicate key/i.test(error.message)) {
        throw error;
      }
    }
  }

  const now = new Date();
  const existing = await AuthRateLimitModel.findOne({ key, expiresAt: { $gt: now } })
    .select({ count: 1, expiresAt: 1 })
    .lean();

  return {
    allowed: false,
    retryAfterSeconds: existing ? retryAfterSeconds(existing.expiresAt, now) : 1,
  };
}

export function getClientIpAddress(requestHeaders: HeaderReader) {
  const forwardedFor = requestHeaders.get("x-forwarded-for");

  return (
    forwardedFor?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    requestHeaders.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export async function enforceAuthRateLimit(
  scope: AuthRateLimitScope,
  requestHeaders: HeaderReader,
  email?: string,
) {
  const policy = AUTH_RATE_LIMITS[scope];
  const checks: Array<{ key: string; policy: RateLimitPolicy }> = [
    {
      key: hashKey(scope, "network", getClientIpAddress(requestHeaders)),
      policy: policy.network,
    },
  ];

  if (email && policy.account) {
    checks.unshift({
      key: hashKey(scope, "account", normalizeEmail(email)),
      policy: policy.account,
    });
  }

  for (const check of checks) {
    const result = await consumeRateLimit(check.key, check.policy);

    if (!result.allowed) {
      return result;
    }
  }

  return { allowed: true, retryAfterSeconds: 0 } satisfies RateLimitResult;
}

export async function clearSignInRateLimit(email: string) {
  await connectToDatabase();
  await AuthRateLimitModel.deleteOne({
    key: hashKey("sign-in", "account", normalizeEmail(email)),
  });
}

export function getRateLimitMessage(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many attempts. Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`;
}
