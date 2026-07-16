import { AdminOperationsDashboard } from "@/components/dashboard/admin/admin-operations-dashboard";
import { CommunicationWidget } from "@/components/dashboard/communication/communication-widget";
import { getOperationsDashboardData } from "@/features/admin/operations-dashboard-data";
import { requireUser } from "@/features/auth/server";
import { getCommunicationHubData } from "@/repositories/communication-repository";

export default async function AdminDashboardPage() {
  const principal = await requireUser();
  const [data, communication] = await Promise.all([
    getOperationsDashboardData(principal),
    getCommunicationHubData(principal),
  ]);

  return (
    <div className="grid gap-5">
      <AdminOperationsDashboard data={data} />
      <CommunicationWidget
        data={communication}
        messagesHref="/admin/messages"
        notificationsHref="/admin/notifications"
      />
    </div>
  );
}
