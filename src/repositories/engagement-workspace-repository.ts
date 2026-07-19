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
  uploadedByUserId: string;
  uploadedByName: string;
  version: number;
  replacesDocumentId: string | null;
  comments: Array<{
    body: string;
    authorUserId: string;
    authorName: string;
    createdAt: string;
  }>;
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
  uploadedByUserId: Types.ObjectId;
  version?: number;
  replacesDocumentId?: Types.ObjectId | null;
  comments?: Array<{
    body: string;
    authorUserId: Types.ObjectId;
    authorName: string;
    createdAt: Date;
  }>;
};

function isClient(principal: Principal) {
  return principal.roleKeys.some((role) => role === "client" || role === "client_representative");
}

function isAdmin(principal: Principal) {
  return principal.roleKeys.some((role) => role === "admin" || role === "super_admin");
}

async function writableWorkflow(principal: Principal, workflowId: string) {
  if (principal.readOnly || isClient(principal)) return null;
  const workflow = await getWorkflowForPrincipal(principal, workflowId);
  return workflow?.status === "active" ? workflow : null;
}

async function notifyClientOfReleasedDocument(input: {
  actor: Principal;
  clientUserId: string;
  documentId: string;
  documentName: string;
  reference: string;
  workflowId: string;
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
      actionUrl: `/client/engagements/${input.workflowId}?tab=documents`,
      createdByUserId: input.actor.id,
    }),
    sendClientJourneyEmail({
      recipientEmail: client.email,
      recipientName: clientRecipientName(client),
      title,
      summary,
      actionLabel: "Open documents",
      actionPath: `/client/engagements/${input.workflowId}?tab=documents`,
    }),
  ]);
}

export async function listEngagementDocumentsForPrincipal(principal: Principal, workflowId: string): Promise<EngagementDocumentRecord[]> {
  const workflow = await getWorkflowForPrincipal(principal, workflowId, true);
  if (!workflow || !Types.ObjectId.isValid(workflowId)) return [];
  const records = await ClientDocumentModel.find({ workflowId: new Types.ObjectId(workflowId) })
    .sort({ uploadedAt: -1 })
    .lean()
    .exec() as RawEngagementDocument[];
  const uploaderIds = [...new Set(records.map((record) => record.uploadedByUserId.toString()))];
  const uploaders = uploaderIds.length > 0
    ? await UserModel.find({ _id: { $in: uploaderIds } }).select("firstName lastName email").lean().exec()
    : [];
  const uploaderNames = new Map(uploaders.map((user) => [
    user._id.toString(),
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
  ]));
  return records.map((record) => ({
    id: record._id.toString(),
    name: record.name,
    documentKind: record.documentKind ?? "general",
    status: record.status,
    contentType: record.contentType,
    size: record.size,
    direction: record.direction,
    uploadedAt: record.uploadedAt.toISOString(),
    uploadedByUserId: record.uploadedByUserId.toString(),
    uploadedByName: uploaderNames.get(record.uploadedByUserId.toString()) ?? "Portal user",
    version: record.version ?? 1,
    replacesDocumentId: record.replacesDocumentId?.toString() ?? null,
    comments: (record.comments ?? []).map((comment) => ({
      body: comment.body,
      authorUserId: comment.authorUserId.toString(),
      authorName: comment.authorName,
      createdAt: comment.createdAt.toISOString(),
    })),
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
  if (input.status === "waiting_for_approval" && task.status !== "in_progress") return false;
  if (input.status === "completed" && task.approvalRequired) return false;
  const now = new Date();
  const set: Record<string, unknown> = {
    "tasks.$[task].status": input.status,
    currentStageName: input.status === "waiting_for_approval" ? "Internal Review" : "Work in Progress",
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
        type: input.status === "completed"
          ? "task_completed"
          : input.status === "waiting_for_approval"
            ? "work_submitted_for_review"
            : "task_assigned",
        title: input.status === "completed"
          ? "Task Completed"
          : input.status === "waiting_for_approval"
            ? "Work Submitted for Review"
            : "Task Status Updated",
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
  if (result.matchedCount > 0 && input.status === "waiting_for_approval") {
    const reviewer = workflow.team.find((member) => member.role === "reviewer");
    if (reviewer?.userId) {
      await createCommunicationNotification({
        recipientUserId: reviewer.userId,
        type: "action_required",
        title: "Work submitted for review",
        description: `${task.title} in ${workflow.reference} is ready for your decision.`,
        relatedModule: "engagements",
        relatedRecordId: workflow.id,
        actionUrl: `/staff/engagements/${workflow.id}?tab=tasks`,
        createdByUserId: input.principal.id,
      });
    }
  }
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
  replacesDocumentId?: string | null;
}) {
  const workflow = await writableWorkflow(input.principal, input.workflowId);
  if (!workflow?.clientUserId || !Types.ObjectId.isValid(input.principal.id)) return null;
  await connectToDatabase();
  const status = input.documentKind === "final_deliverable" ? "final" : "pending_review";
  const replaced = input.replacesDocumentId && Types.ObjectId.isValid(input.replacesDocumentId)
    ? await ClientDocumentModel.findOne({ _id: input.replacesDocumentId, workflowId: input.workflowId }).lean().exec() as RawEngagementDocument | null
    : null;
  const version = replaced ? (replaced.version ?? 1) + 1 : 1;
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
    version,
    replacesDocumentId: replaced?._id ?? null,
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
          version,
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
    await notifyClientOfReleasedDocument({ actor: input.principal, clientUserId: workflow.clientUserId, documentId: document._id.toString(), documentName: input.name, reference: workflow.reference, workflowId: workflow.id, final: true });
  } else {
    const reviewer = workflow.team.find((member) => member.role === "reviewer");
    if (reviewer?.userId) {
      await createCommunicationNotification({
        recipientUserId: reviewer.userId,
        type: "document_uploaded",
        title: "Engagement document uploaded",
        description: `${input.name} is ready for review in ${workflow.reference}.`,
        relatedModule: "engagements",
        relatedRecordId: workflow.id,
        actionUrl: `/staff/engagements/${workflow.id}?tab=documents`,
        createdByUserId: input.principal.id,
      });
    }
  }
  if (replaced) {
    await Promise.all([
      ClientDocumentModel.updateOne({ _id: replaced._id }, { $set: { status: "superseded" } }).exec(),
      WorkflowInstanceModel.updateOne(
        { _id: workflow.id, "documents.documentId": replaced._id.toString() },
        { $set: { "documents.$.status": "superseded" } },
      ).exec(),
    ]);
  }
  return document._id.toString();
}

export async function addEngagementDocumentComment(input: {
  principal: Principal;
  workflowId: string;
  documentId: string;
  body: string;
}) {
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  if (!workflow || workflow.status !== "active" || !Types.ObjectId.isValid(input.documentId) || !Types.ObjectId.isValid(input.principal.id)) return false;
  const body = input.body.trim().slice(0, 1500);
  if (body.length < 2) return false;
  const now = new Date();
  const result = await ClientDocumentModel.updateOne(
    { _id: input.documentId, workflowId: input.workflowId },
    { $push: { comments: {
      body,
      authorUserId: new Types.ObjectId(input.principal.id),
      authorName: input.principal.displayName || input.principal.email,
      createdAt: now,
    } } },
  ).exec();
  if (result.matchedCount === 0) return false;
  await WorkflowInstanceModel.updateOne(
    { _id: input.workflowId },
    { $set: { lastActivityAt: now }, $push: { activity: {
      type: "document_uploaded",
      title: "Document comment added",
      actorName: input.principal.displayName || input.principal.email,
      actorUserId: new Types.ObjectId(input.principal.id),
      description: body,
      relatedResource: input.documentId,
      clientVisible: true,
      createdAt: now,
    } } },
  ).exec();
  return true;
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
  const clientReviewIndex = workflow.clientActions.findIndex((action) => action.key === "review_deliverable");
  if (clientReviewIndex >= 0 && input.decision === "approved" && stored.documentKind === "draft_deliverable") {
    Object.assign((update.$set as Record<string, unknown>), {
      [`clientActions.${clientReviewIndex}.status`]: "pending",
    });
  }
  await Promise.all([
    WorkflowInstanceModel.updateOne({ _id: workflow.id }, update, { arrayFilters: [{ "document.documentId": input.documentId }] }).exec(),
    ClientDocumentModel.updateOne({ _id: input.documentId }, { $set: { status } }).exec(),
  ]);
  if (input.decision === "approved" && stored.documentKind === "draft_deliverable") {
    await notifyClientOfReleasedDocument({ actor: input.principal, clientUserId: stored.clientUserId.toString(), documentId: input.documentId, documentName: stored.name, reference: workflow.reference, workflowId: workflow.id, final: false });
  }
  return true;
}

export async function getEngagementDocumentFile(principal: Principal, documentId: string) {
  if (!Types.ObjectId.isValid(documentId)) return null;
  await connectToDatabase();
  const document = await ClientDocumentModel.findById(documentId).lean().exec() as RawEngagementDocument | null;
  if (!document?.workflowId) return null;
  const workflow = await getWorkflowForPrincipal(principal, document.workflowId.toString(), true);
  return workflow ? document : null;
}
