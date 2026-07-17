import { CommunicationConsole } from "@/components/dashboard/communication/communication-console";
import { requireUser } from "@/features/auth/server";
import { getCommunicationHubData } from "@/repositories/communication-repository";

export default async function StaffMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const [principal, query] = await Promise.all([requireUser(), searchParams]);
  const data = await getCommunicationHubData(principal, query.conversation);

  return (
    <CommunicationConsole
      audienceLabel="Assigned client and staff conversations"
      baseHref="/staff/messages"
      data={data}
    />
  );
}
