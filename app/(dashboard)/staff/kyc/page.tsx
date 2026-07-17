import { StaffSpecialistArea, type StaffWorkItem } from "@/components/dashboard/staff/staff-specialist-area";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkspace } from "@/features/staff/workspace";

export default async function StaffKycPage() {
  const { role } = await requireStaffRoute("kyc");
  const workspace = getStaffWorkspace(role);
  let items: readonly StaffWorkItem[];

  if (role === "engagement_manager") {
    items = [
      { title: "Unassigned reviews", description: "Assign new submissions to an available reviewer.", status: "Needs owner" },
      { title: "Escalated risks", description: "Review cases escalated by the KYC review team.", status: "Manager review" },
      { title: "Engagement readiness", description: "Confirm approved KYC before client work begins.", href: "/staff/engagements" },
    ];
  } else if (role === "reviewer") {
    items = [
      { title: "Assigned submissions", description: "Review questionnaires, identity evidence and declared risks.", status: "Review queue" },
      { title: "Missing evidence", description: "Request clear replacement documents from the client.", href: "/staff/messages" },
      { title: "Decision history", description: "Check previous review notes before recording a decision.", href: "/staff/notes" },
    ];
  } else {
    items = [
      { title: "Review audit trail", description: "Inspect who reviewed each requirement and when.", status: "Read only" },
      { title: "Risk classifications", description: "Review recorded risk levels and escalations.", status: "Read only" },
      { title: "Decision records", description: "Inspect approval, rejection and replacement history.", status: "Read only" },
    ];
  }

  return (
    <StaffSpecialistArea
      description={role === "auditor" ? "Inspect KYC evidence and decision history without changing review records." : "Process KYC work assigned to your role and keep decisions traceable."}
      items={items}
      readOnly={role === "auditor"}
      roleLabel={workspace.roleLabel}
      title={role === "auditor" ? "KYC records" : "KYC work"}
    />
  );
}
