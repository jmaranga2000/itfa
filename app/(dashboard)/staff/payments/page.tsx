import { StaffFinance } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffPaymentsPage() {
  const { principal } = await requireStaffRoute("payments");
  const data = await getStaffWorkData(principal);
  return <StaffFinance mode="payments" workflows={data.workflows} />;
}
