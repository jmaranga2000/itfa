import { redirect } from "next/navigation";
import { RecipientNotificationDetail } from "@/components/dashboard/communication/recipient-notification-detail";
import { requireUser } from "@/features/auth/server";
import { getNotificationForPrincipal } from "@/repositories/communication-repository";

export default async function ClientNotificationDetailPage({
  params,
}: {
  params: Promise<{ notificationId: string }>;
}) {
  const [{ notificationId }, principal] = await Promise.all([params, requireUser()]);
  const notification = await getNotificationForPrincipal(principal, notificationId);

  if (!notification) redirect("/access-blocked");

  return (
    <RecipientNotificationDetail
      backHref="/client/notifications"
      notification={notification}
    />
  );
}
