import { StaffNotes } from "@/components/dashboard/staff/staff-notes";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffNotesPage() {
  const { principal } = await requireStaffRoute("notes");
  const data = await getStaffWorkData(principal);
  return <StaffNotes notes={data.notes} />;
}
