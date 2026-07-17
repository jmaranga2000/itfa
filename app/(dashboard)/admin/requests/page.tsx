import { AdminRequests } from "@/components/dashboard/admin/admin-requests";
import { adminRequests } from "@/content/admin-requests";
import { requirePermission } from "@/features/auth/server";
import { engagementRequestToAdminRecord, listEngagementRequestsForAdmin } from "@/repositories/engagement-request-repository";

export default async function AdminRequestsPage() {
  await requirePermission("engagements.read_all");
  const databaseRequests = await listEngagementRequestsForAdmin();
  return <AdminRequests requests={[...databaseRequests.map(engagementRequestToAdminRecord), ...adminRequests]} />;
}
