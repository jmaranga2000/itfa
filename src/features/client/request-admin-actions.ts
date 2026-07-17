"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/features/auth/server";
import {
  convertEngagementRequestToWorkflow,
  sendEngagementQuotation,
} from "@/repositories/engagement-request-repository";

export async function sendEngagementQuotationAction(formData: FormData) {
  const actor = await requirePermission("engagements.accept");
  const requestId = String(formData.get("requestId") ?? "");
  const sent = await sendEngagementQuotation({
    requestId,
    amount: Number(formData.get("amount")),
    currency: String(formData.get("currency") ?? "KES"),
    actor,
  });
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/client/engagements");
  redirect(`/admin/requests/${requestId}?${sent ? "quoted=1" : "error=quotation"}`);
}

export async function convertEngagementRequestAction(formData: FormData) {
  const actor = await requirePermission("engagements.accept");
  const requestId = String(formData.get("requestId") ?? "");
  const workflowId = await convertEngagementRequestToWorkflow(requestId, actor);
  if (!workflowId) redirect(`/admin/requests/${requestId}?error=convert`);
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/workflows");
  revalidatePath("/client/engagements");
  redirect(`/admin/workflows/${workflowId}`);
}
