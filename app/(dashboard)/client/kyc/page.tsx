import { ClientKyc } from "@/components/dashboard/client/client-kyc";
import { requireUser } from "@/features/auth/server";
import { getClientKycSubmission } from "@/repositories/client-kyc-repository";
import { getClientKycAccess } from "@/repositories/request-onboarding-repository";

export default async function ClientKycPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string; uploaded?: string }>;
}) {
  const [principal, params] = await Promise.all([requireUser(), searchParams]);
  const [submission, access] = await Promise.all([
    getClientKycSubmission(principal.id),
    getClientKycAccess(principal.id),
  ]);

  return (
    <ClientKyc
      error={params.error}
      access={access}
      submission={submission}
      submitted={params.submitted === "1"}
      uploaded={params.uploaded === "1"}
    />
  );
}
