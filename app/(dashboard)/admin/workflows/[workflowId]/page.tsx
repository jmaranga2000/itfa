import { notFound } from "next/navigation";
import { WorkflowDetail } from "@/components/dashboard/workflows/workflow-detail";
import { requireUser } from "@/features/auth/server";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

export default async function AdminWorkflowDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workflowId: string }>;
  searchParams: Promise<{ transitionError?: string; transitioned?: string }>;
}) {
  const [{ workflowId }, query, principal] = await Promise.all([params, searchParams, requireUser()]);
  const workflow = await getWorkflowForPrincipal(principal, workflowId);

  if (!workflow) {
    notFound();
  }

  return (
    <WorkflowDetail
      transitionError={query.transitionError}
      transitioned={query.transitioned === "1"}
      workflow={workflow}
    />
  );
}
