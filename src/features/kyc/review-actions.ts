"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission, requireUser } from "@/features/auth/server";
import type { Permission } from "@/features/authorization/permissions";
import { assignKycReviewer, reviewKycRequirement } from "@/repositories/kyc-repository";
import { approveClientKycSubmission } from "@/repositories/request-onboarding-repository";

const requirementDecisionSchema = z.enum([
  "approved",
  "replacement_requested",
  "escalated",
  "rejected",
]);

const decisionPermissions = {
  approved: "kyc.approve_requirement",
  replacement_requested: "kyc.request_replacement",
  escalated: "kyc.escalate",
  rejected: "kyc.reject_requirement",
} as const satisfies Record<z.infer<typeof requirementDecisionSchema>, Permission>;

export async function assignKycReviewerAction(formData: FormData) {
  const actor = await requirePermission("kyc.assign");
  const submissionId = String(formData.get("submissionId") ?? "");
  const reviewerUserId = String(formData.get("reviewerUserId") ?? "");
  const assigned = await assignKycReviewer(submissionId, reviewerUserId, actor);
  if (!assigned) {
    redirect(`/admin/kyc/reviewers?submissionId=${encodeURIComponent(submissionId)}&error=assign`);
  }
  revalidatePath("/admin/kyc");
  revalidatePath(`/admin/kyc/${submissionId}`);
  revalidatePath("/staff/kyc");
  redirect(`/admin/kyc/${submissionId}?assigned=1`);
}

export async function reviewKycRequirementAction(formData: FormData) {
  const parsedDecision = requirementDecisionSchema.safeParse(formData.get("decision"));
  const submissionId = String(formData.get("submissionId") ?? "");
  const requirementId = String(formData.get("requirementId") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  const returnPathValue = String(formData.get("returnPath") ?? "");
  const returnPath = returnPathValue.startsWith("/staff/kyc/")
    ? returnPathValue
    : `/admin/kyc/${submissionId}`;
  if (!parsedDecision.success || !requirementId) redirect(`${returnPath}?error=requirement`);
  const actor = await requirePermission(decisionPermissions[parsedDecision.data]);
  const reviewed = await reviewKycRequirement({
    submissionId,
    requirementId,
    decision: parsedDecision.data,
    note,
    actor,
  });
  if (!reviewed) redirect(`${returnPath}?error=requirement`);
  revalidatePath("/admin/kyc");
  revalidatePath(`/admin/kyc/${submissionId}`);
  revalidatePath("/staff/kyc");
  revalidatePath("/client/kyc");
  redirect(`${returnPath}?decision=${parsedDecision.data}`);
}

export async function approveClientKycSubmissionAction(formData: FormData) {
  const actor = await requireUser();
  const submissionId = String(formData.get("submissionId") ?? "");
  const returnPathValue = String(formData.get("returnPath") ?? "");
  const returnPath = returnPathValue.startsWith("/staff/kyc/")
    ? returnPathValue
    : returnPathValue.startsWith("/admin/kyc/")
      ? returnPathValue
      : `/admin/kyc/${submissionId}`;
  const result = await approveClientKycSubmission(submissionId, actor);
  if (!result.ok) redirect(`${returnPath}?error=${result.reason}`);
  revalidatePath("/admin/kyc");
  revalidatePath("/staff/kyc");
  revalidatePath("/client/kyc");
  revalidatePath("/client/documents");
  revalidatePath("/client/engagement-letters");
  revalidatePath("/admin/engagement-letters");
  redirect(`${returnPath}?approved=1`);
}
