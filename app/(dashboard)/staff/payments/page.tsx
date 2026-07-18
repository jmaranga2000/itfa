import { StaffFinance } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffFinanceData } from "@/repositories/staff-finance-repository";

export default async function StaffPaymentsPage({ searchParams }: { searchParams: Promise<{ updated?: string; error?: string }> }) {
  const [{ principal }, query] = await Promise.all([requireStaffRoute("payments"), searchParams]);
  const data = await getStaffFinanceData(principal);
  return <StaffFinance canManage={principal.permissions.includes("payments.reconcile")} error={query.error} mode="payments" payments={data.payments} updated={query.updated} workflows={data.workflows} />;
}
