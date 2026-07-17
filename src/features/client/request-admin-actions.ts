"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/features/auth/server";
import { convertEngagementRequestToWorkflow } from "@/repositories/engagement-request-repository";
import {
  engagementLetterIsCompleteForRequest,
  ensureEngagementLetterForRequest,
  getEngagementLetterForRequest,
  linkEngagementLetterToWorkflow,
} from "@/repositories/engagement-letter-repository";
import { getPlatformSettings } from "@/repositories/platform-settings-repository";

export async function convertEngagementRequestAction(formData: FormData) {
  const actor = await requirePermission("engagements.accept");
  const requestId = String(formData.get("requestId") ?? "");
  let letter = await getEngagementLetterForRequest(requestId);
  if (!letter) {
    const settings = await getPlatformSettings();
    if (!settings.engagement.autoGenerateLetters) {
      redirect(`/admin/requests/${requestId}?error=letter-required`);
    }
    const prepared = await ensureEngagementLetterForRequest(requestId, actor);
    if (!prepared) redirect(`/admin/requests/${requestId}?error=letter`);
    letter = prepared.letter;
  }
  if (!(await engagementLetterIsCompleteForRequest(requestId))) {
    redirect(`/admin/engagement-letters/${letter.id}?notice=signature-required`);
  }
  const workflowId = await convertEngagementRequestToWorkflow(requestId, actor);
  if (!workflowId) redirect(`/admin/requests/${requestId}?error=convert`);
  await linkEngagementLetterToWorkflow(requestId, workflowId);
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/active-engagements");
  revalidatePath("/admin/workflows");
  revalidatePath("/client/engagements");
  redirect(`/admin/active-engagements?activated=${workflowId}`);
}
