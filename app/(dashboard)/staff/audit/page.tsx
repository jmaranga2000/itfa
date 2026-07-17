import { StaffSpecialistArea } from "@/components/dashboard/staff/staff-specialist-area";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkspace } from "@/features/staff/workspace";

export default async function StaffAuditPage() {
  const { role } = await requireStaffRoute("audit");
  return (
    <StaffSpecialistArea
      description="Inspect recorded system activity and access changes without changing operational data."
      readOnly
      roleLabel={getStaffWorkspace(role).roleLabel}
      title="Activity history"
      items={[
        { title: "User activity", description: "Review sign-ins and important account changes.", status: "Read only" },
        { title: "Record changes", description: "Review who changed client, engagement and finance records.", status: "Read only" },
        { title: "Access changes", description: "Review role, permission and account status history.", status: "Read only" },
      ]}
    />
  );
}
