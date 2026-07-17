import { StaffSpecialistArea, type StaffWorkItem } from "@/components/dashboard/staff/staff-specialist-area";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkspace } from "@/features/staff/workspace";

const templateItems: Partial<Record<string, readonly StaffWorkItem[]>> = {
  engagement_manager: [
    { title: "Engagement letters", description: "Review approved engagement and scope templates." },
    { title: "Drafts awaiting review", description: "Review template changes before publication.", status: "Review" },
    { title: "Template usage", description: "See which templates are used by active engagements." },
  ],
  consultant: [
    { title: "Consulting templates", description: "Open approved templates for reports and deliverables.", status: "Reference" },
    { title: "Engagement letters", description: "Review the approved scope and client terms.", status: "Reference" },
  ],
  reviewer: [
    { title: "KYC templates", description: "Review current questionnaire and evidence templates." },
    { title: "Draft review", description: "Review controlled template changes assigned to you.", status: "Review" },
  ],
  finance_officer: [
    { title: "Invoice templates", description: "Maintain approved invoice layouts and payment details." },
    { title: "Financial letters", description: "Review approved billing and payment communication templates." },
  ],
  document_controller: [
    { title: "Template register", description: "Review versions, ownership and publication status." },
    { title: "Draft templates", description: "Prepare and classify controlled template updates.", status: "Draft" },
    { title: "Archived versions", description: "Review retained superseded template versions.", href: "/staff/archive" },
  ],
  auditor: [
    { title: "Template register", description: "Inspect approved templates and their version history.", status: "Read only" },
    { title: "Usage records", description: "Review where each template version was used.", status: "Read only" },
  ],
};

export default async function StaffTemplatesPage() {
  const { role } = await requireStaffRoute("templates");
  return (
    <StaffSpecialistArea
      description="Open templates and version records relevant to your role."
      items={templateItems[role] ?? []}
      readOnly={role === "auditor"}
      roleLabel={getStaffWorkspace(role).roleLabel}
      title="Templates"
    />
  );
}
