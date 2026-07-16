"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AppRole } from "@/features/authorization/roles";
import { writeAuditLog } from "@/features/audit/audit-service";
import { createSession, destroyCurrentSession } from "@/features/auth/session";
import { hashPassword, verifyPassword } from "@/features/auth/password";
import { createAndSendVerificationEmail } from "@/features/auth/email-verification";
import {
  getPasswordPolicyMessage,
  isPasswordPolicySatisfied,
} from "@/features/auth/password-policy";
import {
  createUserWithPassword,
  findUserByEmailForAuth,
  getPrincipalByUserId,
  markUserLogin,
} from "@/repositories/user-repository";

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const signUpSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
  confirmPassword: z.string().min(1).max(128),
});

function authErrorRedirect(path: "/sign-in" | "/sign-up", message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`${path}?${params.toString()}`);
}

function verificationRedirect(
  email: string,
  options: {
    resent?: boolean;
    verificationUrl?: string;
    delivered?: boolean;
  } = {},
): never {
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

  redirect(`/verify-email/sent?${params.toString()}`);
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

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    authErrorRedirect("/sign-in", "Enter a valid email address and password.");
  }

  const user = await findUserByEmailForAuth(parsed.data.email);
  const validPassword =
    user?.passwordHash && (await verifyPassword(parsed.data.password, user.passwordHash));

  if (!user || !validPassword) {
    authErrorRedirect("/sign-in", "The email or password is incorrect.");
  }

  if (!user.emailVerifiedAt) {
    const verification = await createAndSendVerificationEmail(user._id.toString(), user.email);
    verificationRedirect(user.email, {
      resent: true,
      delivered: verification.delivered,
      verificationUrl: verification.verificationUrl,
    });
  }

  await markUserLogin(user._id.toString());
  await createSession(user._id.toString(), await getRequestMetadata());

  const principal = await getPrincipalByUserId(user._id.toString());

  if (!principal) {
    authErrorRedirect("/sign-in", "Your application profile is not ready yet.");
  }

  await writeAuditLog({
    actor: principal,
    action: "auth.signed_in",
    resourceType: "User",
    resourceId: principal.id,
    metadata: { method: "password" },
  });

  redirect(getPostLoginPath(principal.roleKeys));
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    authErrorRedirect("/sign-up", "Complete all fields before creating an account.");
  }

  if (!isPasswordPolicySatisfied(parsed.data.password)) {
    authErrorRedirect("/sign-up", `Password must include ${getPasswordPolicyMessage()}.`);
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    authErrorRedirect("/sign-up", "Password confirmation does not match.");
  }

  const existingUser = await findUserByEmailForAuth(parsed.data.email);

  if (existingUser) {
    authErrorRedirect("/sign-up", "An account already exists for this email address.");
  }

  const user = await createUserWithPassword({
    email: parsed.data.email,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    passwordHash: await hashPassword(parsed.data.password),
    roleKeys: ["client"],
  });

  await writeAuditLog({
    actor: null,
    action: "auth.client_registered",
    resourceType: "User",
    resourceId: user._id.toString(),
    metadata: { roleKeys: ["client"] },
  });

  const verification = await createAndSendVerificationEmail(user._id.toString(), user.email);

  verificationRedirect(user.email, {
    delivered: verification.delivered,
    verificationUrl: verification.verificationUrl,
  });
}

export async function resendVerificationEmailAction(formData: FormData) {
  const parsed = z
    .object({
      email: z.string().trim().email(),
    })
    .safeParse({
      email: formData.get("email"),
    });

  if (!parsed.success) {
    redirect("/verify-email/sent?error=invalid-email");
  }

  const user = await findUserByEmailForAuth(parsed.data.email);

  if (!user) {
    redirect("/verify-email/sent?sent=1");
  }

  if (user.emailVerifiedAt) {
    redirect("/sign-in?verified=1");
  }

  const verification = await createAndSendVerificationEmail(user._id.toString(), user.email);

  verificationRedirect(user.email, {
    resent: true,
    delivered: verification.delivered,
    verificationUrl: verification.verificationUrl,
  });
}

export async function signOutAction() {
  await destroyCurrentSession();
  redirect("/");
}
