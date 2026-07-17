import { StaffSpecialistArea } from "@/components/dashboard/staff/staff-specialist-area";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkspace } from "@/features/staff/workspace";

export default async function StaffTeamRecordsPage() {
  const { role } = await requireStaffRoute("team");
  return (
    <StaffSpecialistArea
      description="Inspect staff account, role and assignment records for assurance work."
      readOnly
      roleLabel={getStaffWorkspace(role).roleLabel}
      title="Staff records"
      items={[
        { title: "Account register", description: "Review active, suspended and archived staff accounts.", status: "Read only" },
        { title: "Role history", description: "Review role and access changes recorded for staff accounts.", status: "Read only" },
        { title: "Assignment history", description: "Review historical staff ownership of client work.", status: "Read only" },
      ]}
    />
  );
}
