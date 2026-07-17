import { StaffEngagements } from "@/components/dashboard/staff/staff-engagements";
import { requireStaffRoute } from "@/features/staff/server";

export default async function StaffEngagementsPage() {
  await requireStaffRoute("engagements");
  return <StaffEngagements />;
}
