import { AdminOperationsDashboard } from "@/components/dashboard/admin/admin-operations-dashboard";
import { AdminEngagementDashboardSection } from "@/components/dashboard/admin/admin-engagement-dashboard-section";
import { getOperationsDashboardData } from "@/features/admin/operations-dashboard-data";
import { requireUser } from "@/features/auth/server";
import { getEngagementDashboardEnhancements } from "@/repositories/engagement-execution-repository";
import { listWorkflowsForPrincipal } from "@/repositories/workflow-repository";

export default async function AdminDashboardPage() {
  const principal = await requireUser();
  const [data, workflows, engagementEnhancements] = await Promise.all([
    getOperationsDashboardData(principal),
    listWorkflowsForPrincipal(principal),
    getEngagementDashboardEnhancements(principal),
  ]);

  return (
    <div className="grid min-w-0 gap-4">
      <AdminOperationsDashboard data={data} />
      <AdminEngagementDashboardSection enhancements={engagementEnhancements} workflows={workflows} />
    </div>
  );
}
