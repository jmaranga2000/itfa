import { StaffAiWorkspace } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffAiPage() {
  const { principal } = await requireStaffRoute("ai");
  const data = await getStaffWorkData(principal);
  return <StaffAiWorkspace workflows={data.workflows} />;
}
