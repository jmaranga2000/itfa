import { CommunicationConsole } from "@/components/dashboard/communication/communication-console";
import { requireUser } from "@/features/auth/server";
import { getCommunicationHubData } from "@/repositories/communication-repository";

export default async function AdminMessagesPage() {
  const principal = await requireUser();
  const data = await getCommunicationHubData(principal);

  return <CommunicationConsole audienceLabel="All client and staff communication" data={data} />;
}
