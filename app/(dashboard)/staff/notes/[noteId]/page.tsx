import { redirect } from "next/navigation";
import { StaffNoteForm } from "@/components/dashboard/staff/staff-note-form";
import { updateStaffNoteAction } from "@/features/staff-notes/actions";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffNote, listStaffNoteEngagements } from "@/repositories/staff-note-repository";

export default async function StaffNoteDetailPage({ params, searchParams }: { params: Promise<{ noteId: string }>; searchParams: Promise<{ created?: string; saved?: string; error?: string }> }) {
  const [{ principal }, { noteId }, query] = await Promise.all([requireStaffRoute("notes"), params, searchParams]);
  const [note, engagements] = await Promise.all([getStaffNote(principal, noteId), listStaffNoteEngagements(principal)]);
  if (!note) redirect("/access-blocked");
  return <StaffNoteForm action={updateStaffNoteAction} engagements={engagements} error={query.error} note={note} success={query.created === "1" ? "Internal note created." : query.saved === "1" ? "Changes saved." : undefined} />;
}
