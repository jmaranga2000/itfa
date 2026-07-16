import { CommunicationConsole } from "@/components/dashboard/communication/communication-console";
import { requireUser } from "@/features/auth/server";
import { getCommunicationHubData } from "@/repositories/communication-repository";

export default async function ClientMessagesPage() {
  const principal = await requireUser();
  const data = await getCommunicationHubData(principal);

  return <CommunicationConsole audienceLabel="Your admin and consultant conversations" data={data} />;
}
