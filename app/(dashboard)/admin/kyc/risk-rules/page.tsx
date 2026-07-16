import { KycSimpleTablePage } from "@/components/dashboard/kyc/kyc-support-pages";
import { getKycRiskRules } from "@/repositories/kyc-repository";

export default async function AdminKycRiskRulesPage() {
  const rows = await getKycRiskRules();

  return (
    <KycSimpleTablePage
      columns={["rule", "risk", "action", "owner"]}
      description="Review rules that classify KYC risk, trigger senior review and guide escalation."
      eyebrow="KYC risk"
      rows={rows}
      title="KYC risk rules"
    />
  );
}
