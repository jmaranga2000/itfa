import { StaffFinanceReports, StaffReports } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffFinanceData } from "@/repositories/staff-finance-repository";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffReportsPage() {
  const { principal, role } = await requireStaffRoute("reports");
  if (role === "finance_officer") {
    const financeData = await getStaffFinanceData(principal);
    return <StaffFinanceReports payments={financeData.payments} workflows={financeData.workflows} />;
  }
  const data = await getStaffWorkData(principal);
  return <StaffReports data={data} />;
}
