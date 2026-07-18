"use server";

import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/server";
import { activateCompletedEngagementLetter } from "@/features/engagements/activation-service";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { ClientDocumentModel } from "@/models/client-document";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { respondToDocumentFeedback } from "@/repositories/client-portal-repository";
import {
  getClientEngagementLetter,
  recordUploadedSignedEngagementLetter,
} from "@/repositories/engagement-letter-repository";
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

export async function uploadSignedEngagementLetterAction(formData: FormData) {
  const principal = await requireUser();
  const letterId = String(formData.get("letterId") ?? "");
  const signedCopy = formData.get("signedCopy");
  const confirmed = formData.get("signedConfirmation") === "on";
  if (!Types.ObjectId.isValid(letterId) || !(signedCopy instanceof File) || signedCopy.size === 0 || !confirmed) {
    redirect("/client/documents?error=signed-missing");
  }
  if (signedCopy.size > MAX_DOCUMENT_SIZE) redirect("/client/documents?error=signed-size");
  if (!["application/pdf", "image/jpeg", "image/png"].includes(signedCopy.type)) {
    redirect("/client/documents?error=signed-type");
  }
  const letter = await getClientEngagementLetter(letterId, principal.id);
  if (!letter || !["awaiting_signatures", "partially_signed"].includes(letter.status)) {
    redirect("/client/documents?error=signed-letter");
  }

  const documentId = new Types.ObjectId();
  const filename = signedCopy.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "signed-engagement-letter.pdf";
  const storageKey = `engagement-letters/${principal.id}/${letterId}/signed/${randomUUID()}-${filename}`;
  let configuration: ReturnType<typeof getR2Configuration> | null = null;
  try {
    configuration = getR2Configuration();
    await getR2Client().send(new PutObjectCommand({
      Bucket: configuration.bucketName,
      Key: storageKey,
      Body: Buffer.from(await signedCopy.arrayBuffer()),
      ContentType: signedCopy.type,
      ContentDisposition: `attachment; filename="${filename}"`,
    }));
    await ClientDocumentModel.create({
      _id: documentId,
      clientUserId: principal.id,
      requestId: letter.requestId,
      engagementLetterId: letter.id,
      documentKind: "signed_engagement_letter",
      name: filename,
      storageKey,
      contentType: signedCopy.type,
      size: signedCopy.size,
      direction: "sent",
      status: "final",
      uploadedByUserId: principal.id,
    });
    const recorded = await recordUploadedSignedEngagementLetter({
      letterId,
      principal,
      documentId: documentId.toString(),
      storageKey,
      filename,
    });
    if (!recorded.ok) throw new Error(`Unable to record signed letter: ${recorded.reason}`);
  } catch (error) {
    console.error("Unable to upload signed engagement letter.", error);
    const cleanup: Promise<unknown>[] = [
      ClientDocumentModel.deleteOne({ _id: documentId, clientUserId: principal.id }).exec(),
    ];
    if (configuration) {
      cleanup.push(getR2Client().send(new DeleteObjectCommand({ Bucket: configuration.bucketName, Key: storageKey })));
    }
    await Promise.allSettled(cleanup);
    redirect("/client/documents?error=signed-upload");
  }
  const activation = await activateCompletedEngagementLetter(letterId, principal);
  revalidateDocuments();
  revalidatePath("/client/engagement-letters");
  revalidatePath(`/client/engagement-letters/${letterId}`);
  revalidatePath("/admin/engagement-letters");
  revalidatePath("/admin/active-engagements");
  revalidatePath("/staff/engagements");
  redirect(`/client/documents?signed=1${activation.workflowId ? "" : "&activation=pending"}`);
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
