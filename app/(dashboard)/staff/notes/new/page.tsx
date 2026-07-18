import { StaffNoteForm } from "@/components/dashboard/staff/staff-note-form";
import { createStaffNoteAction } from "@/features/staff-notes/actions";
import { requireStaffRoute } from "@/features/staff/server";
import { listStaffNoteEngagements } from "@/repositories/staff-note-repository";

export default async function NewStaffNotePage({ searchParams }: { searchParams: Promise<{ workflowId?: string; error?: string }> }) {
  const [{ principal }, query] = await Promise.all([requireStaffRoute("notes"), searchParams]);
  const engagements = await listStaffNoteEngagements(principal);
  return <StaffNoteForm action={createStaffNoteAction} engagements={engagements} error={query.error} selectedWorkflowId={query.workflowId} />;
}
