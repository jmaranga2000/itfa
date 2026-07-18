import Link from "next/link";
import { Archive, ArrowLeft, Save } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { archiveStaffNoteAction } from "@/features/staff-notes/actions";
import type { StaffNoteRecord } from "@/repositories/staff-note-repository";

type EngagementOption = { id: string; reference: string; clientName: string; serviceName: string };

export function StaffNoteForm({
  action,
  engagements,
  error,
  note,
  selectedWorkflowId,
  success,
}: {
  action: (formData: FormData) => Promise<void>;
  engagements: EngagementOption[];
  error?: string;
  note?: StaffNoteRecord | null;
  selectedWorkflowId?: string;
  success?: string;
}) {
  const editing = Boolean(note);
  return (
    <AdminPageSurface
      actions={<Link className={buttonClassName({ variant: "secondary" })} href="/staff/notes"><ArrowLeft className="h-4 w-4" />Back to notes</Link>}
      description="Keep decisions, research, calls, risks, and handover information inside the engagement record. Clients cannot see internal notes."
      icon={Save}
      title={editing ? "Edit internal note" : "New internal note"}
    >
      {success ? <p className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">{success}</p> : null}
      {error ? <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">Check the engagement, title, and note text before saving.</p> : null}
      <form action={action} className="grid gap-5 p-5">
        {note ? <input name="noteId" type="hidden" value={note.id} /> : null}
        <div className="grid gap-2">
          <Label htmlFor="workflowId">Engagement</Label>
          <Select defaultValue={note?.workflowId ?? selectedWorkflowId ?? ""} id="workflowId" name="workflowId" required>
            <option value="">Choose an assigned engagement</option>
            {engagements.map((engagement) => <option key={engagement.id} value={engagement.id}>{engagement.reference} - {engagement.clientName} - {engagement.serviceName}</option>)}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
          <div className="grid gap-2"><Label htmlFor="title">Title</Label><Input defaultValue={note?.title} id="title" maxLength={180} name="title" placeholder="Key decision from client meeting" required /></div>
          <div className="grid gap-2"><Label htmlFor="category">Category</Label><Select defaultValue={note?.category ?? "general"} id="category" name="category"><option value="general">General</option><option value="client_call">Client call</option><option value="research">Research</option><option value="decision">Decision</option><option value="risk">Risk</option><option value="handover">Handover</option></Select></div>
        </div>
        <div className="grid gap-2"><Label htmlFor="body">Note</Label><Textarea className="min-h-64" defaultValue={note?.body} id="body" maxLength={12000} name="body" placeholder="Record the context, decision, owner, and next step." required /></div>
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Link className={buttonClassName({ variant: "secondary" })} href="/staff/notes">Cancel</Link>
          <SubmitButton pendingText="Saving note..."><Save className="h-4 w-4" />{editing ? "Save changes" : "Create note"}</SubmitButton>
        </div>
      </form>
      {note?.canEdit ? <form action={archiveStaffNoteAction} className="border-t border-border p-5"><input name="noteId" type="hidden" value={note.id} /><SubmitButton pendingText="Archiving..." variant="secondary"><Archive className="h-4 w-4" />Archive note</SubmitButton></form> : null}
    </AdminPageSurface>
  );
}
