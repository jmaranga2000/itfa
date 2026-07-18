"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAnyPermission, requireUser } from "@/features/auth/server";
import { activateCompletedEngagementLetter } from "@/features/engagements/activation-service";
import {
  ensureEngagementLetterForRequest,
  sendEngagementLetter,
  signEngagementLetter,
  updateEngagementLetterDraft,
} from "@/repositories/engagement-letter-repository";

const draftSchema = z.object({
  letterId: z.string().trim().min(1),
  subject: z.string().trim().min(5).max(250),
  content: z.string().trim().min(100).max(80_000),
  fee: z.union([z.coerce.number().min(0), z.literal("")]).transform((value) => value === "" ? null : value),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  paymentTerms: z.string().trim().min(10).max(1000),
  expiresAt: z.coerce.date(),
});

const signatureSchema = z.object({
  letterId: z.string().trim().min(1),
  signatureText: z.string().trim().min(2).max(120),
  signatureAccepted: z.literal("on"),
});

async function signatureRequestDetails() {
  const requestHeaders = await headers();
  return {
    ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
      || requestHeaders.get("x-real-ip")
      || "unknown",
    userAgent: requestHeaders.get("user-agent") || "unknown",
  };
}

function refreshLetterPaths(letterId: string, requestId?: string) {
  revalidatePath("/admin/engagement-letters");
  revalidatePath(`/admin/engagement-letters/${letterId}`);
  revalidatePath("/client/engagement-letters");
  revalidatePath(`/client/engagement-letters/${letterId}`);
  revalidatePath("/client/engagements");
  if (requestId) revalidatePath(`/admin/requests/${requestId}`);
}

export async function prepareEngagementLetterAction(formData: FormData) {
  const actor = await requireAnyPermission(["engagements.accept", "templates.manage_legal"]);
  const requestId = String(formData.get("requestId") ?? "");
  const result = await ensureEngagementLetterForRequest(requestId, actor);
  if (!result) redirect(`/admin/requests/${requestId}?error=letter`);
  refreshLetterPaths(result.letter.id, requestId);
  redirect(`/admin/engagement-letters/${result.letter.id}?generated=${result.created ? "1" : "0"}`);
}

export async function updateEngagementLetterDraftAction(formData: FormData) {
  const actor = await requireAnyPermission(["engagements.accept", "templates.manage_legal"]);
  const parsed = draftSchema.safeParse(Object.fromEntries(formData));
  const letterId = String(formData.get("letterId") ?? "");
  if (!parsed.success) redirect(`/admin/engagement-letters/${letterId}?error=invalid`);
  const result = await updateEngagementLetterDraft({ ...parsed.data, actor });
  if (!result) redirect(`/admin/engagement-letters/${letterId}?error=locked`);
  refreshLetterPaths(letterId, result.requestId);
  redirect(`/admin/engagement-letters/${letterId}?saved=1`);
}

export async function sendEngagementLetterAction(formData: FormData) {
  const actor = await requireAnyPermission(["engagements.accept", "templates.manage_legal"]);
  const letterId = String(formData.get("letterId") ?? "");
  const result = await sendEngagementLetter(letterId, actor);
  if (!result) redirect(`/admin/engagement-letters/${letterId}?error=send`);
  refreshLetterPaths(letterId, result.requestId);
  redirect(`/admin/engagement-letters/${letterId}?sent=1`);
}

export async function signAdminEngagementLetterAction(formData: FormData) {
  const principal = await requireAnyPermission(["engagements.accept", "templates.manage_legal"]);
  const parsed = signatureSchema.safeParse(Object.fromEntries(formData));
  const letterId = String(formData.get("letterId") ?? "");
  if (!parsed.success) redirect(`/admin/engagement-letters/${letterId}?error=signature`);
  const requestDetails = await signatureRequestDetails();
  const result = await signEngagementLetter({
    ...requestDetails,
    letterId,
    signerRole: "ifta",
    signatureText: parsed.data.signatureText,
    principal,
  });
  if (!result.ok) redirect(`/admin/engagement-letters/${letterId}?error=${result.reason}`);
  await activateCompletedEngagementLetter(letterId, principal);
  refreshLetterPaths(letterId, result.letter.requestId);
  redirect(`/admin/engagement-letters/${letterId}?signed=1`);
}

export async function signClientEngagementLetterAction(formData: FormData) {
  const principal = await requireUser();
  const parsed = signatureSchema.safeParse(Object.fromEntries(formData));
  const letterId = String(formData.get("letterId") ?? "");
  if (!parsed.success) redirect(`/client/engagement-letters/${letterId}?error=signature`);
  const requestDetails = await signatureRequestDetails();
  const result = await signEngagementLetter({
    ...requestDetails,
    letterId,
    signerRole: "client",
    signatureText: parsed.data.signatureText,
    principal,
  });
  if (!result.ok) redirect(`/client/engagement-letters/${letterId}?error=${result.reason}`);
  await activateCompletedEngagementLetter(letterId, principal);
  refreshLetterPaths(letterId, result.letter.requestId);
  redirect(`/client/engagement-letters/${letterId}?signed=1`);
}
