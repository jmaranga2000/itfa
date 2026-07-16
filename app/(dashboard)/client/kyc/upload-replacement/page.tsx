import { ClientKycReplacementUpload } from "@/components/dashboard/client/client-kyc-replacement-upload";
import { requireUser } from "@/features/auth/server";
import { getClientKycSubmission } from "@/repositories/client-kyc-repository";

export default async function ClientKycReplacementUploadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [principal, params] = await Promise.all([requireUser(), searchParams]);
  const submission = await getClientKycSubmission(principal.id);

  return <ClientKycReplacementUpload error={params.error} submission={submission} />;
}
