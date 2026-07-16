import { WorkflowDashboard } from "@/components/dashboard/workflows/workflow-dashboard";
import { requireUser } from "@/features/auth/server";
import { getWorkflowDashboardData } from "@/repositories/workflow-repository";

export default async function AdminWorkflowsPage() {
  const principal = await requireUser();
  const data = await getWorkflowDashboardData(principal);

  return <WorkflowDashboard data={data} />;
}
