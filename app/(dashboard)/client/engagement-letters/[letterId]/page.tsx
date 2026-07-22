import { redirect } from "next/navigation";
import { ClientEngagementLetterDetail } from "@/components/dashboard/client/client-engagement-letters";
import { requireUser } from "@/features/auth/server";
import { getClientEngagementLetter } from "@/repositories/engagement-letter-repository";

export default async function ClientEngagementLetterDetailPage({ params, searchParams }: {
  params: Promise<{ letterId: string }>;
  searchParams: Promise<{ signed?: string; error?: string }>;
}) {
  const principal = await requireUser();
  const [{ letterId }, query] = await Promise.all([params, searchParams]);
  const letter = await getClientEngagementLetter(letterId, principal.id);
  if (!letter) redirect("/access-blocked");
  return <ClientEngagementLetterDetail error={query.error} letter={letter} signed={query.signed === "1"} />;
}
