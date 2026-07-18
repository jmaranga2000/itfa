import { notFound } from "next/navigation";
import { WorkflowDetail } from "@/components/dashboard/workflows/workflow-detail";
import { requireUser } from "@/features/auth/server";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";
import { listEngagementDocumentsForPrincipal } from "@/repositories/engagement-workspace-repository";

export default async function AdminWorkflowDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workflowId: string }>;
  searchParams: Promise<{ transitionError?: string; transitioned?: string; workspace?: string; workspaceError?: string }>;
}) {
  const [{ workflowId }, query, principal] = await Promise.all([params, searchParams, requireUser()]);
  const [workflow, documents] = await Promise.all([
    getWorkflowForPrincipal(principal, workflowId),
    listEngagementDocumentsForPrincipal(principal, workflowId),
  ]);

  if (!workflow) {
    notFound();
  }

  return (
    <WorkflowDetail
      transitionError={query.transitionError}
      transitioned={query.transitioned === "1"}
      workspaceError={query.workspaceError}
      workspaceNotice={query.workspace}
      documents={documents}
      workflow={workflow}
    />
  );
}
