import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { connectToDatabase } from "@/lib/db/mongoose";
import { StaffNoteModel, type STAFF_NOTE_CATEGORIES } from "@/models/staff-note";
import { getWorkflowForPrincipal, listWorkflowsForPrincipal } from "@/repositories/workflow-repository";

export type StaffNoteCategory = (typeof STAFF_NOTE_CATEGORIES)[number];

export type StaffNoteRecord = {
  id: string;
  workflowId: string;
  reference: string;
  clientName: string;
  title: string;
  body: string;
  category: StaffNoteCategory;
  authorName: string;
  updatedAt: string;
  canEdit: boolean;
  href: string;
};

type RawStaffNote = {
  _id: Types.ObjectId;
  workflowId: Types.ObjectId;
  authorUserId: Types.ObjectId;
  authorName: string;
  title: string;
  body: string;
  category: StaffNoteCategory;
  updatedAt: Date;
};

function editable(principal: Principal, note: RawStaffNote) {
  return !principal.readOnly && note.authorUserId.toString() === principal.id;
}

export async function listStaffNoteEngagements(principal: Principal) {
  const workflows = await listWorkflowsForPrincipal(principal);
  return workflows.map((workflow) => ({
    id: workflow.id,
    reference: workflow.reference,
    clientName: workflow.clientName,
    serviceName: workflow.serviceName,
  }));
}

export async function listStaffNotes(principal: Principal): Promise<StaffNoteRecord[]> {
  await connectToDatabase();
  const workflows = await listWorkflowsForPrincipal(principal);
  const workflowIds = workflows.filter((workflow) => Types.ObjectId.isValid(workflow.id)).map((workflow) => new Types.ObjectId(workflow.id));
  if (!workflowIds.length) return [];
  const workflowById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
  const notes = await StaffNoteModel.find({ workflowId: { $in: workflowIds }, archivedAt: null })
    .sort({ updatedAt: -1 })
    .lean()
    .exec() as RawStaffNote[];

  return notes.map((note) => {
    const workflow = workflowById.get(note.workflowId.toString());
    return {
      id: note._id.toString(),
      workflowId: note.workflowId.toString(),
      reference: workflow?.reference ?? "Engagement",
      clientName: workflow?.clientName ?? "Client",
      title: note.title,
      body: note.body,
      category: note.category,
      authorName: note.authorName,
      updatedAt: note.updatedAt.toISOString(),
      canEdit: editable(principal, note),
      href: `/staff/notes/${note._id}`,
    };
  });
}

export async function getStaffNote(principal: Principal, noteId: string) {
  if (!Types.ObjectId.isValid(noteId)) return null;
  const notes = await listStaffNotes(principal);
  return notes.find((note) => note.id === noteId) ?? null;
}

export async function createStaffNote(input: {
  principal: Principal;
  workflowId: string;
  title: string;
  body: string;
  category: StaffNoteCategory;
}) {
  if (input.principal.readOnly || !Types.ObjectId.isValid(input.principal.id) || !Types.ObjectId.isValid(input.workflowId)) return null;
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  if (!workflow) return null;
  await connectToDatabase();
  const note = await StaffNoteModel.create({
    workflowId: new Types.ObjectId(input.workflowId),
    clientUserId: workflow.clientUserId && Types.ObjectId.isValid(workflow.clientUserId) ? new Types.ObjectId(workflow.clientUserId) : null,
    authorUserId: new Types.ObjectId(input.principal.id),
    authorName: input.principal.email,
    title: input.title,
    body: input.body,
    category: input.category,
    archivedAt: null,
  });
  return note._id.toString();
}

export async function updateStaffNote(input: {
  principal: Principal;
  noteId: string;
  workflowId: string;
  title: string;
  body: string;
  category: StaffNoteCategory;
}) {
  if (input.principal.readOnly || !Types.ObjectId.isValid(input.principal.id) || !Types.ObjectId.isValid(input.noteId)) return false;
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  if (!workflow) return false;
  const result = await StaffNoteModel.updateOne(
    { _id: input.noteId, authorUserId: input.principal.id, archivedAt: null },
    { $set: { workflowId: input.workflowId, clientUserId: workflow.clientUserId || null, title: input.title, body: input.body, category: input.category } },
  ).exec();
  return result.matchedCount > 0;
}

export async function archiveStaffNote(principal: Principal, noteId: string) {
  if (principal.readOnly || !Types.ObjectId.isValid(principal.id) || !Types.ObjectId.isValid(noteId)) return false;
  await connectToDatabase();
  const result = await StaffNoteModel.updateOne(
    { _id: noteId, authorUserId: principal.id, archivedAt: null },
    { $set: { archivedAt: new Date() } },
  ).exec();
  return result.modifiedCount > 0;
}
