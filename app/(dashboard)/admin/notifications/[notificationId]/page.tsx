import Link from "next/link";
import { ArrowLeft, BellRing } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminNotificationForm } from "@/components/dashboard/admin/admin-notification-form";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { requirePermission } from "@/features/auth/server";
import {
  archiveAdminNotificationAction,
  updateAdminNotificationAction,
} from "@/features/communication/actions";
import { getAdminNotification } from "@/repositories/admin-notification-repository";

export default async function AdminNotificationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ notificationId: string }>;
  searchParams: Promise<{ created?: string; error?: string; saved?: string }>;
}) {
  await requirePermission("settings.manage");
  const [{ notificationId }, query] = await Promise.all([params, searchParams]);
  const notification = await getAdminNotification(notificationId);

  if (!notification) notFound();

  return (
    <AdminPageSurface
      actions={
        <Link
          className={buttonClassName({ variant: "secondary" })}
          href="/admin/notifications"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to notifications
        </Link>
      }
      description="Edit the message or audience. Changes are synchronized to recipient inboxes."
      icon={BellRing}
      title={notification.title}
    >
      {query.created || query.saved ? (
        <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">
          <Badge tone="green">{query.created ? "Sent" : "Saved"}</Badge>
          Recipient inboxes are up to date.
        </div>
      ) : null}
      {query.error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">
          Check the required fields and try again.
        </p>
      ) : null}
      <AdminNotificationForm
        action={updateAdminNotificationAction}
        archiveAction={archiveAdminNotificationAction}
        notification={notification}
        submitLabel="Save changes"
      />
    </AdminPageSurface>
  );
}
