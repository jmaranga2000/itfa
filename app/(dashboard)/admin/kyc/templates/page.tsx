import { KycSimpleTablePage } from "@/components/dashboard/kyc/kyc-support-pages";
import { getKycTemplates } from "@/features/kyc/service";

export default async function AdminKycTemplatesPage() {
  const rows = await getKycTemplates();

  return (
    <KycSimpleTablePage
      columns={["name", "clientType", "requirements", "mandatory", "status", "owner"]}
      description="Maintain service-specific KYC templates, requirement groups and mandatory controls."
      eyebrow="KYC settings"
      rows={rows}
      title="KYC templates"
    />
  );
}
