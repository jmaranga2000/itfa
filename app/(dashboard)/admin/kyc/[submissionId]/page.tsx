import { notFound } from "next/navigation";
import { KycReviewWorkspace } from "@/components/dashboard/kyc/kyc-review-workspace";
import { requireAnyPermission } from "@/features/auth/server";
import { getKycSubmissionDetail } from "@/repositories/kyc-repository";

export default async function AdminKycSubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ submissionId: string }>;
  searchParams: Promise<{ approved?: string; assigned?: string; decision?: string; error?: string }>;
}) {
  await requireAnyPermission(["kyc.review", "kyc.approve"]);
  const [{ submissionId }, query] = await Promise.all([params, searchParams]);
  const submission = await getKycSubmissionDetail(submissionId);

  if (!submission) {
    notFound();
  }

  return (
    <KycReviewWorkspace
      approved={query.approved === "1"}
      assigned={query.assigned === "1"}
      decision={query.decision}
      error={query.error}
      submission={submission}
    />
  );
}
