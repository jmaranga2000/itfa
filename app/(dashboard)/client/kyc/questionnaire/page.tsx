import { ClientKycQuestionnaire } from "@/components/dashboard/client/client-kyc-questionnaire";
import { requireUser } from "@/features/auth/server";
import { getClientKycSubmission } from "@/repositories/client-kyc-repository";
import { getClientKycAccess } from "@/repositories/request-onboarding-repository";
import { redirect } from "next/navigation";

export default async function ClientKycQuestionnairePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [principal, params] = await Promise.all([requireUser(), searchParams]);
  const access = await getClientKycAccess(principal.id);
  if (!access) redirect("/client/kyc?error=locked");
  const submission = await getClientKycSubmission(principal.id);

  return <ClientKycQuestionnaire saved={params.saved === "1"} submission={submission} />;
}
