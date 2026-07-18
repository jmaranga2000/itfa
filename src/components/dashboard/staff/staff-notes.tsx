import Link from "next/link";
import { ArrowRight, NotebookPen, Plus } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState } from "@/components/dashboard/staff/staff-work-ui";
import { buttonClassName } from "@/components/ui/button";
import type { StaffNoteRecord } from "@/repositories/staff-note-repository";

export function StaffNotes({ archived, notes }: { archived?: boolean; notes: StaffNoteRecord[] }) {
  return (
    <AdminPageSurface
      actions={<Link className={buttonClassName()} href="/staff/notes/new"><Plus className="h-4 w-4" />New note</Link>}
      description="Engagement notes shared with authorized team members. These notes are never visible to clients."
      icon={NotebookPen}
      summary={[{ label: "Notes", value: notes.length, helper: "From your assigned tasks", icon: NotebookPen }]}
      title="Internal notes"
    >
      {archived ? <p className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">The note was archived.</p> : null}
      {notes.length === 0 ? (
        <StaffEmptyState description="Notes added to your assigned tasks will be collected here." title="No internal notes yet" />
      ) : (
        <div className="divide-y divide-border">
          {notes.map((note) => (
            <article className="p-5" key={note.id}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground">{note.title}</h2>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{note.reference} / {note.clientName} / {note.category.replaceAll("_", " ")} / {note.authorName}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{note.body}</p>
                </div>
                <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={note.href}>
                  {note.canEdit ? "Edit note" : "View note"}
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
