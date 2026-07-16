import { CommunicationConsole } from "@/components/dashboard/communication/communication-console";
import { requireUser } from "@/features/auth/server";
import { getCommunicationHubData } from "@/repositories/communication-repository";

export default async function StaffMessagesPage() {
  const principal = await requireUser();
  const data = await getCommunicationHubData(principal);

  return <CommunicationConsole audienceLabel="Assigned client and staff conversations" data={data} />;
}
