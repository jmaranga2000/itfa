import { StaffSpecialistArea, type StaffWorkItem } from "@/components/dashboard/staff/staff-specialist-area";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkspace } from "@/features/staff/workspace";

const reportItems: Partial<Record<string, readonly StaffWorkItem[]>> = {
  engagement_manager: [
    { title: "Engagement performance", description: "Review delivery progress, overdue work and completion trends." },
    { title: "Team capacity", description: "Compare assignments, active work and staff availability.", href: "/staff/team-workload" },
    { title: "Client activity", description: "Review request and engagement activity by client." },
  ],
  consultant: [
    { title: "My engagement progress", description: "Review progress and deadlines across assigned work." },
    { title: "Task completion", description: "Review completed, active and overdue tasks.", href: "/staff/tasks" },
    { title: "Document activity", description: "Review uploads and deliverables for assigned work." },
  ],
  reviewer: [
    { title: "KYC outcomes", description: "Review approval, escalation and replacement trends.", href: "/staff/kyc" },
    { title: "Review turnaround", description: "Review queue age and completed review volumes." },
    { title: "Evidence quality", description: "Review common missing or rejected document types." },
  ],
  finance_officer: [
    { title: "Invoice summary", description: "Review issued, overdue and paid invoice totals.", href: "/staff/invoices" },
    { title: "Payment reconciliation", description: "Review matched, partial and unmatched payments.", href: "/staff/payments" },
    { title: "Service revenue", description: "Compare billed value by service and engagement." },
  ],
  document_controller: [
    { title: "Document activity", description: "Review uploads, approvals, replacements and deletions.", href: "/staff/documents" },
    { title: "Retention status", description: "Review records nearing expiry or under legal hold.", href: "/staff/archive" },
    { title: "Template usage", description: "Review approved template usage across engagements.", href: "/staff/templates" },
  ],
  auditor: [
    { title: "Executive assurance", description: "Review operational, compliance and finance summaries.", status: "Read only" },
    { title: "Audit exceptions", description: "Review recorded control and process exceptions.", href: "/staff/audit" },
    { title: "Archive compliance", description: "Review retention, legal hold and restoration activity.", href: "/staff/archive" },
  ],
};

export default async function StaffReportsPage() {
  const { role } = await requireStaffRoute("reports");
  return (
    <StaffSpecialistArea
      description="Reports are limited to the operational information permitted for your role."
      items={reportItems[role] ?? []}
      readOnly={role === "auditor"}
      roleLabel={getStaffWorkspace(role).roleLabel}
      title="Reports"
    />
  );
}
