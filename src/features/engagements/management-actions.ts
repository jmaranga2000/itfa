"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/features/auth/server";
import {
  addEngagementInternalNote,
  assignEngagementTeam,
} from "@/repositories/engagement-management-repository";

function refreshEngagement(workflowId: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/active-engagements");
  revalidatePath(`/admin/active-engagements/${workflowId}`);
  revalidatePath(`/admin/workflows/${workflowId}`);
  revalidatePath("/staff/engagements");
  revalidatePath("/staff/tasks");
}

export async function assignEngagementTeamAction(formData: FormData) {
  const principal = await requirePermission("engagements.assign");
  const workflowId = String(formData.get("workflowId") ?? "");
  const result = await assignEngagementTeam({
    principal,
    workflowId,
    consultantUserId: String(formData.get("consultantUserId") ?? ""),
    reviewerUserId: String(formData.get("reviewerUserId") ?? ""),
    financeOfficerUserId: String(formData.get("financeOfficerUserId") ?? ""),
  });
  if (!result.ok) redirect(`/admin/active-engagements/${workflowId}?error=${result.reason}#team-assignment`);
  refreshEngagement(workflowId);
  redirect(`/admin/active-engagements/${workflowId}?team=saved#team`);
}

export async function addEngagementInternalNoteAction(formData: FormData) {
  const principal = await requirePermission("engagements.assign");
  const workflowId = String(formData.get("workflowId") ?? "");
  const saved = await addEngagementInternalNote({
    principal,
    workflowId,
    body: String(formData.get("body") ?? ""),
  });
  if (!saved) redirect(`/admin/active-engagements/${workflowId}?error=note#notes`);
  refreshEngagement(workflowId);
  redirect(`/admin/active-engagements/${workflowId}?note=saved#notes`);
}
