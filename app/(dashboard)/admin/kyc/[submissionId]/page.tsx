import { notFound } from "next/navigation";
import { KycReviewWorkspace } from "@/components/dashboard/kyc/kyc-review-workspace";
import { getKycSubmissionDetail } from "@/repositories/kyc-repository";

export default async function AdminKycSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const submission = await getKycSubmissionDetail(submissionId);

  if (!submission) {
    notFound();
  }

  return <KycReviewWorkspace submission={submission} />;
}
