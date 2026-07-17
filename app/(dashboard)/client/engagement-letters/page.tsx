import { ClientEngagementLetters } from "@/components/dashboard/client/client-engagement-letters";
import { requireUser } from "@/features/auth/server";
import { listClientEngagementLetters } from "@/repositories/engagement-letter-repository";

export default async function ClientEngagementLettersPage() {
  const principal = await requireUser();
  const letters = await listClientEngagementLetters(principal.id);
  return <ClientEngagementLetters letters={letters} />;
}
