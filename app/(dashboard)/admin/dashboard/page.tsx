import { AdminOperationsDashboard } from "@/components/dashboard/admin/admin-operations-dashboard";
import { getOperationsDashboardData } from "@/features/admin/operations-dashboard-data";
import { requireUser } from "@/features/auth/server";

export default async function AdminDashboardPage() {
  const principal = await requireUser();
  const data = await getOperationsDashboardData(principal);

  return <AdminOperationsDashboard data={data} />;
}
