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
import { getPlatformSettings } from "@/repositories/platform-settings-repository";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

export const ENGAGEMENT_DOCUMENT_KINDS = ["draft_deliverable", "final_deliverable", "technical_evidence"] as const;
export type EngagementDocumentKind = (typeof ENGAGEMENT_DOCUMENT_KINDS)[number];
export type DeliverableStatus = "draft" | "pending_review" | "approved" | "released";

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
  deliverableStatus: DeliverableStatus;
  preparedByName: string;
  reviewedByName: string;
  reviewedAt: string | null;
  releasedByName: string;
  releasedAt: string | null;
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
  deliverableStatus?: DeliverableStatus;
  preparedByName?: string;
  reviewedByUserId?: Types.ObjectId | null;
  reviewedByName?: string;
  reviewedAt?: Date | null;
  releasedByUserId?: Types.ObjectId | null;
  releasedByName?: string;
  releasedAt?: Date | null;
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

function idString(value: unknown) {
  return value && typeof (value as { toString?: unknown }).toString === "function"
    ? (value as { toString: () => string }).toString()
    : "";
}

function dateString(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

async function activeAdministratorIds(excludeUserId?: string) {
  const administrators = await UserModel.find({
    status: "active",
    archivedAt: null,
    roleKeys: { $in: ["admin", "super_admin"] },
  }).select("_id").lean().exec();
  return administrators.map((administrator) => administrator._id.toString())
    .filter((userId) => userId !== excludeUserId);
}

async function writableWorkflow(principal: Principal, workflowId: string) {
  if (principal.readOnly || isClient(principal)) return null;
  const workflow = await getWorkflowForPrincipal(principal, workflowId);
  if (!workflow || workflow.status !== "active") return null;
  if (principal.roleKeys.includes("engagement_manager") && !isAdmin(principal)) {
    const assigned = workflow.responsibleUserId === principal.id
      || workflow.team.some((member) => member.userId === principal.id)
      || workflow.tasks.some((task) => task.assignedUserId === principal.id);
    if (!assigned) return null;
  }
  return workflow;
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
      actionUrl: `/client/engagements/${input.workflowId}?tab=${input.final ? "deliverables" : "documents"}`,
      createdByUserId: input.actor.id,
    }),
    sendClientJourneyEmail({
      recipientEmail: client.email,
      recipientName: clientRecipientName(client),
      title,
      summary,
      actionLabel: input.final ? "Open deliverables" : "Open documents",
      actionPath: `/client/engagements/${input.workflowId}?tab=${input.final ? "deliverables" : "documents"}`,
    }),
  ]);
}

export async function listEngagementDocumentsForPrincipal(principal: Principal, workflowId: string): Promise<EngagementDocumentRecord[]> {
  const workflow = await getWorkflowForPrincipal(principal, workflowId, true);
  if (!workflow || !Types.ObjectId.isValid(workflowId)) return [];
  const records = await ClientDocumentModel.find({ workflowId: new Types.ObjectId(workflowId), status: { $ne: "archived" } })
    .sort({ uploadedAt: -1 })
    .lean()
    .exec() as RawEngagementDocument[];
  const clientVisibleDocumentIds = new Set(workflow.documents
    .filter((document) => document.visibility === "client" || document.visibility === "all")
    .map((document) => document.documentId));
  const assignedStaff = workflow.responsibleUserId === principal.id
    || workflow.team.some((member) => member.userId === principal.id)
    || workflow.tasks.some((task) => task.assignedUserId === principal.id);
  const visibleRecords = isClient(principal)
    ? records.filter((record) => {
        const uploadedByClient = idString(record.uploadedByUserId) === principal.id;
        if (record.documentKind === "final_deliverable") {
          return record.deliverableStatus === "released" || (!record.deliverableStatus && record.status === "final");
        }
        if (record.documentKind === "technical_evidence") return false;
        return uploadedByClient
          || record.documentKind === "signed_engagement_letter"
          || clientVisibleDocumentIds.has(record._id.toString());
      })
    : isAdmin(principal) || assignedStaff ? records : [];
  const uploaderIds = [...new Set(visibleRecords.map((record) => idString(record.uploadedByUserId)).filter(Boolean))];
  const uploaders = uploaderIds.length > 0
    ? await UserModel.find({ _id: { $in: uploaderIds } }).select("firstName lastName email").lean().exec()
    : [];
  const uploaderNames = new Map(uploaders.map((user) => [
    user._id.toString(),
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
  ]));
  return visibleRecords.map((record) => ({
    id: record._id.toString(),
    name: record.name,
    documentKind: record.documentKind ?? "general",
    status: record.status,
    contentType: record.contentType,
    size: record.size,
    direction: record.direction,
    uploadedAt: dateString(record.uploadedAt),
    uploadedByUserId: idString(record.uploadedByUserId),
    uploadedByName: uploaderNames.get(idString(record.uploadedByUserId)) ?? "Portal user",
    version: record.version ?? 1,
    replacesDocumentId: record.replacesDocumentId?.toString() ?? null,
    deliverableStatus: record.deliverableStatus ?? (record.documentKind === "final_deliverable" && record.status === "final" ? "released" : "draft"),
    preparedByName: record.preparedByName ?? uploaderNames.get(idString(record.uploadedByUserId)) ?? "Portal user",
    reviewedByName: record.reviewedByName ?? "",
    reviewedAt: dateString(record.reviewedAt) || null,
    releasedByName: record.releasedByName ?? "",
    releasedAt: dateString(record.releasedAt) || null,
    comments: (record.comments ?? []).map((comment) => ({
      body: comment.body,
      authorUserId: idString(comment.authorUserId),
      authorName: comment.authorName,
      createdAt: dateString(comment.createdAt),
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
  const assignedManager = input.principal.roleKeys.includes("engagement_manager") && (
    workflow.responsibleUserId === input.principal.id
    || workflow.team.some((member) => member.userId === input.principal.id)
    || workflow.tasks.some((workflowTask) => workflowTask.assignedUserId === input.principal.id)
  );
  const roleAssignments = new Set<string>(input.principal.roleKeys);
  if (input.principal.roleKeys.includes("consultant")) roleAssignments.add("lead_consultant");
  const canManageAny = isAdmin(input.principal) || assignedManager;
  const canUpdateByRole = !task.assignedUserId
    && roleAssignments.has(task.assignedRole)
    && workflow.team.some((member) => member.role === task.assignedRole && member.userId === input.principal.id);
  if (task.assignedUserId && task.assignedUserId !== input.principal.id && !canManageAny) return false;
  if (!task.assignedUserId && !canManageAny && !canUpdateByRole) return false;
  if (input.status === "waiting_for_approval" && task.status !== "in_progress") return false;
  if (input.status === "completed" && (task.approvalRequired || task.status !== "in_progress")) return false;
  if (input.status === "in_progress") {
    const incompleteDependencies = task.dependencies.filter((dependencyKey) => {
      const dependency = workflow.tasks.find((candidate) => candidate.key === dependencyKey);
      return dependency && dependency.status !== "completed";
    });
    if (incompleteDependencies.length > 0) return false;
  }
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
    { _id: input.workflowId, status: "active", archivedAt: null },
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
    const reviewer = workflow.team.find((member) => member.role === "reviewer")?.userId;
    const administratorIds = await activeAdministratorIds(input.principal.id);
    const recipients = [...new Set([reviewer, ...administratorIds].filter((userId): userId is string => Boolean(userId) && userId !== input.principal.id))];
    await Promise.allSettled(recipients.map((recipientUserId) => createCommunicationNotification({
      recipientUserId,
      type: "action_required",
      title: "Work submitted for review",
      description: `${task.title} in ${workflow.reference} is ready for your decision.`,
      relatedModule: "engagements",
      relatedRecordId: workflow.id,
      actionUrl: administratorIds.includes(recipientUserId)
        ? `/admin/active-engagements/${workflow.id}?tab=tasks`
        : `/staff/engagements/${workflow.id}?tab=tasks`,
      createdByUserId: input.principal.id,
    })));
  }
  return result.matchedCount > 0;
}

export type EngagementDocumentCreateFailure =
  | "access"
  | "consultant_assignment"
  | "dependencies"
  | "task_not_ready"
  | "client_approval";

export type EngagementDocumentCreateResult =
  | { ok: true; documentId: string }
  | { ok: false; reason: EngagementDocumentCreateFailure };

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
  if (!workflow?.clientUserId || !Types.ObjectId.isValid(input.principal.id)) return { ok: false, reason: "access" } as const;
  const isDraft = input.documentKind === "draft_deliverable";
  const isDeliverable = input.documentKind === "final_deliverable";
  const controlledTaskKey = isDraft ? "draft_deliverable" : isDeliverable ? "final_deliverable" : null;
  const controlledTask = controlledTaskKey ? workflow.tasks.find((task) => task.key === controlledTaskKey) : null;
  const assignedPreparer = input.principal.roleKeys.includes("consultant")
    && workflow.team.some((member) =>
      member.role === "consultant" && member.userId === input.principal.id,
    );
  if ((isDraft || isDeliverable) && !assignedPreparer) return { ok: false, reason: "consultant_assignment" } as const;
  if (controlledTask) {
    const prerequisitesComplete = controlledTask.dependencies.every((dependencyKey) => {
      const dependency = workflow.tasks.find((task) => task.key === dependencyKey);
      return !dependency || dependency.status === "completed";
    });
    if (!prerequisitesComplete) return { ok: false, reason: "dependencies" } as const;
    if (!["not_started", "ready", "in_progress"].includes(controlledTask.status)) {
      return { ok: false, reason: "task_not_ready" } as const;
    }
  }
  const clientDraftApproved = workflow.clientActions.some((action) => action.key === "review_deliverable" && action.status === "completed");
  if (isDeliverable && !clientDraftApproved) return { ok: false, reason: "client_approval" } as const;
  const [settings] = await Promise.all([getPlatformSettings(), connectToDatabase()]);
  const deliverableStatus: DeliverableStatus = isDeliverable
    ? settings.engagement.requireDeliverableApproval
      ? "pending_review"
      : "approved"
    : "draft";
  const status = isDeliverable && deliverableStatus === "approved" ? "approved" : "pending_review";
  const replaced = input.replacesDocumentId && Types.ObjectId.isValid(input.replacesDocumentId)
    ? await ClientDocumentModel.findOne({ _id: input.replacesDocumentId, workflowId: input.workflowId, status: { $ne: "archived" } }).lean().exec() as RawEngagementDocument | null
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
    deliverableStatus,
    preparedByName: input.principal.displayName || input.principal.email,
    replacesDocumentId: replaced?._id ?? null,
    uploadedByUserId: input.principal.id,
  });
  const now = new Date();
  const taskStatus = isDeliverable && deliverableStatus === "approved" ? "completed" : "waiting_for_approval";
  const workflowSet: Record<string, unknown> = { lastActivityAt: now };
  if (controlledTaskKey) {
    workflowSet["tasks.$[task].status"] = taskStatus;
    workflowSet["tasks.$[task].completionNotes"] = `${input.name} uploaded for controlled review.`;
    workflowSet.currentStageName = taskStatus === "completed" ? "Final Deliverable" : "Internal Review";
    workflowSet.nextAction = taskStatus === "completed" ? "Release the final deliverable to the client" : `Review ${input.name}`;
    if (taskStatus === "completed") {
      workflowSet["tasks.$[task].completedAt"] = now;
      workflowSet["tasks.$[task].completedByUserId"] = new Types.ObjectId(input.principal.id);
    }
  }
  await WorkflowInstanceModel.updateOne(
    { _id: workflow.id, status: "active", archivedAt: null },
    {
      $push: {
        documents: {
          documentId: document._id.toString(),
          name: input.name,
          status,
          version,
          visibility: "staff",
          uploadedAt: now,
        },
        activity: {
          type: "document_uploaded",
          title: isDraft ? "Draft deliverable submitted" : isDeliverable ? "Final deliverable submitted" : "Engagement document uploaded",
          actorName: input.principal.email,
          actorUserId: new Types.ObjectId(input.principal.id),
          description: input.name,
          relatedResource: document._id.toString(),
          clientVisible: false,
          createdAt: now,
        },
      },
      $set: workflowSet,
    },
    controlledTaskKey ? { arrayFilters: [{ "task.key": controlledTaskKey }] } : undefined,
  ).exec();
  if (status === "pending_review") {
    const reviewer = workflow.team.find((member) => member.role === "reviewer")?.userId;
    const administratorIds = await activeAdministratorIds(input.principal.id);
    const recipients = [...new Set([reviewer, ...administratorIds].filter((userId): userId is string => Boolean(userId) && userId !== input.principal.id))];
    const tab = isDeliverable ? "deliverables" : "documents";
    const title = isDraft ? "Draft deliverable submitted for review" : isDeliverable ? "Final deliverable submitted for review" : "Engagement document uploaded";
    await Promise.allSettled(recipients.map((recipientUserId) => createCommunicationNotification({
      recipientUserId,
      type: isDraft || isDeliverable ? "action_required" : "document_uploaded",
      title,
      description: `${input.name} is ready for review in ${workflow.reference}.`,
      relatedModule: "engagements",
      relatedRecordId: workflow.id,
      actionUrl: administratorIds.includes(recipientUserId)
        ? `/admin/active-engagements/${workflow.id}?tab=${tab}`
        : `/staff/engagements/${workflow.id}?tab=${tab}`,
      createdByUserId: input.principal.id,
    })));
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
  return { ok: true, documentId: document._id.toString() } as const;
}

export async function reviewEngagementDeliverable(input: {
  principal: Principal;
  workflowId: string;
  documentId: string;
  decision: "approved" | "changes_requested";
  comments: string;
}) {
  const workflow = await writableWorkflow(input.principal, input.workflowId);
  if (!workflow || !Types.ObjectId.isValid(input.documentId) || !Types.ObjectId.isValid(input.principal.id)) return false;
  const allowed = isAdmin(input.principal)
    || (input.principal.roleKeys.includes("reviewer")
      && workflow.team.some((member) => member.role === "reviewer" && member.userId === input.principal.id));
  if (!allowed) return false;
  const stored = await ClientDocumentModel.findOne({
    _id: input.documentId,
    workflowId: input.workflowId,
    documentKind: "final_deliverable",
    deliverableStatus: "pending_review",
  }).lean().exec() as RawEngagementDocument | null;
  if (!stored) return false;

  const now = new Date();
  const approved = input.decision === "approved";
  const deliverableStatus: DeliverableStatus = approved ? "approved" : "draft";
  const status = approved ? "approved" : "replacement_requested";
  await Promise.all([
    ClientDocumentModel.updateOne(
      { _id: stored._id },
      { $set: {
        status,
        deliverableStatus,
        reviewedByUserId: new Types.ObjectId(input.principal.id),
        reviewedByName: input.principal.displayName || input.principal.email,
        reviewedAt: now,
        feedback: input.comments,
      } },
    ).exec(),
    WorkflowInstanceModel.updateOne(
      { _id: workflow.id },
      {
        $set: {
          "documents.$[document].status": status,
          "documents.$[document].visibility": "staff",
          "documents.$[document].reviewerComments": input.comments,
          lastActivityAt: now,
        },
        $push: { activity: {
          type: "approval_decision",
          title: approved ? "Deliverable Approved" : "Deliverable Changes Requested",
          actorName: input.principal.displayName || input.principal.email,
          actorUserId: new Types.ObjectId(input.principal.id),
          description: `${stored.name}: ${input.comments}`,
          relatedResource: input.documentId,
          clientVisible: false,
          createdAt: now,
        } },
      },
      { arrayFilters: [{ "document.documentId": input.documentId }] },
    ).exec(),
  ]);

  if (workflow.tasks.some((task) => task.key === "final_deliverable")) {
    await WorkflowInstanceModel.updateOne(
      { _id: workflow.id, status: "active", archivedAt: null },
      {
        $set: {
          "tasks.$[task].status": approved ? "waiting_for_approval" : "in_progress",
          "tasks.$[task].completionNotes": input.comments,
          nextAction: approved ? "Release the approved final deliverable to the client" : `Revise ${stored.name} and upload a replacement`,
        },
        $push: { "tasks.$[task].reviewHistory": {
          decision: input.decision,
          comments: input.comments,
          reviewerUserId: new Types.ObjectId(input.principal.id),
          reviewerName: input.principal.displayName || input.principal.email,
          reviewedAt: now,
        } },
      },
      { arrayFilters: [{ "task.key": "final_deliverable" }] },
    ).exec();
  }
  const preparerIds = [stored.uploadedByUserId.toString(), ...workflow.team
    .filter((member) => member.role === "consultant")
    .map((member) => member.userId)
    .filter((userId): userId is string => Boolean(userId))];
  await Promise.allSettled([...new Set(preparerIds)]
    .filter((userId) => userId !== input.principal.id)
    .map((recipientUserId) => createCommunicationNotification({
      recipientUserId,
      type: "engagement_update",
      title: approved ? "Deliverable approved" : "Deliverable changes requested",
      description: `${stored.name}: ${input.comments}`,
      relatedModule: "engagements",
      relatedRecordId: workflow.id,
      actionUrl: `/staff/engagements/${workflow.id}?tab=deliverables`,
      createdByUserId: input.principal.id,
    })));
  return true;
}

export async function releaseEngagementDeliverable(input: {
  principal: Principal;
  workflowId: string;
  documentId: string;
}) {
  const workflow = await writableWorkflow(input.principal, input.workflowId);
  if (!workflow?.clientUserId || !Types.ObjectId.isValid(input.documentId) || !Types.ObjectId.isValid(input.principal.id)) return false;
  const assignedManager = input.principal.roleKeys.includes("engagement_manager") && (
    workflow.responsibleUserId === input.principal.id
    || workflow.team.some((member) => member.userId === input.principal.id)
    || workflow.tasks.some((task) => task.assignedUserId === input.principal.id)
  );
  const allowed = isAdmin(input.principal)
    || assignedManager
    || workflow.team.some((member) => member.role === "consultant" && member.userId === input.principal.id);
  if (!allowed) return false;
  const stored = await ClientDocumentModel.findOne({
    _id: input.documentId,
    workflowId: input.workflowId,
    documentKind: "final_deliverable",
  }).lean().exec() as RawEngagementDocument | null;
  if (!stored || stored.deliverableStatus === "released") return false;
  if (stored.deliverableStatus !== "approved") return false;

  const now = new Date();
  await Promise.all([
    ClientDocumentModel.updateOne(
      { _id: stored._id },
      { $set: {
        status: "final",
        deliverableStatus: "released",
        releasedByUserId: new Types.ObjectId(input.principal.id),
        releasedByName: input.principal.displayName || input.principal.email,
        releasedAt: now,
      } },
    ).exec(),
    WorkflowInstanceModel.updateOne(
      { _id: workflow.id },
      {
        $set: {
          "documents.$[document].status": "final",
          "documents.$[document].visibility": "all",
          lastActivityAt: now,
        },
        $push: { activity: {
          type: "document_uploaded",
          title: "Deliverable Released",
          actorName: input.principal.displayName || input.principal.email,
          actorUserId: new Types.ObjectId(input.principal.id),
          description: `${stored.name} was released to the client.`,
          relatedResource: input.documentId,
          clientVisible: true,
          createdAt: now,
        } },
      },
      { arrayFilters: [{ "document.documentId": input.documentId }] },
    ).exec(),
  ]);
  const finalTaskIndex = workflow.tasks.findIndex((task) => task.key === "final_deliverable");
  const activeStageIndex = workflow.stages.findIndex((stage) => stage.key === "active_work");
  const financeStageIndex = workflow.stages.findIndex((stage) => stage.key === "finance");
  const progressionSet: Record<string, unknown> = {
    currentStageKey: financeStageIndex >= 0 ? "finance" : workflow.currentStageKey,
    currentStageName: financeStageIndex >= 0 ? "Invoice Completion" : "Final Deliverable Released",
    nextAction: financeStageIndex >= 0 ? "Finance officer to prepare and issue the engagement invoice" : "Continue the engagement workflow",
  };
  if (finalTaskIndex >= 0) Object.assign(progressionSet, {
    [`tasks.${finalTaskIndex}.status`]: "completed",
    [`tasks.${finalTaskIndex}.completedAt`]: now,
    [`tasks.${finalTaskIndex}.completedByUserId`]: new Types.ObjectId(input.principal.id),
  });
  if (activeStageIndex >= 0) Object.assign(progressionSet, {
    [`stages.${activeStageIndex}.status`]: "completed",
    [`stages.${activeStageIndex}.completedAt`]: now,
  });
  if (financeStageIndex >= 0) Object.assign(progressionSet, {
    [`stages.${financeStageIndex}.status`]: "in_progress",
    [`stages.${financeStageIndex}.enteredAt`]: workflow.stages[financeStageIndex].enteredAt ?? now,
  });
  await WorkflowInstanceModel.updateOne({ _id: workflow.id, status: "active", archivedAt: null }, { $set: progressionSet }).exec();
  await notifyClientOfReleasedDocument({
    actor: input.principal,
    clientUserId: workflow.clientUserId,
    documentId: input.documentId,
    documentName: stored.name,
    reference: workflow.reference,
    workflowId: workflow.id,
    final: true,
  });
  return true;
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
    { _id: input.workflowId, status: "active", archivedAt: null },
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
  const allowed = isAdmin(input.principal)
    || (input.principal.roleKeys.includes("reviewer")
      && workflow.team.some((member) => member.role === "reviewer" && member.userId === input.principal.id));
  if (!allowed) return false;
  const stored = await ClientDocumentModel.findOne({ _id: input.documentId, workflowId: input.workflowId, status: { $ne: "archived" } }).lean().exec() as RawEngagementDocument | null;
  if (!stored) return false;

  const approved = input.decision === "approved";
  const isDraft = stored.documentKind === "draft_deliverable";
  const status = approved ? "approved" : "replacement_requested";
  const visibility = approved && isDraft ? "all" : "staff";
  const now = new Date();
  const approvalIndex = workflow.approvals.findIndex((approval) => approval.key === "technical-review");
  const draftTaskIndex = workflow.tasks.findIndex((task) => task.key === "draft_deliverable");
  const activeStageIndex = workflow.stages.findIndex((stage) => stage.key === "active_work");
  const clientStageIndex = workflow.stages.findIndex((stage) => stage.key === "client_review");
  const clientReviewIndex = workflow.clientActions.findIndex((action) => action.key === "review_deliverable");
  const set: Record<string, unknown> = {
    "documents.$[document].status": status,
    "documents.$[document].visibility": visibility,
    "documents.$[document].reviewerComments": input.comments,
    lastActivityAt: now,
  };
  const push: Record<string, unknown> = {
    activity: {
      type: "approval_decision",
      title: approved ? "Technical review approved" : "Technical changes requested",
      actorName: input.principal.displayName || input.principal.email,
      actorUserId: new Types.ObjectId(input.principal.id),
      description: `${stored.name}: ${input.comments}`,
      relatedResource: input.documentId,
      clientVisible: approved && isDraft,
      createdAt: now,
    },
  };

  if (approvalIndex >= 0) {
    Object.assign(set, {
      [`approvals.${approvalIndex}.status`]: input.decision,
      [`approvals.${approvalIndex}.approverUserId`]: new Types.ObjectId(input.principal.id),
      [`approvals.${approvalIndex}.approverName`]: input.principal.displayName || input.principal.email,
      [`approvals.${approvalIndex}.approvalDate`]: now,
      [`approvals.${approvalIndex}.decision`]: input.decision,
      [`approvals.${approvalIndex}.comments`]: input.comments,
    });
  } else {
    push.approvals = {
      key: "technical-review",
      title: "Technical review",
      stageKey: workflow.currentStageKey,
      status: input.decision,
      approverUserId: new Types.ObjectId(input.principal.id),
      approverName: input.principal.displayName || input.principal.email,
      approvalDate: now,
      decision: input.decision,
      comments: input.comments,
    };
  }

  if (isDraft && draftTaskIndex >= 0) {
    Object.assign(set, {
      [`tasks.${draftTaskIndex}.status`]: approved ? "completed" : "in_progress",
      [`tasks.${draftTaskIndex}.completionNotes`]: input.comments,
      [`tasks.${draftTaskIndex}.completedAt`]: approved ? now : null,
      [`tasks.${draftTaskIndex}.completedByUserId`]: approved ? new Types.ObjectId(input.principal.id) : null,
    });
    push[`tasks.${draftTaskIndex}.reviewHistory`] = {
      decision: input.decision,
      comments: input.comments,
      reviewerUserId: new Types.ObjectId(input.principal.id),
      reviewerName: input.principal.displayName || input.principal.email,
      reviewedAt: now,
    };
  }

  if (isDraft && approved) {
    Object.assign(set, {
      currentStageKey: "client_review",
      currentStageName: "Client Review",
      nextAction: "Waiting for the client to review the approved draft deliverable",
    });
    if (activeStageIndex >= 0) Object.assign(set, {
      [`stages.${activeStageIndex}.status`]: "completed",
      [`stages.${activeStageIndex}.completedAt`]: now,
    });
    if (clientStageIndex >= 0) Object.assign(set, {
      [`stages.${clientStageIndex}.status`]: "waiting_for_client",
      [`stages.${clientStageIndex}.enteredAt`]: workflow.stages[clientStageIndex].enteredAt ?? now,
    });
    if (clientReviewIndex >= 0) {
      Object.assign(set, {
        [`clientActions.${clientReviewIndex}.status`]: "pending",
        [`clientActions.${clientReviewIndex}.response`]: "",
        [`clientActions.${clientReviewIndex}.respondedAt`]: null,
      });
    } else {
      push.clientActions = {
        key: "review_deliverable",
        title: "Review draft deliverable",
        instructions: `Review ${stored.name}. Approve it to allow final preparation, or request changes with clear feedback.`,
        dueDate: new Date(now.getTime() + 5 * 86_400_000),
        relatedTaskKey: "draft_deliverable",
        requiredDocumentType: null,
        priority: "high",
        assignedClientUserId: workflow.clientUserId,
        status: "pending",
        response: "",
        respondedAt: null,
      };
    }
  } else if (isDraft && !approved) {
    Object.assign(set, {
      currentStageKey: "active_work",
      currentStageName: "Active Work",
      nextAction: `Revise ${stored.name} and submit a replacement`,
    });
  }

  await Promise.all([
    WorkflowInstanceModel.updateOne(
      { _id: workflow.id },
      { $set: set, $push: push },
      { arrayFilters: [{ "document.documentId": input.documentId }] },
    ).exec(),
    ClientDocumentModel.updateOne(
      { _id: input.documentId },
      { $set: {
        status,
        feedback: input.comments,
        reviewedByUserId: new Types.ObjectId(input.principal.id),
        reviewedByName: input.principal.displayName || input.principal.email,
        reviewedAt: now,
      } },
    ).exec(),
  ]);

  if (approved && isDraft) {
    await notifyClientOfReleasedDocument({
      actor: input.principal,
      clientUserId: stored.clientUserId.toString(),
      documentId: input.documentId,
      documentName: stored.name,
      reference: workflow.reference,
      workflowId: workflow.id,
      final: false,
    });
  }
  const uploaderUserId = stored.uploadedByUserId.toString();
  if (uploaderUserId !== input.principal.id) {
    await createCommunicationNotification({
      recipientUserId: uploaderUserId,
      type: approved ? "engagement_update" : "action_required",
      title: approved ? "Document approved" : "Document changes requested",
      description: `${stored.name}: ${input.comments}`,
      relatedModule: "engagements",
      relatedRecordId: workflow.id,
      actionUrl: `/staff/engagements/${workflow.id}?tab=documents`,
      createdByUserId: input.principal.id,
    });
  }
  return true;
}

export async function getEngagementDocumentFile(principal: Principal, documentId: string) {
  if (!Types.ObjectId.isValid(documentId)) return null;
  await connectToDatabase();
  const document = await ClientDocumentModel.findOne({ _id: documentId, status: { $ne: "archived" } }).lean().exec() as RawEngagementDocument | null;
  if (!document?.workflowId) return null;
  const workflow = await getWorkflowForPrincipal(principal, document.workflowId.toString(), true);
  if (!workflow) return null;
  const assignedStaff = workflow.responsibleUserId === principal.id
    || workflow.team.some((member) => member.userId === principal.id)
    || workflow.tasks.some((task) => task.assignedUserId === principal.id);
  if (!isClient(principal) && !isAdmin(principal) && !assignedStaff) return null;
  if (isClient(principal)) {
    const workflowDocument = workflow.documents.find((record) => record.documentId === documentId);
    const clientVisible = workflowDocument?.visibility === "client" || workflowDocument?.visibility === "all";
    if (document.documentKind === "technical_evidence") return null;
    if (document.documentKind === "draft_deliverable"
      && (!clientVisible || !["approved", "final"].includes(document.status))) return null;
  }
  const legacyReleased = document.documentKind === "final_deliverable"
    && !document.deliverableStatus
    && document.status === "final";
  if (isClient(principal)
    && document.documentKind === "final_deliverable"
    && document.deliverableStatus !== "released"
    && !legacyReleased) return null;
  return document;
}
