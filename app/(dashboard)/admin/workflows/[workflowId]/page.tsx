import { notFound } from "next/navigation";
import { WorkflowDetail } from "@/components/dashboard/workflows/workflow-detail";
import { requireUser } from "@/features/auth/server";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

export default async function AdminWorkflowDetailPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const [{ workflowId }, principal] = await Promise.all([params, requireUser()]);
  const workflow = await getWorkflowForPrincipal(principal, workflowId);

  if (!workflow) {
    notFound();
  }

  return <WorkflowDetail workflow={workflow} />;
}
