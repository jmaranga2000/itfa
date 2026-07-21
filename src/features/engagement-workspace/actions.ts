"use server";

import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/features/auth/server";
import { WORKFLOW_TASK_STATUSES } from "@/features/workflows/types";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import {
  ENGAGEMENT_DOCUMENT_KINDS,
  createEngagementDocument,
  recordEngagementTechnicalReview,
  updateEngagementTask,
} from "@/repositories/engagement-workspace-repository";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const allowedTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/jpeg",
  "image/png",
]);

function returnPath(formData: FormData, workflowId: string) {
  const value = String(formData.get("returnPath") ?? "");
  const allowed = [
    `/admin/workflows/${workflowId}`,
    `/admin/active-engagements/${workflowId}`,
    `/staff/engagements/${workflowId}`,
  ];
  return allowed.includes(value) ? value : `/admin/workflows/${workflowId}`;
}

function refresh(workflowId: string) {
  revalidatePath(`/admin/workflows/${workflowId}`);
  revalidatePath(`/admin/active-engagements/${workflowId}`);
  revalidatePath(`/staff/engagements/${workflowId}`);
  revalidatePath(`/client/engagements/${workflowId}`);
  revalidatePath("/admin/tasks");
  revalidatePath("/staff/tasks");
  revalidatePath("/admin/documents");
  revalidatePath("/staff/documents");
  revalidatePath("/client/documents");
  revalidatePath("/client/notifications");
}

export async function updateEngagementTaskAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const taskKey = String(formData.get("taskKey") ?? "");
  const parsed = z.enum(WORKFLOW_TASK_STATUSES).safeParse(formData.get("status"));
  const back = returnPath(formData, workflowId);
  if (!workflowId || !taskKey || !parsed.success) redirect(`${back}?tab=tasks&error=task`);
  const updated = await updateEngagementTask({ principal, workflowId, taskKey, status: parsed.data });
  if (!updated) redirect(`${back}?tab=tasks&error=task-access`);
  refresh(workflowId);
  redirect(`${back}?tab=tasks&saved=task`);
}

export async function reviewEngagementDocumentAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  const comments = String(formData.get("comments") ?? "").trim().slice(0, 3000);
  const decision = z.enum(["approved", "changes_requested"]).safeParse(formData.get("decision"));
  const back = returnPath(formData, workflowId);
  if (!workflowId || !documentId || !comments || !decision.success) redirect(`${back}?tab=documents&error=review`);
  const reviewed = await recordEngagementTechnicalReview({ principal, workflowId, documentId, comments, decision: decision.data });
  if (!reviewed) redirect(`${back}?tab=documents&error=review-access`);
  refresh(workflowId);
  redirect(`${back}?tab=documents&saved=review`);
}

export async function uploadEngagementDocumentAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 180);
  const replacesDocumentId = String(formData.get("replacesDocumentId") ?? "");
  const kind = z.enum(ENGAGEMENT_DOCUMENT_KINDS).safeParse(formData.get("documentKind"));
  const file = formData.get("document");
  const back = returnPath(formData, workflowId);
  if (!workflowId || title.length < 3 || !kind.success || !(file instanceof File) || !file.size) redirect(`${back}?tab=documents&error=document`);
  if (file.size > MAX_FILE_SIZE) redirect(`${back}?tab=documents&error=document-size`);
  if (!allowedTypes.has(file.type)) redirect(`${back}?tab=documents&error=document-type`);

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "engagement-file";
  const extension = cleanFileName.includes(".") ? `.${cleanFileName.split(".").pop()}` : "";
  const cleanTitle = title.replace(/[^a-zA-Z0-9._-]/g, "-") || "engagement-document";
  const name = `${cleanTitle}${extension && !cleanTitle.toLowerCase().endsWith(extension.toLowerCase()) ? extension : ""}`;
  const storageKey = `engagement-documents/${workflowId}/${kind.data}/${randomUUID()}-${cleanFileName}`;
  const configuration = getR2Configuration();

  try {
    await getR2Client().send(new PutObjectCommand({
      Bucket: configuration.bucketName,
      Key: storageKey,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      ContentDisposition: `attachment; filename="${name}"`,
    }));
    const documentId = await createEngagementDocument({
      principal,
      workflowId,
      documentKind: kind.data,
      name,
      storageKey,
      contentType: file.type,
      size: file.size,
      replacesDocumentId: replacesDocumentId || null,
    });
    if (!documentId) throw new Error("Document record was not created.");
  } catch (error) {
    console.error("Unable to upload engagement document.", error);
    await getR2Client().send(new DeleteObjectCommand({ Bucket: configuration.bucketName, Key: storageKey })).catch(() => undefined);
    redirect(`${back}?tab=documents&error=document-upload`);
  }
  refresh(workflowId);
  redirect(`${back}?tab=${kind.data === "final_deliverable" ? "deliverables" : "documents"}&saved=document`);
}
