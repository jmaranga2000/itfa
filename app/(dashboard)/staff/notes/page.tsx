import { StaffNotes } from "@/components/dashboard/staff/staff-notes";
import { requireStaffRoute } from "@/features/staff/server";

export default async function StaffNotesPage() {
  await requireStaffRoute("notes");
  return <StaffNotes />;
}
