import { CommunicationConsole } from "@/components/dashboard/communication/communication-console";
import { requireStaffRoute } from "@/features/staff/server";
import { getCommunicationHubData } from "@/repositories/communication-repository";

export default async function StaffMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const [{ principal }, query] = await Promise.all([
    requireStaffRoute("messages"),
    searchParams,
  ]);
  const data = await getCommunicationHubData(principal, query.conversation);

  return (
    <CommunicationConsole
      audienceLabel="Assigned client and staff conversations"
      baseHref="/staff/messages"
      data={data}
    />
  );
}
