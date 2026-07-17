"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/features/auth/server";
import { convertEngagementRequestToWorkflow } from "@/repositories/engagement-request-repository";

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
