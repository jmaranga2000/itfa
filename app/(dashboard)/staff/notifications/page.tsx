import { NotificationCentre } from "@/components/dashboard/communication/notification-centre";
import { requireStaffRoute } from "@/features/staff/server";
import { getCommunicationHubData } from "@/repositories/communication-repository";

export default async function StaffNotificationsPage() {
  const { principal } = await requireStaffRoute("notifications");
  const data = await getCommunicationHubData(principal);

  return <NotificationCentre data={data} detailBaseHref="/staff/notifications" />;
}
