import { StaffSpecialistArea } from "@/components/dashboard/staff/staff-specialist-area";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkspace } from "@/features/staff/workspace";

export default async function StaffRequestsPage() {
  const { role } = await requireStaffRoute("requests");
  return (
    <StaffSpecialistArea
      description="Review incoming client requests, confirm scope and decide how approved work should begin."
      roleLabel={getStaffWorkspace(role).roleLabel}
      title="Engagement requests"
      items={[
        { title: "New requests", description: "Review service, client and scope details before making a decision.", status: "Manager review" },
        { title: "Clarifications", description: "Follow up requests that need more client information.", href: "/staff/messages" },
        { title: "Approved work", description: "Assign an owner and move accepted requests into active engagements.", href: "/staff/team-workload" },
      ]}
    />
  );
}
