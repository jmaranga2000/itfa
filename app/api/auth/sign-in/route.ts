import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { AppRole } from "@/features/authorization/roles";
import { verifyPassword } from "@/features/auth/password";

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function authRedirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function authErrorRedirect(request: Request, message: string) {
  const params = new URLSearchParams({ error: message });
  return authRedirect(request, `/sign-in?${params.toString()}`);
}

function verificationRedirect(
  request: Request,
  email: string,
  options: {
    resent?: boolean;
    verificationUrl?: string;
    delivered?: boolean;
  } = {},
) {
  const params = new URLSearchParams({ email });

  if (options.resent) {
    params.set("resent", "1");
  }

  if (options.delivered === false) {
    params.set("delivery", "failed");
  }

  if (options.delivered === false && options.verificationUrl && process.env.NODE_ENV !== "production") {
    params.set("preview", options.verificationUrl);
  }

  return authRedirect(request, `/verify-email/sent?${params.toString()}`);
}

function getPostLoginPath(roleKeys: readonly AppRole[]) {
  if (roleKeys.includes("super_admin") || roleKeys.includes("admin")) {
    return "/admin";
  }

  if (
    roleKeys.some((role) =>
      [
        "engagement_manager",
        "consultant",
        "reviewer",
        "finance_officer",
        "document_controller",
        "support_staff",
        "auditor",
      ].includes(role),
    )
  ) {
    return "/staff";
  }

  return "/client";
}

async function getRequestMetadata() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? null,
    userAgent: headerStore.get("user-agent"),
  };
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return authErrorRedirect(request, "Enter a valid email address and password.");
  }

  const userRepository = await import("@/repositories/user-repository");
  const user = await userRepository.findUserByEmailForAuth(parsed.data.email);
  const validPassword =
    user?.passwordHash && (await verifyPassword(parsed.data.password, user.passwordHash));

  if (!user || !validPassword) {
    return authErrorRedirect(request, "The email or password is incorrect.");
  }

  if (!user.emailVerifiedAt) {
    const { createAndSendVerificationEmail } = await import(
      "@/features/auth/email-verification"
    );
    const verification = await createAndSendVerificationEmail(user._id.toString(), user.email);

    return verificationRedirect(request, user.email, {
      resent: true,
      delivered: verification.delivered,
      verificationUrl: verification.verificationUrl,
    });
  }

  const { createSession } = await import("@/features/auth/session");

  await userRepository.markUserLogin(user._id.toString());
  await createSession(user._id.toString(), await getRequestMetadata());

  const principal = await userRepository.getPrincipalByUserId(user._id.toString());

  if (!principal) {
    return authErrorRedirect(request, "Your application profile is not ready yet.");
  }

  const { writeAuditLog } = await import("@/features/audit/audit-service");

  await writeAuditLog({
    actor: principal,
    action: "auth.signed_in",
    resourceType: "User",
    resourceId: principal.id,
    metadata: { method: "password" },
  });

  return authRedirect(request, getPostLoginPath(principal.roleKeys));
}
