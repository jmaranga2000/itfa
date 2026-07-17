import { StaffArchive } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffArchivePage() {
  const { principal } = await requireStaffRoute("archive");
  const data = await getStaffWorkData(principal);
  return <StaffArchive workflows={data.workflows} />;
}
