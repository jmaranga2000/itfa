import { StaffTeamWorkload } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { STAFF_ACCOUNT_ROLES } from "@/features/staff/types";
import { listStaffWorkloadForAdmin } from "@/repositories/staff-assignment-repository";

export default async function StaffTeamWorkloadPage() {
  await requireStaffRoute("team-workload");
  const members = (await listStaffWorkloadForAdmin()).filter((member) =>
    member.roleKeys.some((role) => STAFF_ACCOUNT_ROLES.includes(role as (typeof STAFF_ACCOUNT_ROLES)[number])),
  );
  return <StaffTeamWorkload members={members} />;
}
