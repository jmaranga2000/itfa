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
import { recordClientDeliverableReview, respondToDocumentFeedback } from "@/repositories/client-portal-repository";
import { createCommunicationNotification } from "@/repositories/communication-repository";
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

function uploadReturnPath(formData: FormData, workflowId: string) {
  const requested = String(formData.get("returnPath") ?? "");
  return requested === `/client/engagements/${workflowId}`
    ? requested
    : "/client/documents/upload";
}

function uploadErrorPath(back: string, error: string) {
  return back.startsWith("/client/engagements/")
    ? `${back}?tab=documents&error=${error}`
    : `${back}?error=${error}`;
}

export async function uploadClientDocumentAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const replacesDocumentId = String(formData.get("replacesDocumentId") ?? "");
  const back = uploadReturnPath(formData, workflowId);
  const document = formData.get("document");
  if (!Types.ObjectId.isValid(workflowId) || !(document instanceof File) || document.size === 0) {
    redirect(uploadErrorPath(back, "missing"));
  }
  if (document.size > MAX_DOCUMENT_SIZE) redirect(uploadErrorPath(back, "size"));
  if (!allowedDocumentTypes.has(document.type)) redirect(uploadErrorPath(back, "type"));
  const workflow = await getWorkflowForPrincipal(principal, workflowId);
  if (!workflow || workflow.clientUserId !== principal.id || workflow.status !== "active") {
    redirect(uploadErrorPath(back, "engagement"));
  }

  const replaced = Types.ObjectId.isValid(replacesDocumentId)
    ? await ClientDocumentModel.findOne({
      _id: replacesDocumentId,
      workflowId,
      clientUserId: principal.id,
    }).select("_id version").lean().exec()
    : null;
  const version = replaced ? (replaced.version ?? 1) + 1 : 1;

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
      version,
      replacesDocumentId: replaced?._id ?? null,
      uploadedByUserId: principal.id,
    });
    await WorkflowInstanceModel.updateOne(
      { _id: workflowId, clientUserId: principal.id },
      {
        $push: {
          documents: {
            documentId: documentId.toString(), name: filename, status: "pending_review", version,
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
    if (replaced) {
      await Promise.all([
        ClientDocumentModel.updateOne({ _id: replaced._id }, { $set: { status: "superseded" } }).exec(),
        WorkflowInstanceModel.updateOne(
          { _id: workflowId, "documents.documentId": replaced._id.toString() },
          { $set: { "documents.$.status": "superseded" } },
        ).exec(),
      ]);
    }
    const participantIds = [...new Set(workflow.team
      .map((member) => member.userId)
      .filter((userId): userId is string => Boolean(userId)))];
    await Promise.allSettled(participantIds.map((recipientUserId) => createCommunicationNotification({
      recipientUserId,
      type: "document_uploaded",
      title: "Client uploaded an engagement document",
      description: `${filename} was added to ${workflow.reference}.`,
      relatedModule: "engagements",
      relatedRecordId: workflow.id,
      actionUrl: `/staff/engagements/${workflow.id}?tab=documents`,
      createdByUserId: principal.id,
    })));
  } catch (error) {
    console.error("Unable to upload client document.", error);
    redirect(uploadErrorPath(back, "upload"));
  }
  revalidateDocuments();
  revalidatePath(`/client/engagements/${workflowId}`);
  revalidatePath(`/staff/engagements/${workflowId}`);
  revalidatePath(`/admin/active-engagements/${workflowId}`);
  redirect(back.startsWith("/client/engagements/")
    ? `${back}?tab=documents&saved=document`
    : "/client/documents?uploaded=1");
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

export async function reviewClientDeliverableAction(formData: FormData) {
  const principal = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  const decisionValue = String(formData.get("decision") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim().slice(0, 2000);
  if (!Types.ObjectId.isValid(workflowId) || !Types.ObjectId.isValid(documentId) || !["approved", "changes_requested"].includes(decisionValue) || !feedback) {
    redirect("/client/documents?error=client-review");
  }
  const updated = await recordClientDeliverableReview({
    principal,
    workflowId,
    documentId,
    decision: decisionValue as "approved" | "changes_requested",
    feedback,
  });
  revalidateDocuments();
  revalidatePath("/staff/engagements");
  revalidatePath(`/staff/engagements/${workflowId}`);
  revalidatePath("/admin/active-engagements");
  revalidatePath(`/admin/workflows/${workflowId}`);
  redirect(`/client/documents?${updated ? `reviewed=${decisionValue}` : "error=client-review"}`);
}
