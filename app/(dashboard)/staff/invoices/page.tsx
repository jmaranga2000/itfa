import { StaffFinance } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffInvoicesPage() {
  const { principal } = await requireStaffRoute("invoices");
  const data = await getStaffWorkData(principal);
  return <StaffFinance mode="invoices" workflows={data.workflows} />;
}
