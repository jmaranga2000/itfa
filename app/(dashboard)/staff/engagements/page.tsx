import { StaffEngagements } from "@/components/dashboard/staff/staff-engagements";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffEngagementsPage() {
  const { principal } = await requireStaffRoute("engagements");
  const data = await getStaffWorkData(principal);
  return <StaffEngagements principalId={principal.id} requests={data.requests} roleKeys={principal.roleKeys} workflows={data.workflows} />;
}
