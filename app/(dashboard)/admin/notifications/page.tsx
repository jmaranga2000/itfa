import { AdminNotificationManager } from "@/components/dashboard/admin/admin-notification-manager";
import { requirePermission } from "@/features/auth/server";
import { listAdminNotifications } from "@/repositories/admin-notification-repository";

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  await requirePermission("settings.manage");
  const [notifications, query] = await Promise.all([
    listAdminNotifications(),
    searchParams,
  ]);

  return (
    <AdminNotificationManager
      deleted={query.deleted === "1"}
      notifications={notifications}
    />
  );
}
