import { StaffReviews } from "@/components/dashboard/staff/staff-reviews";
import { requireStaffRoute } from "@/features/staff/server";

export default async function StaffReviewsPage() {
  await requireStaffRoute("reviews");
  return <StaffReviews />;
}
