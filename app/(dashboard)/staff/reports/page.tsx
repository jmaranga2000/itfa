import { StaffReports } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffReportsPage() {
  const { principal } = await requireStaffRoute("reports");
  const data = await getStaffWorkData(principal);
  return <StaffReports data={data} />;
}
