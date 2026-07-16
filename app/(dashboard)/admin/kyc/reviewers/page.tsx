import { KycSimpleTablePage } from "@/components/dashboard/kyc/kyc-support-pages";
import { getKycReviewerWorkload } from "@/repositories/kyc-repository";

export default async function AdminKycReviewersPage() {
  const rows = await getKycReviewerWorkload();

  return (
    <KycSimpleTablePage
      columns={[
        "name",
        "role",
        "currentReviews",
        "overdueReviews",
        "averageTurnaround",
        "availability",
        "conflictWarning",
      ]}
      description="Assign reviewers with workload, availability and conflict warnings visible."
      eyebrow="KYC reviewers"
      rows={rows}
      title="Reviewer assignment"
    />
  );
}
