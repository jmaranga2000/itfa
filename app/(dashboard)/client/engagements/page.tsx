import { ClientWorkflowProgress } from "@/components/dashboard/workflows/client-workflow-progress";
import { requireUser } from "@/features/auth/server";
import { listWorkflowsForPrincipal } from "@/repositories/workflow-repository";

export default async function ClientEngagementsPage() {
  const principal = await requireUser();
  const workflows = await listWorkflowsForPrincipal(principal);

  return <ClientWorkflowProgress workflows={workflows} />;
}
