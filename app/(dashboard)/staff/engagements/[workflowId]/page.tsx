import { notFound } from "next/navigation";
import { StaffEngagementDetail } from "@/components/dashboard/staff/staff-engagement-detail";
import { requireStaffRoute } from "@/features/staff/server";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";
import { listEngagementDocumentsForPrincipal } from "@/repositories/engagement-workspace-repository";

export default async function StaffEngagementDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workflowId: string }>;
  searchParams: Promise<{ workspace?: string; workspaceError?: string }>;
}) {
  const [{ principal }, { workflowId }, query] = await Promise.all([
    requireStaffRoute("engagements"),
    params,
    searchParams,
  ]);
  const [workflow, documents] = await Promise.all([
    getWorkflowForPrincipal(principal, workflowId),
    listEngagementDocumentsForPrincipal(principal, workflowId),
  ]);
  if (!workflow) notFound();

  return <StaffEngagementDetail documents={documents} error={query.workspaceError} notice={query.workspace} workflow={workflow} />;
}
