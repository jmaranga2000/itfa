import { StaffReviews } from "@/components/dashboard/staff/staff-reviews";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffKycPage() {
  const { principal } = await requireStaffRoute("kyc");
  const data = await getStaffWorkData(principal);
  return <StaffReviews reviews={data.reviews} />;
}
