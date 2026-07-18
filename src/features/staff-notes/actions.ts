"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaffRoute } from "@/features/staff/server";
import { STAFF_NOTE_CATEGORIES } from "@/models/staff-note";
import { archiveStaffNote, createStaffNote, updateStaffNote } from "@/repositories/staff-note-repository";

const noteSchema = z.object({
  workflowId: z.string().trim().min(1),
  title: z.string().trim().min(3).max(180),
  body: z.string().trim().min(5).max(12000),
  category: z.enum(STAFF_NOTE_CATEGORIES),
});

function input(formData: FormData) {
  const parsed = noteSchema.safeParse({
    workflowId: formData.get("workflowId"),
    title: formData.get("title"),
    body: formData.get("body"),
    category: formData.get("category"),
  });
  return parsed.success ? parsed.data : null;
}

function revalidateNotes(workflowId?: string) {
  revalidatePath("/staff/notes");
  if (workflowId) revalidatePath(`/staff/engagements/${workflowId}`);
}

export async function createStaffNoteAction(formData: FormData) {
  const { principal } = await requireStaffRoute("notes");
  const values = input(formData);
  if (!values) redirect("/staff/notes/new?error=invalid");
  const noteId = await createStaffNote({ principal, ...values });
  if (!noteId) redirect("/staff/notes/new?error=access");
  revalidateNotes(values.workflowId);
  redirect(`/staff/notes/${noteId}?created=1`);
}

export async function updateStaffNoteAction(formData: FormData) {
  const { principal } = await requireStaffRoute("notes");
  const noteId = String(formData.get("noteId") ?? "");
  const values = input(formData);
  if (!values) redirect(`/staff/notes/${noteId}?error=invalid`);
  const updated = await updateStaffNote({ principal, noteId, ...values });
  if (!updated) redirect(`/staff/notes/${noteId}?error=access`);
  revalidateNotes(values.workflowId);
  redirect(`/staff/notes/${noteId}?saved=1`);
}

export async function archiveStaffNoteAction(formData: FormData) {
  const { principal } = await requireStaffRoute("notes");
  const noteId = String(formData.get("noteId") ?? "");
  await archiveStaffNote(principal, noteId);
  revalidateNotes();
  redirect("/staff/notes?archived=1");
}
