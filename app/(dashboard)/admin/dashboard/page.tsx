import { AdminOperationsDashboard } from "@/components/dashboard/admin/admin-operations-dashboard";
import { AdminEngagementDashboardSection } from "@/components/dashboard/admin/admin-engagement-dashboard-section";
import { getOperationsDashboardData } from "@/features/admin/operations-dashboard-data";
import { requireUser } from "@/features/auth/server";
import { listWorkflowsForPrincipal } from "@/repositories/workflow-repository";

export default async function AdminDashboardPage() {
  const principal = await requireUser();
  const [data, workflows] = await Promise.all([
    getOperationsDashboardData(principal),
    listWorkflowsForPrincipal(principal),
  ]);

  return (
    <div className="grid min-w-0 gap-4">
      <AdminOperationsDashboard data={data} />
      <AdminEngagementDashboardSection workflows={workflows} />
    </div>
  );
}
