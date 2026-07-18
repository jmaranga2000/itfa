import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { sendClientJourneyEmail } from "@/features/engagements/client-journey-email";
import type { WorkflowTaskStatus } from "@/features/workflows/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { clientRecipientName } from "@/lib/client-recipient";
import { ClientDocumentModel } from "@/models/client-document";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { createCommunicationNotification } from "@/repositories/communication-repository";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

export const ENGAGEMENT_DOCUMENT_KINDS = ["draft_deliverable", "final_deliverable", "technical_evidence"] as const;
export type EngagementDocumentKind = (typeof ENGAGEMENT_DOCUMENT_KINDS)[number];

export type EngagementDocumentRecord = {
  id: string;
  name: string;
  documentKind: EngagementDocumentKind | "general" | "signed_engagement_letter";
  status: string;
  contentType: string;
  size: number;
  direction: "sent" | "received";
  uploadedAt: string;
};

type RawEngagementDocument = {
  _id: Types.ObjectId;
  workflowId?: Types.ObjectId | null;
  clientUserId: Types.ObjectId;
  documentKind?: EngagementDocumentRecord["documentKind"];
  name: string;
  storageKey: string;
  contentType: string;
  size: number;
  direction: "sent" | "received";
  status: string;
  uploadedAt: Date;
};

function isClient(principal: Principal) {
  return principal.roleKeys.some((role) => role === "client" || role === "client_representative");
}

function isAdmin(principal: Principal) {
  return principal.roleKeys.some((role) => role === "admin" || role === "super_admin");
}

async function writableWorkflow(principal: Principal, workflowId: string) {
  if (principal.readOnly || isClient(principal)) return null;
  return getWorkflowForPrincipal(principal, workflowId);
}

async function notifyClientOfReleasedDocument(input: {
  actor: Principal;
  clientUserId: string;
  documentId: string;
  documentName: string;
  reference: string;
  final: boolean;
}) {
  if (!Types.ObjectId.isValid(input.clientUserId)) return;
  const client = await UserModel.findById(input.clientUserId)
    .select("email firstName lastName")
    .lean()
    .exec();
  if (!client) return;
  const title = input.final ? "Final engagement document available" : "Draft deliverable ready for review";
  const summary = input.final
    ? `${input.documentName} is now available in your client portal for ${input.reference}.`
    : `${input.documentName} passed technical review and is ready for your review in ${input.reference}.`;
  await Promise.allSettled([
    createCommunicationNotification({
      recipientUserId: input.clientUserId,
      type: "document_uploaded",
      title,
      description: summary,
      relatedModule: "documents",
      relatedRecordId: input.documentId,
      actionUrl: "/client/documents",
      createdByUserId: input.actor.id,
    }),
    sendClientJourneyEmail({
      recipientEmail: client.email,
      recipientName: clientRecipientName(client),
      title,
      summary,
      actionLabel: "Open documents",
      actionPath: "/client/documents",
    }),
  ]);
}

export async function listEngagementDocumentsForPrincipal(principal: Principal, workflowId: string): Promise<EngagementDocumentRecord[]> {
  const workflow = await getWorkflowForPrincipal(principal, workflowId);
  if (!workflow || !Types.ObjectId.isValid(workflowId)) return [];
  const records = await ClientDocumentModel.find({ workflowId: new Types.ObjectId(workflowId) })
    .sort({ uploadedAt: -1 })
    .lean()
    .exec() as RawEngagementDocument[];
  return records.map((record) => ({
    id: record._id.toString(),
    name: record.name,
    documentKind: record.documentKind ?? "general",
    status: record.status,
    contentType: record.contentType,
    size: record.size,
    direction: record.direction,
    uploadedAt: record.uploadedAt.toISOString(),
  }));
}

export async function updateEngagementTask(input: {
  principal: Principal;
  workflowId: string;
  taskKey: string;
  status: WorkflowTaskStatus;
}) {
  const workflow = await writableWorkflow(input.principal, input.workflowId);
  if (!workflow) return false;
  const task = workflow.tasks.find((item) => item.key === input.taskKey);
  if (!task) return false;
  const canManageAny = isAdmin(input.principal) || input.principal.roleKeys.includes("engagement_manager");
  if (task.assignedUserId && task.assignedUserId !== input.principal.id && !canManageAny) return false;
  const now = new Date();
  const set: Record<string, unknown> = {
    "tasks.$[task].status": input.status,
    lastActivityAt: now,
    nextAction: input.status === "waiting_for_approval" ? `Review ${task.title}` : input.status === "completed" ? "Continue with the next engagement task" : task.title,
  };
  if (input.status === "in_progress" && !task.startDate) set["tasks.$[task].startDate"] = now;
  if (input.status === "completed") {
    set["tasks.$[task].completedAt"] = now;
    set["tasks.$[task].completedByUserId"] = new Types.ObjectId(input.principal.id);
  }
  const result = await WorkflowInstanceModel.updateOne(
    { _id: input.workflowId },
    {
      $set: set,
      $push: { activity: {
        type: input.status === "completed" ? "task_completed" : "task_assigned",
        title: input.status === "completed" ? "Task completed" : "Task status updated",
        actorName: input.principal.email,
        actorUserId: new Types.ObjectId(input.principal.id),
        description: `${task.title}: ${input.status.replaceAll("_", " ")}`,
        relatedResource: input.taskKey,
        clientVisible: task.clientVisible,
        createdAt: now,
      } },
    },
    { arrayFilters: [{ "task.key": input.taskKey }] },
  ).exec();
  return result.matchedCount > 0;
}

export async function createEngagementDocument(input: {
  principal: Principal;
  workflowId: string;
  documentKind: EngagementDocumentKind;
  name: string;
  storageKey: string;
  contentType: string;
  size: number;
}) {
  const workflow = await writableWorkflow(input.principal, input.workflowId);
  if (!workflow?.clientUserId || !Types.ObjectId.isValid(input.principal.id)) return null;
  await connectToDatabase();
  const status = input.documentKind === "final_deliverable" ? "final" : "pending_review";
  const document = await ClientDocumentModel.create({
    clientUserId: workflow.clientUserId,
    workflowId: workflow.id,
    documentKind: input.documentKind,
    name: input.name,
    storageKey: input.storageKey,
    contentType: input.contentType,
    size: input.size,
    direction: "received",
    status,
    uploadedByUserId: input.principal.id,
  });
  const now = new Date();
  await WorkflowInstanceModel.updateOne(
    { _id: workflow.id },
    {
      $push: {
        documents: {
          documentId: document._id.toString(),
          name: input.name,
          status,
          version: 1,
          visibility: input.documentKind === "final_deliverable" ? "all" : "staff",
          uploadedAt: now,
        },
        activity: {
          type: "document_uploaded",
          title: input.documentKind === "final_deliverable" ? "Final deliverable shared" : "Engagement document uploaded",
          actorName: input.principal.email,
          actorUserId: new Types.ObjectId(input.principal.id),
          description: input.name,
          relatedResource: document._id.toString(),
          clientVisible: input.documentKind === "final_deliverable",
          createdAt: now,
        },
      },
      $set: { lastActivityAt: now },
    },
  ).exec();
  if (input.documentKind === "final_deliverable") {
    await notifyClientOfReleasedDocument({ actor: input.principal, clientUserId: workflow.clientUserId, documentId: document._id.toString(), documentName: input.name, reference: workflow.reference, final: true });
  }
  return document._id.toString();
}

export async function recordEngagementTechnicalReview(input: {
  principal: Principal;
  workflowId: string;
  documentId: string;
  decision: "approved" | "changes_requested";
  comments: string;
}) {
  const workflow = await writableWorkflow(input.principal, input.workflowId);
  if (!workflow || !Types.ObjectId.isValid(input.documentId) || !Types.ObjectId.isValid(input.principal.id)) return false;
  const allowed = isAdmin(input.principal) || input.principal.roleKeys.some((role) => role === "reviewer" || role === "engagement_manager" || role === "consultant");
  if (!allowed) return false;
  const stored = await ClientDocumentModel.findOne({ _id: input.documentId, workflowId: input.workflowId }).lean().exec() as RawEngagementDocument | null;
  if (!stored) return false;
  const status = input.decision === "approved" ? "approved" : "replacement_requested";
  const visibility = input.decision === "approved" && stored.documentKind === "draft_deliverable" ? "all" : "staff";
  const now = new Date();
  const approvalIndex = workflow.approvals.findIndex((approval) => approval.key === "technical-review");
  const update: Record<string, unknown> = {
    $set: {
      "documents.$[document].status": status,
      "documents.$[document].visibility": visibility,
      "documents.$[document].reviewerComments": input.comments,
      lastActivityAt: now,
    },
    $push: { activity: {
      type: "approval_decision",
      title: input.decision === "approved" ? "Technical review approved" : "Technical changes requested",
      actorName: input.principal.email,
      actorUserId: new Types.ObjectId(input.principal.id),
      description: `${stored.name}: ${input.comments}`,
      relatedResource: input.documentId,
      clientVisible: input.decision === "approved" && stored.documentKind === "draft_deliverable",
      createdAt: now,
    } },
  };
  if (approvalIndex >= 0) {
    Object.assign((update.$set as Record<string, unknown>), {
      [`approvals.${approvalIndex}.status`]: input.decision,
      [`approvals.${approvalIndex}.approverUserId`]: new Types.ObjectId(input.principal.id),
      [`approvals.${approvalIndex}.approverName`]: input.principal.email,
      [`approvals.${approvalIndex}.approvalDate`]: now,
      [`approvals.${approvalIndex}.decision`]: input.decision,
      [`approvals.${approvalIndex}.comments`]: input.comments,
    });
  } else {
    (update.$push as Record<string, unknown>).approvals = {
      key: "technical-review",
      title: "Technical review",
      stageKey: workflow.currentStageKey,
      status: input.decision,
      approverUserId: new Types.ObjectId(input.principal.id),
      approverName: input.principal.email,
      approvalDate: now,
      decision: input.decision,
      comments: input.comments,
    };
  }
  await Promise.all([
    WorkflowInstanceModel.updateOne({ _id: workflow.id }, update, { arrayFilters: [{ "document.documentId": input.documentId }] }).exec(),
    ClientDocumentModel.updateOne({ _id: input.documentId }, { $set: { status } }).exec(),
  ]);
  if (input.decision === "approved" && stored.documentKind === "draft_deliverable") {
    await notifyClientOfReleasedDocument({ actor: input.principal, clientUserId: stored.clientUserId.toString(), documentId: input.documentId, documentName: stored.name, reference: workflow.reference, final: false });
  }
  return true;
}

export async function getEngagementDocumentFile(principal: Principal, documentId: string) {
  if (!Types.ObjectId.isValid(documentId) || isClient(principal)) return null;
  await connectToDatabase();
  const document = await ClientDocumentModel.findById(documentId).lean().exec() as RawEngagementDocument | null;
  if (!document?.workflowId) return null;
  const workflow = await getWorkflowForPrincipal(principal, document.workflowId.toString());
  return workflow ? document : null;
}
