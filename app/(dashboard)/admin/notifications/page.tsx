import { NotificationCentre } from "@/components/dashboard/communication/notification-centre";
import { requireUser } from "@/features/auth/server";
import { getCommunicationHubData } from "@/repositories/communication-repository";

export default async function AdminNotificationsPage() {
  const principal = await requireUser();
  const data = await getCommunicationHubData(principal);

  return <NotificationCentre data={data} detailBaseHref="/admin/notifications" />;
}
