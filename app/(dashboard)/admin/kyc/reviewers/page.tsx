import { KycReviewerAssignment } from "@/components/dashboard/kyc/kyc-reviewer-assignment";
import { requirePermission } from "@/features/auth/server";
import { getKycReviewerWorkload, getKycSubmissionDetail } from "@/features/kyc/service";

export default async function AdminKycReviewersPage({
  searchParams,
}: {
  searchParams: Promise<{ submissionId?: string; error?: string }>;
}) {
  await requirePermission("kyc.assign");
  const query = await searchParams;
  const submission = query.submissionId
    ? await getKycSubmissionDetail(query.submissionId)
    : null;
  const reviewers = await getKycReviewerWorkload(query.submissionId);

  return (
    <KycReviewerAssignment
      error={query.error}
      reviewers={reviewers}
      submission={submission}
    />
  );
}
