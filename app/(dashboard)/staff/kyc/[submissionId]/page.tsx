import { notFound } from "next/navigation";
import { KycReviewWorkspace } from "@/components/dashboard/kyc/kyc-review-workspace";
import { requireStaffRoute } from "@/features/staff/server";
import { getKycSubmissionDetail } from "@/features/kyc/service";
import { canStaffAccessKycSubmission } from "@/repositories/request-onboarding-repository";

export default async function StaffKycSubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ submissionId: string }>;
  searchParams: Promise<{ approved?: string; decision?: string; error?: string }>;
}) {
  const [{ principal }, { submissionId }, query] = await Promise.all([
    requireStaffRoute("kyc"),
    params,
    searchParams,
  ]);
  const allowed = await canStaffAccessKycSubmission(submissionId, principal.id);
  if (!allowed) notFound();
  const submission = await getKycSubmissionDetail(submissionId);
  if (!submission) notFound();

  return (
    <KycReviewWorkspace
      approved={query.approved === "1"}
      decision={query.decision}
      error={query.error}
      portal="staff"
      submission={submission}
    />
  );
}
