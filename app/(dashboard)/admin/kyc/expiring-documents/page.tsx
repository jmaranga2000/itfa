import { KycSimpleTablePage } from "@/components/dashboard/kyc/kyc-support-pages";
import { getExpiringKycDocuments } from "@/features/kyc/service";

export default async function AdminKycExpiringDocumentsPage() {
  const rows = await getExpiringKycDocuments();

  return (
    <KycSimpleTablePage
      columns={[
        "client",
        "document",
        "documentType",
        "expiryDate",
        "daysRemaining",
        "engagement",
        "kycStatus",
        "assignedReviewer",
        "replacementStatus",
        "riskLevel",
      ]}
      description="Track KYC documents that are expired or approaching expiry and request refreshes."
      eyebrow="KYC expiry"
      rows={rows}
      title="Expiring documents"
    />
  );
}
