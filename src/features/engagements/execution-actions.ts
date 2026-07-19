"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { z } from "zod";
import { requireUser } from "@/features/auth/server";
import { createConversationMessage } from "@/repositories/communication-repository";
import {
  archiveCompletedEngagement,
  completeEngagement,
  createClientCollaborationRequest,
  createEngagementInvoice,
  createEngagementTask,
  respondToClientCollaborationRequest,
  reviewEngagementTask,
  sendEngagementInvoice,
} from "@/repositories/engagement-execution-repository";
import { addEngagementDocumentComment } from "@/repositories/engagement-workspace-repository";

const idSchema = z.string().refine(Types.ObjectId.isValid);
const prioritySchema = z.enum(["low", "medium", "high", "critical"]);

function workspacePath(formData: FormData, workflowId: string, tab: string) {
  const supplied = String(formData.get("returnPath") ?? "");
  const allowed = [
    `/admin/active-engagements/${workflowId}`,
    `/staff/engagements/${workflowId}`,
    `/client/engagements/${workflowId}`,
  ];
  const base = allowed.find((path) => supplied.startsWith(path)) ?? allowed[0];
  return `${base}?tab=${tab}`;
}

function refresh(workflowId: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/active-engagements");
  revalidatePath(`/admin/active-engagements/${workflowId}`);
  revalidatePath(`/staff/engagements/${workflowId}`);
  revalidatePath(`/client/engagements/${workflowId}`);
  revalidatePath("/staff/tasks");
  revalidatePath("/staff/invoices");
  revalidatePath("/staff/payments");
  revalidatePath("/client/documents");
  revalidatePath("/client/invoices");
  revalidatePath("/client/payments");
}

export async function createEngagementTaskAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const back = workspacePath(formData, workflowId, "tasks");
  const parsed = z.object({
    workflowId: idSchema,
    title: z.string().trim().min(3).max(180),
    description: z.string().trim().min(3).max(2000),
    assignedUserId: idSchema,
    priority: prioritySchema,
    dueDate: z.coerce.date(),
  }).safeParse({
    workflowId,
    title: formData.get("title"),
    description: formData.get("description"),
    assignedUserId: formData.get("assignedUserId"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success || parsed.data.dueDate.getTime() < Date.now() - 86_400_000) redirect(`${back}&error=task`);
  const created = await createEngagementTask({ principal, ...parsed.data });
  if (!created) redirect(`${back}&error=task-access`);
  refresh(workflowId);
  redirect(`${back}&saved=task`);
}

export async function reviewEngagementTaskAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const back = workspacePath(formData, workflowId, "tasks");
  const parsed = z.object({
    taskKey: z.string().min(1),
    decision: z.enum(["approved", "changes_requested"]),
    comments: z.string().trim().min(3).max(2000),
  }).safeParse({ taskKey: formData.get("taskKey"), decision: formData.get("decision"), comments: formData.get("comments") });
  if (!parsed.success) redirect(`${back}&error=review`);
  const reviewed = await reviewEngagementTask({ principal, workflowId, ...parsed.data });
  if (!reviewed) redirect(`${back}&error=review-access`);
  refresh(workflowId);
  redirect(`${back}&saved=review`);
}

export async function requestClientCollaborationAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const back = workspacePath(formData, workflowId, "overview");
  const parsed = z.object({ title: z.string().trim().min(3).max(180), instructions: z.string().trim().min(5).max(2000), dueDate: z.coerce.date() }).safeParse({ title: formData.get("title"), instructions: formData.get("instructions"), dueDate: formData.get("dueDate") });
  if (!parsed.success) redirect(`${back}&error=client-action`);
  const created = await createClientCollaborationRequest({ principal, workflowId, ...parsed.data });
  if (!created) redirect(`${back}&error=client-action-access`);
  refresh(workflowId);
  redirect(`${back}&saved=client-action`);
}

export async function respondToClientCollaborationAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const back = workspacePath(formData, workflowId, "overview");
  const parsed = z.object({ actionKey: z.string().min(1), response: z.string().trim().min(2).max(3000) }).safeParse({ actionKey: formData.get("actionKey"), response: formData.get("response") });
  if (!parsed.success) redirect(`${back}&error=response`);
  const updated = await respondToClientCollaborationRequest({ principal, workflowId, ...parsed.data });
  if (!updated) redirect(`${back}&error=response-access`);
  refresh(workflowId);
  redirect(`${back}&saved=response`);
}

export async function sendEngagementMessageAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const back = workspacePath(formData, workflowId, "messages");
  const parsed = z.object({
    conversationId: idSchema,
    body: z.string().trim().min(1).max(6000),
    attachmentDocumentId: z.string().optional(),
    replyToMessageId: z.string().optional(),
  }).safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
    attachmentDocumentId: String(formData.get("attachmentDocumentId") ?? "") || undefined,
    replyToMessageId: String(formData.get("replyToMessageId") ?? "") || undefined,
  });
  if (!parsed.success) redirect(`${back}&error=message`);
  await createConversationMessage({ sender: principal, ...parsed.data });
  refresh(workflowId);
  redirect(`${back}&saved=message`);
}

export async function addEngagementDocumentCommentAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const back = workspacePath(formData, workflowId, "documents");
  const parsed = z.object({ documentId: idSchema, body: z.string().trim().min(2).max(1500) }).safeParse({ documentId: formData.get("documentId"), body: formData.get("body") });
  if (!parsed.success) redirect(`${back}&error=comment`);
  const added = await addEngagementDocumentComment({ principal, workflowId, ...parsed.data });
  if (!added) redirect(`${back}&error=comment-access`);
  refresh(workflowId);
  redirect(`${back}&saved=comment`);
}

export async function createEngagementInvoiceAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const back = workspacePath(formData, workflowId, "finance");
  const parsed = z.object({ amount: z.coerce.number().positive().max(1_000_000_000), dueDate: z.coerce.date(), notes: z.string().trim().max(1000) }).safeParse({ amount: formData.get("amount"), dueDate: formData.get("dueDate"), notes: formData.get("notes") ?? "" });
  if (!parsed.success) redirect(`${back}&error=invoice`);
  const invoiceId = await createEngagementInvoice({ principal, workflowId, ...parsed.data });
  if (!invoiceId) redirect(`${back}&error=invoice-access`);
  refresh(workflowId);
  redirect(`${back}&saved=invoice`);
}

export async function sendEngagementInvoiceAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const back = workspacePath(formData, workflowId, "finance");
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const sent = await sendEngagementInvoice({ principal, workflowId, invoiceId });
  if (!sent) redirect(`${back}&error=invoice-send`);
  refresh(workflowId);
  redirect(`${back}&saved=invoice-sent`);
}

export async function completeEngagementAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const back = workspacePath(formData, workflowId, "completion");
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 4000);
  const result = await completeEngagement({ principal, workflowId, notes });
  if (!result.ok) redirect(`${back}&missing=${encodeURIComponent(result.missing.join("|"))}`);
  refresh(workflowId);
  redirect(`${back}&saved=completed`);
}

export async function archiveCompletedEngagementAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const archiveId = await archiveCompletedEngagement({ principal, workflowId });
  if (!archiveId) redirect(`${workspacePath(formData, workflowId, "completion")}&error=archive`);
  refresh(workflowId);
  revalidatePath("/admin/archive");
  redirect(`/admin/archive/${archiveId}?created=1`);
}
