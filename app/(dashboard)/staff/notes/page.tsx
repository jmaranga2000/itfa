import { StaffNotes } from "@/components/dashboard/staff/staff-notes";
import { requireStaffRoute } from "@/features/staff/server";
import { listStaffNotes } from "@/repositories/staff-note-repository";

export default async function StaffNotesPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const { principal } = await requireStaffRoute("notes");
  const [notes, query] = await Promise.all([listStaffNotes(principal), searchParams]);
  return <StaffNotes archived={query.archived === "1"} notes={notes} />;
}
