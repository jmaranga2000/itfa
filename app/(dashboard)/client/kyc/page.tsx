import { ClientKyc } from "@/components/dashboard/client/client-kyc";
import { requireUser } from "@/features/auth/server";
import { getClientKycSubmission } from "@/repositories/client-kyc-repository";

export default async function ClientKycPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string; uploaded?: string }>;
}) {
  const [principal, params] = await Promise.all([requireUser(), searchParams]);
  const submission = await getClientKycSubmission(principal.id);

  return (
    <ClientKyc
      error={params.error}
      submission={submission}
      submitted={params.submitted === "1"}
      uploaded={params.uploaded === "1"}
    />
  );
}
