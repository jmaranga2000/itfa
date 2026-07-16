import { KycReviewCentre } from "@/components/dashboard/kyc/kyc-review-centre";
import { getKycDashboardData } from "@/repositories/kyc-repository";

export async function AdminKyc() {
  const data = await getKycDashboardData();

  return <KycReviewCentre data={data} />;
}
