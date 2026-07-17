import { StaffSpecialistArea } from "@/components/dashboard/staff/staff-specialist-area";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkspace } from "@/features/staff/workspace";

export default async function StaffPaymentsPage() {
  const { role } = await requireStaffRoute("payments");
  return (
    <StaffSpecialistArea
      description="Record incoming client payments and reconcile them against issued invoices."
      roleLabel={getStaffWorkspace(role).roleLabel}
      title="Payments"
      items={[
        { title: "Unmatched payments", description: "Match incoming funds to the correct client invoice.", status: "Needs review" },
        { title: "Part payments", description: "Track balances where clients have paid only part of an invoice.", status: "Open balance" },
        { title: "Reconciled payments", description: "Review completed payment and invoice matches.", href: "/staff/reports" },
      ]}
    />
  );
}
