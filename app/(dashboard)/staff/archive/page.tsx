import { StaffSpecialistArea, type StaffWorkItem } from "@/components/dashboard/staff/staff-specialist-area";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkspace } from "@/features/staff/workspace";

const archiveItems: Partial<Record<string, readonly StaffWorkItem[]>> = {
  engagement_manager: [
    { title: "Completed engagements", description: "Review completed client work and request restoration when needed." },
    { title: "Client communication", description: "Inspect retained engagement conversations." },
  ],
  consultant: [
    { title: "Completed assignments", description: "Review retained work from your previous engagements.", status: "Reference" },
    { title: "Archived documents", description: "Open retained deliverables and evidence.", status: "Reference" },
  ],
  reviewer: [
    { title: "Closed KYC reviews", description: "Review retained evidence and decision records.", status: "Reference" },
    { title: "Archived documents", description: "Inspect files linked to completed reviews.", status: "Reference" },
  ],
  finance_officer: [
    { title: "Financial records", description: "Review retained invoices and payment records." },
    { title: "Restoration requests", description: "Request access to archived finance records when required." },
  ],
  document_controller: [
    { title: "Retention register", description: "Review retention periods and records nearing expiry." },
    { title: "Legal holds", description: "Review records protected from deletion.", status: "Controlled" },
    { title: "Restoration requests", description: "Process approved requests for retained documents." },
  ],
  auditor: [
    { title: "Archive register", description: "Inspect retained records across clients, work and finance.", status: "Read only" },
    { title: "Legal holds", description: "Review active legal holds and their history.", status: "Read only" },
    { title: "Retention history", description: "Review extensions, restores and deletion approvals.", status: "Read only" },
  ],
};

export default async function StaffArchivePage() {
  const { role } = await requireStaffRoute("archive");
  return (
    <StaffSpecialistArea
      description="Archived records are limited by your role and kept separate from active work."
      items={archiveItems[role] ?? []}
      readOnly={role === "auditor"}
      roleLabel={getStaffWorkspace(role).roleLabel}
      title="Archive"
    />
  );
}
