import { StaffSpecialistArea } from "@/components/dashboard/staff/staff-specialist-area";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkspace } from "@/features/staff/workspace";

export default async function StaffInvoicesPage() {
  const { role } = await requireStaffRoute("invoices");
  const readOnly = role === "auditor";
  return (
    <StaffSpecialistArea
      description={readOnly ? "Inspect invoice records and approval history without changing financial data." : "Prepare, approve and issue invoices for completed or billable client work."}
      readOnly={readOnly}
      roleLabel={getStaffWorkspace(role).roleLabel}
      title={readOnly ? "Finance records" : "Invoices"}
      items={readOnly ? [
        { title: "Invoice register", description: "Review invoice amounts, status and linked engagements.", status: "Read only" },
        { title: "Approval history", description: "Inspect who approved each invoice and when.", status: "Read only" },
        { title: "Finance reports", description: "Open billing and payment summaries.", href: "/staff/reports" },
      ] : [
        { title: "Draft invoices", description: "Prepare invoices for approved billable work.", status: "Preparation" },
        { title: "Awaiting approval", description: "Review invoice values and supporting engagement records.", status: "Approval" },
        { title: "Issued invoices", description: "Monitor invoices waiting for client payment.", href: "/staff/payments" },
      ]}
    />
  );
}
