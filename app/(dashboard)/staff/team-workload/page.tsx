import { StaffSpecialistArea } from "@/components/dashboard/staff/staff-specialist-area";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkspace } from "@/features/staff/workspace";

export default async function StaffTeamWorkloadPage() {
  const { role } = await requireStaffRoute("team-workload");
  return (
    <StaffSpecialistArea
      description="Balance new assignments against active engagements, due tasks and review responsibilities."
      roleLabel={getStaffWorkspace(role).roleLabel}
      title="Team workload"
      items={[
        { title: "Available staff", description: "Team members without active requests or engagements.", status: "Available" },
        { title: "Assigned engagements", description: "Review current ownership before assigning new work.", href: "/staff/engagements" },
        { title: "Due tasks", description: "Check deadlines and blockers affecting staff capacity.", href: "/staff/tasks" },
      ]}
    />
  );
}
