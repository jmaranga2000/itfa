import Link from "next/link";
import { ArrowRight, NotebookPen } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState } from "@/components/dashboard/staff/staff-work-ui";
import { buttonClassName } from "@/components/ui/button";
import type { StaffNoteRecord } from "@/repositories/staff-work-repository";

export function StaffNotes({ notes }: { notes: StaffNoteRecord[] }) {
  return (
    <AdminPageSurface
      description="Internal notes from tasks assigned to you. These notes are not visible to clients."
      icon={NotebookPen}
      summary={[{ label: "Notes", value: notes.length, helper: "From your assigned tasks", icon: NotebookPen }]}
      title="Internal notes"
    >
      {notes.length === 0 ? (
        <StaffEmptyState description="Notes added to your assigned tasks will be collected here." title="No internal notes yet" />
      ) : (
        <div className="divide-y divide-border">
          {notes.map((note) => (
            <article className="p-5" key={note.id}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground">{note.title}</h2>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{note.reference} / {note.clientName}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{note.body}</p>
                </div>
                <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/engagements/${note.workflowId}`}>
                  Open work
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminPageSurface>
  );
}
