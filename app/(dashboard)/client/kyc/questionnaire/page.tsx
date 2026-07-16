import { ClientKycQuestionnaire } from "@/components/dashboard/client/client-kyc-questionnaire";
import { requireUser } from "@/features/auth/server";
import { getClientKycSubmission } from "@/repositories/client-kyc-repository";

export default async function ClientKycQuestionnairePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [principal, params] = await Promise.all([requireUser(), searchParams]);
  const submission = await getClientKycSubmission(principal.id);

  return <ClientKycQuestionnaire saved={params.saved === "1"} submission={submission} />;
}
