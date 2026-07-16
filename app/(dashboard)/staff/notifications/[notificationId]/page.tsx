import { notFound } from "next/navigation";
import { RecipientNotificationDetail } from "@/components/dashboard/communication/recipient-notification-detail";
import { requireUser } from "@/features/auth/server";
import { getNotificationForPrincipal } from "@/repositories/communication-repository";

export default async function StaffNotificationDetailPage({
  params,
}: {
  params: Promise<{ notificationId: string }>;
}) {
  const [{ notificationId }, principal] = await Promise.all([params, requireUser()]);
  const notification = await getNotificationForPrincipal(principal, notificationId);

  if (!notification) notFound();

  return (
    <RecipientNotificationDetail
      backHref="/staff/notifications"
      notification={notification}
    />
  );
}
