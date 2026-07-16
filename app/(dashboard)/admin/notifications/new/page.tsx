import Link from "next/link";
import { ArrowLeft, BellRing } from "lucide-react";
import { AdminNotificationForm } from "@/components/dashboard/admin/admin-notification-form";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { buttonClassName } from "@/components/ui/button";
import { requirePermission } from "@/features/auth/server";
import { createAdminNotificationAction } from "@/features/communication/actions";

export default async function NewAdminNotificationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("settings.manage");
  const query = await searchParams;

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
      description="Write the message, choose clients or staff, and send it to their portal inboxes."
      icon={BellRing}
      title="New notification"
    >
      {query.error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">
          Check the required fields and try again.
        </p>
      ) : null}
      <AdminNotificationForm
        action={createAdminNotificationAction}
        submitLabel="Send notification"
      />
    </AdminPageSurface>
  );
}
