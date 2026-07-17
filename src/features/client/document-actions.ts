"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/server";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { ClientDocumentModel } from "@/models/client-document";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { respondToDocumentFeedback } from "@/repositories/client-portal-repository";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const allowedDocumentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function revalidateDocuments() {
  revalidatePath("/client/documents");
  revalidatePath("/client/documents/shared");
  revalidatePath("/client/documents/feedback");
  revalidatePath("/client/engagements");
}

export async function uploadClientDocumentAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const document = formData.get("document");
  if (!Types.ObjectId.isValid(workflowId) || !(document instanceof File) || document.size === 0) {
    redirect("/client/documents/upload?error=missing");
  }
  if (document.size > MAX_DOCUMENT_SIZE) redirect("/client/documents/upload?error=size");
  if (!allowedDocumentTypes.has(document.type)) redirect("/client/documents/upload?error=type");
  const workflow = await getWorkflowForPrincipal(principal, workflowId);
  if (!workflow || workflow.clientUserId !== principal.id) redirect("/client/documents/upload?error=engagement");

  const documentId = new Types.ObjectId();
  const filename = document.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "client-document";
  const storageKey = `client-documents/${principal.id}/${randomUUID()}-${filename}`;
  try {
    const configuration = getR2Configuration();
    await getR2Client().send(new PutObjectCommand({
      Bucket: configuration.bucketName,
      Key: storageKey,
      Body: Buffer.from(await document.arrayBuffer()),
      ContentType: document.type,
      ContentDisposition: `attachment; filename="${filename}"`,
    }));
    await ClientDocumentModel.create({
      _id: documentId,
      clientUserId: principal.id,
      workflowId,
      name: filename,
      storageKey,
      contentType: document.type,
      size: document.size,
      direction: "sent",
      status: "pending_review",
      uploadedByUserId: principal.id,
    });
    await WorkflowInstanceModel.updateOne(
      { _id: workflowId, clientUserId: principal.id },
      {
        $push: {
          documents: {
            documentId: documentId.toString(), name: filename, status: "pending_review", version: 1,
            visibility: "all", uploadedAt: new Date(),
          },
          activity: {
            type: "document_uploaded", title: "Client document uploaded", actorName: principal.email,
            actorUserId: new Types.ObjectId(principal.id), description: filename,
            relatedResource: documentId.toString(), clientVisible: true, createdAt: new Date(),
          },
        },
        $set: { lastActivityAt: new Date() },
      },
    ).exec();
  } catch (error) {
    console.error("Unable to upload client document.", error);
    redirect("/client/documents/upload?error=upload");
  }
  revalidateDocuments();
  redirect("/client/documents?uploaded=1");
}

export async function respondToDocumentFeedbackAction(formData: FormData) {
  const principal = await requireUser();
  const documentId = String(formData.get("documentId") ?? "");
  const response = String(formData.get("response") ?? "").trim().slice(0, 2000);
  if (!response) redirect("/client/documents/feedback?error=response");
  const updated = await respondToDocumentFeedback(principal, documentId, response);
  revalidateDocuments();
  redirect(`/client/documents/feedback?${updated ? "responded=1" : "error=document"}`);
}
