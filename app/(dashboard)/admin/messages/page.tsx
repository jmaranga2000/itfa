import { CommunicationConsole } from "@/components/dashboard/communication/communication-console";
import { requireUser } from "@/features/auth/server";
import { getCommunicationHubData } from "@/repositories/communication-repository";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string; returnTo?: string }>;
}) {
  const [principal, query] = await Promise.all([requireUser(), searchParams]);
  const data = await getCommunicationHubData(principal, query.conversation);
  const returnHref = query.returnTo?.startsWith("/admin/requests/") ? query.returnTo : undefined;

  return (
    <CommunicationConsole
      audienceLabel="All client and staff communication"
      baseHref="/admin/messages"
      data={data}
      newMessageHref="/admin/messages/new"
      principalId={principal.id}
      returnHref={returnHref}
      returnLabel="Back to request"
    />
  );
}
