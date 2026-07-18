import { StaffFinance } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffFinanceData } from "@/repositories/staff-finance-repository";

export default async function StaffInvoicesPage({ searchParams }: { searchParams: Promise<{ updated?: string; error?: string }> }) {
  const [{ principal }, query] = await Promise.all([requireStaffRoute("invoices"), searchParams]);
  const data = await getStaffFinanceData(principal);
  return <StaffFinance canManage={principal.permissions.includes("invoices.approve")} error={query.error} mode="invoices" updated={query.updated} workflows={data.workflows} />;
}
