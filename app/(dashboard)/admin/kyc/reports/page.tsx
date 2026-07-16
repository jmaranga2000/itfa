import { KycSimpleTablePage } from "@/components/dashboard/kyc/kyc-support-pages";
import { getKycReports } from "@/repositories/kyc-repository";

export default async function AdminKycReportsPage() {
  const rows = await getKycReports();

  return (
    <KycSimpleTablePage
      columns={["name", "metric", "href"]}
      description="KYC operational reports for pending reviews, approvals, SLA, risk and workload."
      eyebrow="KYC reports"
      rows={rows}
      title="KYC reports"
    />
  );
}
