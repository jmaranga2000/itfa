"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/features/auth/server";
import { activateCompletedEngagementLetter } from "@/features/engagements/activation-service";
import {
  engagementLetterIsCompleteForRequest,
  getEngagementLetterForRequest,
} from "@/repositories/engagement-letter-repository";
import { approveEngagementRequest } from "@/repositories/request-onboarding-repository";

export async function approveEngagementRequestAction(formData: FormData) {
  const actor = await requirePermission("engagements.accept");
  const requestId = String(formData.get("requestId") ?? "");
  const approved = await approveEngagementRequest(requestId, actor);
  if (!approved) redirect(`/admin/requests/${requestId}?error=approve`);
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/client/engagements");
  revalidatePath("/client/kyc");
  redirect(`/admin/requests/${requestId}?approved=1`);
}

export async function convertEngagementRequestAction(formData: FormData) {
  const actor = await requirePermission("engagements.accept");
  const requestId = String(formData.get("requestId") ?? "");
  const letter = await getEngagementLetterForRequest(requestId);
  if (!letter) redirect(`/admin/requests/${requestId}?error=kyc-letter`);
  if (!(await engagementLetterIsCompleteForRequest(requestId))) {
    redirect(`/admin/engagement-letters/${letter.id}?notice=signature-required`);
  }
  const result = await activateCompletedEngagementLetter(letter.id, actor);
  const workflowId = result.workflowId;
  if (!workflowId) redirect(`/admin/requests/${requestId}?error=convert`);
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/active-engagements");
  revalidatePath("/admin/workflows");
  revalidatePath("/client/engagements");
  redirect(`/admin/active-engagements?activated=${workflowId}`);
}
