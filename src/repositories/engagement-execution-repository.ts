import { createHash, randomBytes, randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { hasPermission } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { sendClientJourneyEmailToUser } from "@/features/engagements/client-journey-email";
import type { WorkflowPriority } from "@/features/workflows/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { createZipBuffer, type ZipEntry } from "@/lib/zip";
import { ArchiveRecordModel } from "@/models/archive-record";
import { AuditLogModel } from "@/models/audit-log";
import { ClientPaymentModel } from "@/models/client-payment";
import { ClientDocumentModel } from "@/models/client-document";
import { CommunicationConversationModel } from "@/models/communication-conversation";
import { CommunicationNotificationModel } from "@/models/communication-notification";
import { EngagementLetterModel } from "@/models/engagement-letter";
import { EngagementRequestModel } from "@/models/engagement-request";
import { FiscalInvoiceModel } from "@/models/fiscal-invoice";
import { QuotationModel } from "@/models/quotation";
import { RequestStaffAssignmentModel } from "@/models/request-staff-assignment";
import { StaffNoteModel } from "@/models/staff-note";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { WorkflowTemplateModel } from "@/models/workflow-template";
import {
  createCommunicationNotification,
  getOrCreateEngagementConversation,
  listMessagesForConversation,
  type CommunicationConversation,
  type CommunicationMessage,
} from "@/repositories/communication-repository";
import {
  listEngagementDocumentsForPrincipal,
  type EngagementDocumentRecord,
} from "@/repositories/engagement-workspace-repository";
import {
  approveFiscalInvoice,
  ensureFiscalInvoiceForEmbeddedInvoice,
  getFiscalInvoiceIdByEmbeddedInvoiceId,
} from "@/repositories/fiscal-invoice-repository";
import {
  getWorkflowForPrincipal,
  type WorkflowInstanceRecord,
} from "@/repositories/workflow-repository";
import {
  canArchiveEngagementWorkflow,
  getEngagementArchiveReason,
  type EngagementArchiveLinkedState,
} from "@/repositories/engagement-archive-utils";

export type EngagementPaymentRecord = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  transactionReference: string;
  receiptNumber: string | null;
  status: "pending" | "verified" | "rejected";
  submittedAt: string;
  verifiedAt: string | null;
  reviewNote: string;
};

export type CompletionRequirement = {
  key: string;
  label: string;
  complete: boolean;
  detail: string;
  actionLabel: string;
  actionTab: "overview" | "tasks" | "documents" | "deliverables" | "finance" | "completion";
  actionHash?: string;
  actionTargets?: Array<{ label: string; hash: string }>;
};

export type EngagementHealthStatus =
  | "on_track"
  | "waiting_for_client"
  | "waiting_for_review"
  | "waiting_for_payment"
  | "overdue";

export type EngagementHealth = {
  status: EngagementHealthStatus;
  label: string;
  description: string;
  tone: "green" | "gold" | "teal" | "red";
};

export type EngagementExecutionData = {
  workflow: WorkflowInstanceRecord;
  documents: EngagementDocumentRecord[];
  conversation: CommunicationConversation | null;
  messages: CommunicationMessage[];
  payments: EngagementPaymentRecord[];
  completionRequirements: CompletionRequirement[];
  daysRemaining: number | null;
  health: EngagementHealth;
};

export type EngagementDashboardEnhancements = {
  deliverablesAwaitingApproval: number;
  deliverablesReleasedToday: number;
};

type RawPayment = {
  _id: Types.ObjectId;
  amount: number;
  currency: string;
  method: string;
  transactionReference: string;
  receiptNumber?: string | null;
  status: EngagementPaymentRecord["status"];
  submittedAt: Date;
  verifiedAt?: Date | null;
  reviewNote?: string;
};

type ArchiveSourceDocument = {
  _id: Types.ObjectId;
  name: string;
  storageKey: string;
  contentType: string;
  size: number;
  version?: number;
  documentKind?: string;
  uploadedAt: Date;
};

function archiveJson(value: unknown) {
  return Buffer.from(JSON.stringify(value, null, 2), "utf8");
}

function archiveFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
}

async function createEngagementArchivePackage(input: {
  archiveReference: string;
  workflow: WorkflowInstanceRecord;
  data: EngagementExecutionData;
  auditRecords: unknown[];
}) {
  const configuration = getR2Configuration();
  const client = getR2Client();
  const storedDocuments = await ClientDocumentModel.find({ workflowId: input.workflow.id, status: { $ne: "archived" } })
    .select("name storageKey contentType size version documentKind uploadedAt")
    .sort({ uploadedAt: 1 })
    .lean()
    .exec() as unknown as ArchiveSourceDocument[];
  const entries: ZipEntry[] = [
    { name: "engagement/engagement.json", data: archiveJson(input.workflow) },
    { name: "engagement/tasks.json", data: archiveJson(input.workflow.tasks) },
    { name: "engagement/messages.json", data: archiveJson(input.data.messages) },
    { name: "engagement/finance.json", data: archiveJson({ invoices: input.workflow.financial.invoices, payments: input.data.payments }) },
    { name: "engagement/timeline.json", data: archiveJson(input.workflow.activity) },
    { name: "engagement/approvals.json", data: archiveJson(input.workflow.approvals) },
    { name: "engagement/completion.json", data: archiveJson(input.workflow.completion) },
    { name: "engagement/audit-log.json", data: archiveJson(input.auditRecords) },
  ];
  const documentManifest: Array<Record<string, unknown>> = [];

  for (const [index, document] of storedDocuments.entries()) {
    const archivedName = `documents/${String(index + 1).padStart(3, "0")}-${archiveFileName(document.name)}`;
    try {
      const object = await client.send(new GetObjectCommand({ Bucket: configuration.bucketName, Key: document.storageKey }));
      if (!object.Body) throw new Error("Stored document has no body");
      entries.push({ name: archivedName, data: Buffer.from(await object.Body.transformToByteArray()), modifiedAt: document.uploadedAt });
      documentManifest.push({ id: document._id.toString(), name: document.name, archivedName, contentType: document.contentType, size: document.size, version: document.version ?? 1, documentKind: document.documentKind ?? "general", included: true });
    } catch {
      documentManifest.push({ id: document._id.toString(), name: document.name, storageKey: document.storageKey, contentType: document.contentType, size: document.size, version: document.version ?? 1, documentKind: document.documentKind ?? "general", included: false, note: "The stored file could not be retrieved while the archive package was created." });
    }
  }

  entries.push({
    name: "documents/manifest.json",
    data: archiveJson({ generatedAt: new Date().toISOString(), engagementReference: input.workflow.reference, documents: documentManifest }),
  });
  const zip = createZipBuffer(entries);
  const fileName = `${archiveFileName(input.workflow.reference)}-archive.zip`;
  const storageKey = `engagement-archives/${input.workflow.id}/${input.archiveReference}.zip`;
  await client.send(new PutObjectCommand({
    Bucket: configuration.bucketName,
    Key: storageKey,
    Body: zip,
    ContentType: "application/zip",
    ContentDisposition: `attachment; filename="${fileName}"`,
  }));
  return { storageKey, fileName, size: zip.length, createdAt: new Date(), documentCount: storedDocuments.length };
}

function isAdministrator(principal: Principal) {
  return principal.roleKeys.some((role) => role === "admin" || role === "super_admin");
}

async function activeAdministratorIds(excludeUserId?: string) {
  const administrators = await UserModel.find({
    status: "active",
    archivedAt: null,
    roleKeys: { $in: ["admin", "super_admin"] },
  }).select("_id").lean().exec();
  return administrators
    .map((administrator) => administrator._id.toString())
    .filter((userId) => userId !== excludeUserId);
}

function teamMember(workflow: WorkflowInstanceRecord, principal: Principal, role: string) {
  return workflow.team.some((member) => member.userId === principal.id && member.role === role);
}

function assignedEngagementManager(workflow: WorkflowInstanceRecord, principal: Principal) {
  return principal.roleKeys.includes("engagement_manager") && (
    workflow.responsibleUserId === principal.id
    || workflow.team.some((member) => member.userId === principal.id)
    || workflow.tasks.some((task) => task.assignedUserId === principal.id)
  );
}

function isConsultant(workflow: WorkflowInstanceRecord, principal: Principal) {
  return isAdministrator(principal)
    || assignedEngagementManager(workflow, principal)
    || teamMember(workflow, principal, "consultant");
}

function isReviewer(workflow: WorkflowInstanceRecord, principal: Principal) {
  return isAdministrator(principal) || teamMember(workflow, principal, "reviewer");
}


export function getEngagementHealth(workflow: WorkflowInstanceRecord): EngagementHealth {
  const now = Date.now();
  const hasOverdueTask = workflow.tasks.some((task) =>
    !["completed", "cancelled"].includes(task.status)
    && ((task.dueDate && new Date(task.dueDate).getTime() < now) || task.status === "overdue"),
  );
  const engagementOverdue = Boolean(workflow.dueDate && new Date(workflow.dueDate).getTime() < now);
  if (workflow.status === "active" && (hasOverdueTask || engagementOverdue)) {
    return { status: "overdue", label: "Overdue", description: "A due date has passed and needs attention.", tone: "red" };
  }
  if (workflow.status === "active" && workflow.clientActions.some((action) =>
    !["approved", "completed"].includes(action.status),
  )) {
    return { status: "waiting_for_client", label: "Waiting for client", description: "Client information, approval, or a response is outstanding.", tone: "gold" };
  }
  if (workflow.status === "active" && (
    workflow.tasks.some((task) => task.status === "waiting_for_approval")
    || workflow.documents.some((document) => document.status === "pending_review")
  )) {
    return { status: "waiting_for_review", label: "Waiting for review", description: "Submitted work is waiting for an internal review decision.", tone: "gold" };
  }
  if (workflow.status === "active" && workflow.financial.invoices.some((invoice) =>
    ["pending_etims_submission", "etims_rejected"].includes(invoice.status),
  )) {
    return { status: "waiting_for_review", label: "Waiting for review", description: "An approved invoice is awaiting KRA eTIMS acceptance.", tone: "gold" };
  }
  if (workflow.status === "active" && workflow.financial.balanceDue > 0 && workflow.financial.invoices.some((invoice) =>
    ["issued", "partially_paid", "overdue", "etims_accepted"].includes(invoice.status),
  )) {
    return { status: "waiting_for_payment", label: "Waiting for payment", description: "An issued invoice still has an outstanding balance.", tone: "teal" };
  }
  return { status: "on_track", label: "On track", description: "Work is progressing without an outstanding blocker.", tone: "green" };
}

export async function getEngagementDashboardEnhancements(principal: Principal): Promise<EngagementDashboardEnhancements> {
  if (!isAdministrator(principal)) return { deliverablesAwaitingApproval: 0, deliverablesReleasedToday: 0 };
  await connectToDatabase();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const activeWorkflowIds = await WorkflowInstanceModel.distinct("_id", { status: "active", archivedAt: null }).exec() as Types.ObjectId[];
  const [deliverablesAwaitingApproval, deliverablesReleasedToday] = await Promise.all([
    ClientDocumentModel.countDocuments({ workflowId: { $in: activeWorkflowIds }, documentKind: "final_deliverable", deliverableStatus: "pending_review" }).exec(),
    ClientDocumentModel.countDocuments({ documentKind: "final_deliverable", deliverableStatus: "released", releasedAt: { $gte: startOfToday } }).exec(),
  ]);
  return { deliverablesAwaitingApproval, deliverablesReleasedToday };
}

async function notifyUsers(input: {
  recipientIds: Array<string | null | undefined>;
  actor: Principal;
  type: "task_assigned" | "action_required" | "engagement_update" | "invoice_generated";
  title: string;
  description: string;
  workflowId: string;
  tab: string;
  archiveId?: string;
}) {
  const ids = [...new Set(input.recipientIds.filter((id): id is string => Boolean(id) && id !== input.actor.id))];
  const recipients = ids.length > 0
    ? await UserModel.find({ _id: { $in: ids } }).select("roleKeys").lean().exec()
    : [];
  const rolesById = new Map(recipients.map((recipient) => [recipient._id.toString(), recipient.roleKeys]));
  await Promise.allSettled(ids.map((recipientUserId) => {
    const roles = rolesById.get(recipientUserId) ?? [];
    const actionUrl = input.archiveId
      ? roles.some((role) => role === "client" || role === "client_representative")
        ? "/client/archive"
        : roles.some((role) => role === "admin" || role === "super_admin")
          ? `/admin/archive/${input.archiveId}`
          : "/staff/archive"
      : roles.some((role) => role === "client" || role === "client_representative")
        ? `/client/engagements/${input.workflowId}?tab=${input.tab}`
        : roles.some((role) => role === "admin" || role === "super_admin")
          ? `/admin/active-engagements/${input.workflowId}?tab=${input.tab}`
          : `/staff/engagements/${input.workflowId}?tab=${input.tab}`;
    return createCommunicationNotification({
    recipientUserId,
    type: input.type,
    title: input.title,
    description: input.description,
    relatedModule: "engagements",
    relatedRecordId: input.workflowId,
    actionUrl,
    createdByUserId: input.actor.id,
  });
  }));
}

export function getCompletionRequirements(
  workflow: WorkflowInstanceRecord,
  documents: EngagementDocumentRecord[],
  payments: EngagementPaymentRecord[],
  completionNotes = workflow.completion.notes,
): CompletionRequirement[] {
  const mandatoryTasks = workflow.tasks.filter((task) => task.status !== "cancelled");
  const tasksComplete = mandatoryTasks.every((task) => task.status === "completed");
  const reviewTasks = mandatoryTasks.filter((task) => task.approvalRequired);
  const missingReviews = reviewTasks.filter((task) =>
    !task.reviewHistory.some((review) => review.decision === "approved"),
  );
  const reviewsApproved = missingReviews.length === 0;
  const releasedFinalDeliverables = documents.filter((document) =>
    document.documentKind === "final_deliverable"
    && (document.deliverableStatus === "released" || (!document.deliverableStatus && document.status === "final")),
  );
  const finalDeliverablesPendingRelease = documents.filter((document) =>
    document.documentKind === "final_deliverable"
    && document.deliverableStatus !== "draft"
    && !["released"].includes(document.deliverableStatus),
  );
  const outstandingClientActions = workflow.clientActions.filter((action) =>
    !["approved", "completed"].includes(action.status),
  );
  const issuedInvoices = workflow.financial.invoices.filter((invoice) =>
    ["pending_etims_submission", "etims_accepted", "issued", "partially_paid", "paid"].includes(invoice.status),
  );
  const invoiceRequired = workflow.financial.balanceDue > 0 || workflow.financial.invoices.length > 0;
  const pendingPayments = payments.filter((payment) => payment.status === "pending");

  return [
    { key: "tasks", label: "All mandatory tasks completed", complete: tasksComplete, detail: tasksComplete ? `${mandatoryTasks.length} tasks complete` : `${mandatoryTasks.filter((task) => task.status !== "completed").length} tasks remain`, actionLabel: "Open tasks", actionTab: "tasks" },
    { key: "reviews", label: "All required reviews approved", complete: reviewsApproved, detail: reviewsApproved ? "Review gates are clear" : `Pending review for: ${missingReviews.map((task) => task.title).join(", ")}`, actionLabel: "Review tasks", actionTab: "tasks", actionHash: missingReviews.length === 1 ? `task-${missingReviews[0].key}` : undefined, actionTargets: missingReviews.map((task) => ({ label: task.title, hash: `task-${task.key}` })) },
    { key: "deliverables", label: releasedFinalDeliverables.length > 0 ? "Final deliverable released" : finalDeliverablesPendingRelease.length > 0 ? "Final deliverable ready for release" : "Final deliverable uploaded", complete: releasedFinalDeliverables.length > 0, detail: releasedFinalDeliverables.length > 0 ? `${releasedFinalDeliverables.length} final deliverable(s)` : finalDeliverablesPendingRelease.length > 0 ? "Release the approved final deliverable to the client" : "Upload at least one final deliverable", actionLabel: finalDeliverablesPendingRelease.length > 0 ? "Open deliverables" : "Upload deliverable", actionTab: finalDeliverablesPendingRelease.length > 0 ? "deliverables" : "documents", actionHash: finalDeliverablesPendingRelease.length > 0 ? undefined : "document-upload" },
    { key: "client_actions", label: "Client requests resolved", complete: outstandingClientActions.length === 0, detail: outstandingClientActions.length === 0 ? "No client response is outstanding" : `${outstandingClientActions.length} client action(s) remain`, actionLabel: "Open client actions", actionTab: "overview" },
    { key: "invoices", label: "Required invoices issued", complete: !invoiceRequired || issuedInvoices.length > 0, detail: !invoiceRequired ? "No invoice is required" : issuedInvoices.length > 0 ? `${issuedInvoices.length} invoice(s) issued` : "An invoice still needs to be issued", actionLabel: "Open finance", actionTab: "finance" },
    { key: "payments", label: "Submitted payments reviewed", complete: pendingPayments.length === 0, detail: pendingPayments.length === 0 ? "No payment is waiting for review" : `${pendingPayments.length} payment(s) await review`, actionLabel: "Review payments", actionTab: "finance" },
    { key: "notes", label: "Completion notes added", complete: completionNotes.trim().length >= 10, detail: completionNotes.trim().length >= 10 ? "Completion notes are ready" : "Add at least 10 characters of completion notes", actionLabel: "Add completion notes", actionTab: "completion", actionHash: "completion-notes" },
  ];
}

function executionDateString(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export async function getEngagementExecutionData(principal: Principal, workflowId: string) {
  const workflow = await getWorkflowForPrincipal(principal, workflowId, true);
  if (!workflow) return null;
  const fullWorkflow = principal.roleKeys.some((role) => role === "client" || role === "client_representative")
    ? await getWorkflowForPrincipal(principal, workflowId, true, false)
    : workflow;
  if (!fullWorkflow) return null;
  const [documentsResult, paymentsResult, conversationResult] = await Promise.allSettled([
    listEngagementDocumentsForPrincipal(principal, workflowId),
    ClientPaymentModel.find({ workflowId, archivedAt: null }).sort({ submittedAt: -1 }).lean().exec(),
    getOrCreateEngagementConversation(principal, workflow),
  ]);
  const documents = documentsResult.status === "fulfilled" ? documentsResult.value : [];
  const storedPayments = paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
  const conversation = conversationResult.status === "fulfilled" ? conversationResult.value : null;
  if (documentsResult.status === "rejected" || paymentsResult.status === "rejected") {
    console.error("Unable to fully load restored engagement records", {
      workflowId,
      documentsError: documentsResult.status === "rejected" ? documentsResult.reason : undefined,
      paymentsError: paymentsResult.status === "rejected" ? paymentsResult.reason : undefined,
    });
  }
  const payments = (storedPayments as unknown as RawPayment[]).map((payment): EngagementPaymentRecord => ({
    id: payment._id.toString(),
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    transactionReference: payment.transactionReference,
    receiptNumber: payment.receiptNumber ?? null,
    status: payment.status,
    submittedAt: executionDateString(payment.submittedAt),
    verifiedAt: executionDateString(payment.verifiedAt) || null,
    reviewNote: payment.reviewNote ?? "",
  }));
  let messages: CommunicationMessage[] = [];
  if (conversation) {
    try {
      messages = await listMessagesForConversation(principal, conversation.id, 100, workflow.status === "archived");
    } catch (error) {
      console.error("Unable to load engagement messages:", error);
      messages = [];
    }
  }
  const due = workflow.dueDate ? new Date(workflow.dueDate).getTime() : null;
  const daysRemaining = due === null ? null : Math.ceil((due - Date.now()) / 86_400_000);
  return {
    workflow,
    documents,
    conversation,
    messages,
    payments,
    completionRequirements: getCompletionRequirements(fullWorkflow, documents, payments),
    daysRemaining,
    health: getEngagementHealth(fullWorkflow),
  } satisfies EngagementExecutionData;
}

export async function createEngagementTask(input: {
  principal: Principal;
  workflowId: string;
  title: string;
  description: string;
  assignedUserId: string;
  priority: WorkflowPriority;
  dueDate: Date;
}) {
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  if (!workflow || workflow.status !== "active" || !isAdministrator(input.principal)) return false;
  const assignee = workflow.team.find((member) => member.userId === input.assignedUserId);
  if (!assignee || !Types.ObjectId.isValid(input.principal.id)) return false;
  const key = `task-${randomUUID()}`;
  const now = new Date();
  await WorkflowInstanceModel.updateOne(
    { _id: workflow.id, status: "active", archivedAt: null },
    {
      $push: {
        tasks: {
          key,
          stageKey: workflow.currentStageKey,
          title: input.title,
          description: input.description,
          assignedUserId: assignee.userId,
          assignedUserName: assignee.name,
          assignedRole: assignee.role,
          priority: input.priority,
          status: "ready",
          dueDate: input.dueDate,
          dependencies: [],
          checklist: [],
          requiredDocuments: [],
          clientVisible: false,
          approvalRequired: assignee.role === "consultant",
          createdByUserId: new Types.ObjectId(input.principal.id),
        },
        activity: {
          type: "task_created",
          title: "Task Created",
          actorName: input.principal.displayName || input.principal.email,
          actorUserId: new Types.ObjectId(input.principal.id),
          description: input.title,
          relatedResource: key,
          clientVisible: false,
          createdAt: now,
        },
      },
      $set: { currentStageName: "Work in Progress", lastActivityAt: now, nextAction: input.title },
    },
  ).exec();
  await notifyUsers({ recipientIds: [assignee.userId], actor: input.principal, type: "task_assigned", title: "Engagement task assigned", description: `${input.title} in ${workflow.reference}`, workflowId: workflow.id, tab: "tasks" });
  return true;
}

export async function reviewEngagementTask(input: {
  principal: Principal;
  workflowId: string;
  taskKey: string;
  decision: "approved" | "changes_requested";
  comments: string;
}) {
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  const task = workflow?.tasks.find((item) => item.key === input.taskKey);
  if (!workflow || !task || workflow.status !== "active" || task.status !== "waiting_for_approval" || !isReviewer(workflow, input.principal) || !Types.ObjectId.isValid(input.principal.id)) return false;
  const now = new Date();
  const approved = input.decision === "approved";
  await WorkflowInstanceModel.updateOne(
    { _id: workflow.id, "tasks.key": task.key, status: "active", archivedAt: null },
    {
      $set: {
        "tasks.$.status": approved ? "completed" : "in_progress",
        "tasks.$.completionNotes": input.comments,
        "tasks.$.completedAt": approved ? now : null,
        "tasks.$.completedByUserId": approved ? new Types.ObjectId(input.principal.id) : null,
        lastActivityAt: now,
        currentStageName: approved ? "Work in Progress" : "Internal Review",
        nextAction: approved ? "Continue with the next engagement task" : `Update ${task.title}`,
      },
      $push: {
        "tasks.$.reviewHistory": {
          decision: input.decision,
          comments: input.comments,
          reviewerUserId: new Types.ObjectId(input.principal.id),
          reviewerName: input.principal.displayName || input.principal.email,
          reviewedAt: now,
        },
        activity: {
          type: approved ? "review_approved" : "changes_requested",
          title: approved ? "Review Approved" : "Changes Requested",
          actorName: input.principal.displayName || input.principal.email,
          actorUserId: new Types.ObjectId(input.principal.id),
          description: `${task.title}: ${input.comments}`,
          relatedResource: task.key,
          clientVisible: false,
          createdAt: now,
        },
      },
    },
  ).exec();
  await notifyUsers({ recipientIds: [task.assignedUserId], actor: input.principal, type: "action_required", title: approved ? "Task review approved" : "Task changes requested", description: `${task.title}: ${input.comments}`, workflowId: workflow.id, tab: "tasks" });
  return true;
}

export async function createClientCollaborationRequest(input: {
  principal: Principal;
  workflowId: string;
  title: string;
  instructions: string;
  dueDate: Date;
}) {
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  if (!workflow?.clientUserId || workflow.status !== "active" || !isConsultant(workflow, input.principal) || !Types.ObjectId.isValid(input.principal.id)) return false;
  const now = new Date();
  const key = `client-action-${randomUUID()}`;
  await WorkflowInstanceModel.updateOne(
    { _id: workflow.id, status: "active", archivedAt: null },
    {
      $push: {
        clientActions: { key, title: input.title, instructions: input.instructions, dueDate: input.dueDate, priority: "medium", assignedClientUserId: workflow.clientUserId, status: "pending" },
        activity: { type: "client_action_requested", title: "Client Action Requested", actorName: input.principal.displayName || input.principal.email, actorUserId: new Types.ObjectId(input.principal.id), description: input.title, relatedResource: key, clientVisible: true, createdAt: now },
      },
      $set: { currentStageName: "Client Collaboration", lastActivityAt: now, nextAction: `Waiting for client: ${input.title}` },
    },
  ).exec();
  await notifyUsers({ recipientIds: [workflow.clientUserId], actor: input.principal, type: "action_required", title: input.title, description: input.instructions, workflowId: workflow.id, tab: "overview" });
  return true;
}

export async function respondToClientCollaborationRequest(input: {
  principal: Principal;
  workflowId: string;
  actionKey: string;
  response: string;
}) {
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  const isClient = workflow?.clientUserId === input.principal.id;
  if (!workflow || !isClient || workflow.status !== "active" || !Types.ObjectId.isValid(input.principal.id)) return false;
  const action = workflow.clientActions.find((item) => item.key === input.actionKey && !["completed", "approved"].includes(item.status));
  if (!action) return false;
  const now = new Date();
  await WorkflowInstanceModel.updateOne(
    { _id: workflow.id, "clientActions.key": action.key, status: "active", archivedAt: null },
    {
      $set: { "clientActions.$.status": "completed", "clientActions.$.response": input.response, "clientActions.$.respondedAt": now, currentStageName: "Work in Progress", lastActivityAt: now, nextAction: `Review client response: ${action.title}` },
      $push: { activity: { type: "client_response_received", title: "Client Response Received", actorName: input.principal.displayName || input.principal.email, actorUserId: new Types.ObjectId(input.principal.id), description: input.response, relatedResource: action.key, clientVisible: true, createdAt: now } },
    },
  ).exec();
  await notifyUsers({ recipientIds: workflow.team.map((member) => member.userId), actor: input.principal, type: "engagement_update", title: "Client response received", description: action.title, workflowId: workflow.id, tab: "overview" });
  return true;
}

export async function createEngagementInvoice(input: {
  principal: Principal;
  workflowId: string;
  amount: number;
  dueDate: Date;
  notes: string;
}) {
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  const assignedFinanceOfficer = workflow
    && input.principal.roleKeys.includes("finance_officer")
    && teamMember(workflow, input.principal, "finance_officer");
  if (!workflow || !workflow.clientUserId || workflow.status !== "active" || !assignedFinanceOfficer || !hasPermission(input.principal, "invoices.create")) return null;
  const now = new Date();
  const invoiceId = randomUUID();
  const invoiceNumber = `INV-${now.getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const financeTask = workflow.tasks.find((task) => task.key === "approve_invoice" || (task.stageKey === "finance" && task.assignedRole === "finance_officer"));
  const setValues: Record<string, unknown> = {
    "financial.invoiceStatus": "pending_approval",
    "financial.balanceDue": workflow.financial.balanceDue > 0 ? workflow.financial.balanceDue : input.amount,
    currentStageName: "Finance approval",
    nextAction: `Administrator approval required for ${invoiceNumber}`,
    lastActivityAt: now,
  };
  if (financeTask) {
    setValues["tasks.$[financeTask].status"] = "waiting_for_approval";
    setValues["tasks.$[financeTask].completionNotes"] = `${invoiceNumber} submitted for administrator approval.`;
  }
  const workflowUpdate = await WorkflowInstanceModel.updateOne(
    { _id: workflow.id, status: "active", archivedAt: null },
    {
      $push: {
        "financial.invoices": {
          invoiceId,
          invoiceNumber,
          issueDate: now,
          dueDate: input.dueDate,
          amount: input.amount,
          currency: workflow.financial.currency,
          status: "pending_approval",
          notes: input.notes,
          createdByUserId: input.principal.id,
          createdByName: input.principal.displayName || input.principal.email,
          emailDeliveryStatus: "pending",
        },
        activity: {
          type: "approval_submitted",
          title: "Invoice submitted for approval",
          actorName: input.principal.displayName || input.principal.email,
          actorUserId: input.principal.id,
          description: `${invoiceNumber} - ${workflow.financial.currency} ${input.amount.toLocaleString("en-KE")}`,
          relatedResource: invoiceId,
          clientVisible: false,
          createdAt: now,
        },
      },
      $set: setValues,
    },
    financeTask ? { arrayFilters: [{ "financeTask.key": financeTask.key }] } : undefined,
  ).exec();
  if (workflowUpdate.modifiedCount === 0) return null;
  let fiscalInvoiceId: string | null = null;
  try {
    fiscalInvoiceId = await ensureFiscalInvoiceForEmbeddedInvoice({
      principal: input.principal,
      workflowId: workflow.id,
      engagementReference: workflow.reference,
      clientUserId: workflow.clientUserId,
      clientName: workflow.clientName,
      serviceName: workflow.serviceName,
      invoiceId,
      invoiceNumber,
      issueDate: now,
      dueDate: input.dueDate,
      amount: input.amount,
      currency: workflow.financial.currency,
      notes: input.notes,
    });
  } catch (error) {
    console.error("Unable to create the dedicated fiscal invoice record.", error);
  }
  if (!fiscalInvoiceId) {
    await WorkflowInstanceModel.updateOne(
      { _id: workflow.id },
      {
        $pull: { "financial.invoices": { invoiceId } },
        $set: {
          "financial.invoiceStatus": "draft",
          nextAction: "Finance must prepare the invoice again",
          lastActivityAt: new Date(),
        },
      },
    ).exec();
    return null;
  }
  const administrators = await activeAdministratorIds(input.principal.id);
  await notifyUsers({
    recipientIds: administrators,
    actor: input.principal,
    type: "action_required",
    title: "Invoice needs approval",
    description: `${invoiceNumber} for ${workflow.clientName} is ready for approval and digital stamping.`,
    workflowId: workflow.id,
    tab: "finance",
  });
  await writeAuditLog({
    actor: input.principal,
    action: "invoice.submitted_for_approval",
    resourceType: "WorkflowInstance",
    resourceId: workflow.id,
    newValues: { invoiceId, invoiceNumber, amount: input.amount, currency: workflow.financial.currency },
  });
  return invoiceId;
}

export type EngagementInvoiceSendFailure =
  | "access"
  | "not_found"
  | "not_pending"
  | "engagement_inactive"
  | "administrator_required"
  | "permission"
  | "maker_checker"
  | "validation"
  | "conflict";

export async function sendEngagementInvoice(input: { principal: Principal; workflowId: string; invoiceId: string }) {
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  if (!workflow) return { ok: false as const, emailDelivered: false, reason: "access" as const, errors: [] as string[] };
  const invoice = workflow.financial.invoices.find((item) => item.invoiceId === input.invoiceId);
  if (!invoice) return { ok: false as const, emailDelivered: false, reason: "not_found" as const, errors: [] as string[] };
  if (workflow.status !== "active") {
    return { ok: false as const, emailDelivered: false, reason: "engagement_inactive" as const, errors: [] as string[] };
  }
  if (!isAdministrator(input.principal)) {
    return { ok: false as const, emailDelivered: false, reason: "administrator_required" as const, errors: [] as string[] };
  }
  if (!hasPermission(input.principal, "invoice.approve")) {
    return { ok: false as const, emailDelivered: false, reason: "permission" as const, errors: [] as string[] };
  }
  if (!["draft", "pending_approval"].includes(invoice.status)) {
    return { ok: false as const, emailDelivered: false, reason: "not_pending" as const, errors: [] as string[] };
  }

  let fiscalInvoiceId = await getFiscalInvoiceIdByEmbeddedInvoiceId(invoice.invoiceId);
  if (!fiscalInvoiceId && workflow.clientUserId) {
    fiscalInvoiceId = await ensureFiscalInvoiceForEmbeddedInvoice({
      principal: input.principal,
      workflowId: workflow.id,
      engagementReference: workflow.reference,
      clientUserId: workflow.clientUserId,
      clientName: workflow.clientName,
      serviceName: workflow.serviceName,
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: new Date(invoice.issueDate ?? Date.now()),
      dueDate: new Date(invoice.dueDate ?? Date.now()),
      amount: invoice.amount,
      currency: invoice.currency,
      notes: invoice.notes,
    });
  }
  if (!fiscalInvoiceId) {
    return { ok: false as const, emailDelivered: false, reason: "not_found" as const, errors: ["The fiscal invoice record could not be prepared."] };
  }

  const approval = await approveFiscalInvoice(input.principal, fiscalInvoiceId);
  if (!approval.ok) {
    const reason: EngagementInvoiceSendFailure = approval.reason === "maker_checker"
      ? "maker_checker"
      : approval.reason === "validation"
        ? "validation"
        : approval.reason === "not_pending"
          ? "not_pending"
          : approval.reason === "not_found"
            ? "not_found"
            : "conflict";
    return { ok: false as const, emailDelivered: false, reason, errors: approval.errors };
  }
  return {
    ok: true as const,
    emailDelivered: false,
    queued: true as const,
    fiscalInvoiceId: approval.invoiceId,
  };
}
export async function reviewEngagementPayment(input: {
  principal: Principal;
  workflowId: string;
  paymentId: string;
  decision: "verified" | "rejected";
  reviewNote: string;
}) {
  if (!isAdministrator(input.principal) || !hasPermission(input.principal, "payments.reconcile") || !Types.ObjectId.isValid(input.paymentId)) return false;
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  if (!workflow || workflow.status !== "active") return false;
  const payment = await ClientPaymentModel.findOne({ _id: input.paymentId, workflowId: workflow.id, status: "pending", archivedAt: null }).exec();
  if (!payment) return false;

  const now = new Date();
  payment.status = input.decision;
  payment.reviewNote = input.reviewNote || (input.decision === "verified" ? "Payment approved by the administrator." : "Payment details were rejected by the administrator.");
  payment.verifiedAt = input.decision === "verified" ? now : null;
  if (input.decision === "verified") {
    payment.receiptNumber = payment.receiptNumber ?? `RCP-${now.getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  }
  await payment.save();

  if (input.decision === "verified") {
    const balanceDue = Math.max(0, workflow.financial.balanceDue - payment.amount);
    const invoiceStatus = balanceDue === 0 ? "paid" : "partially_paid";
    await WorkflowInstanceModel.updateOne(
      { _id: workflow.id, status: "active", archivedAt: null },
      {
        $set: {
          "financial.balanceDue": balanceDue,
          "financial.invoiceStatus": invoiceStatus,
          "financial.paymentStatus": balanceDue === 0 ? "reconciled" : "partially_allocated",
          "financial.invoices.$[invoice].status": invoiceStatus,
          lastActivityAt: now,
        },
        $push: {
          activity: {
            type: "payment_recorded",
            title: "Payment approved",
            actorName: input.principal.displayName || input.principal.email,
            actorUserId: input.principal.id,
            description: `${payment.currency} ${payment.amount.toLocaleString("en-KE")} approved by the administrator.`,
            relatedResource: payment.transactionReference,
            clientVisible: true,
            createdAt: now,
          },
        },
      },
      { arrayFilters: [{ "invoice.status": { $in: ["issued", "etims_accepted", "partially_paid", "overdue"] } }] },
    ).exec();
    await FiscalInvoiceModel.findOneAndUpdate(
      { workflowId: workflow.id, archivedAt: null, "etims.status": "ACCEPTED" },
      { $set: { balanceDue } },
      { sort: { issueDate: -1 } },
    ).exec();  } else {
    await WorkflowInstanceModel.updateOne(
      { _id: workflow.id, status: "active", archivedAt: null },
      {
        $set: { "financial.paymentStatus": "failed", lastActivityAt: now },
        $push: {
          activity: {
            type: "payment_recorded",
            title: "Payment needs attention",
            actorName: input.principal.displayName || input.principal.email,
            actorUserId: input.principal.id,
            description: payment.reviewNote,
            relatedResource: payment.transactionReference,
            clientVisible: true,
            createdAt: now,
          },
        },
      },
    ).exec();
  }

  await notifyUsers({
    recipientIds: [workflow.clientUserId],
    actor: input.principal,
    type: "engagement_update",
    title: input.decision === "verified" ? "Payment approved" : "Payment details need attention",
    description: input.decision === "verified"
      ? `Your payment of ${payment.currency} ${payment.amount.toLocaleString("en-KE")} has been approved.`
      : payment.reviewNote,
    workflowId: workflow.id,
    tab: "finance",
  });
  if (workflow.clientUserId) {
    await sendClientJourneyEmailToUser({
      clientUserId: workflow.clientUserId,
      fallbackName: workflow.clientName,
      title: input.decision === "verified" ? "Your payment was approved" : "Your payment needs attention",
      summary: input.decision === "verified"
        ? `Your payment of ${payment.currency} ${payment.amount.toLocaleString("en-KE")} has been approved by IFTA Consulting.`
        : payment.reviewNote,
      actionLabel: "Open payment record",
      actionPath: `/client/engagements/${workflow.id}?tab=finance`,
    });
  }
  await writeAuditLog({
    actor: input.principal,
    action: `payment.${input.decision}`,
    resourceType: "ClientPayment",
    resourceId: payment._id.toString(),
    newValues: { decision: input.decision, reviewNote: payment.reviewNote, receiptNumber: payment.receiptNumber },
  });
  return true;
}
export async function completeEngagement(input: { principal: Principal; workflowId: string; notes: string }) {
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  if (!workflow || workflow.status !== "active" || !isAdministrator(input.principal) || !hasPermission(input.principal, "engagements.complete")) return { ok: false as const, missing: ["Engagement is not available for completion."] };
  const data = await getEngagementExecutionData(input.principal, input.workflowId);
  if (!data) return { ok: false as const, missing: ["Engagement data could not be loaded."] };
  const requirements = getCompletionRequirements(workflow, data.documents, data.payments, input.notes);
  const missing = requirements.filter((item) => !item.complete).map((item) => item.label);
  if (missing.length > 0) return { ok: false as const, missing };
  const now = new Date();
  const completedTasks = workflow.tasks.filter((task) => task.status === "completed").length;
  const releasedDeliverables = data.documents.filter((document) =>
    document.documentKind === "final_deliverable" && document.deliverableStatus === "released",
  ).length;
  const internalReviews = workflow.tasks.reduce(
    (total, task) => total + task.reviewHistory.filter((review) => review.decision === "approved").length,
    0,
  ) + data.documents.filter((document) => Boolean(document.reviewedAt)).length;
  const totalInvoiced = workflow.financial.invoices
    .filter((invoice) => invoice.status !== "void")
    .reduce((total, invoice) => total + invoice.amount, 0);
  const totalPaid = data.payments
    .filter((payment) => payment.status === "verified")
    .reduce((total, payment) => total + payment.amount, 0);
  const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);
  const completedByName = input.principal.displayName || input.principal.email;
  const closureSummary = {
    generatedAt: now,
    generatedByName: completedByName,
    totalTasksCompleted: completedTasks,
    totalDocumentsUploaded: data.documents.length,
    totalDeliverablesReleased: releasedDeliverables,
    totalInternalReviews: internalReviews,
    totalMessages: data.messages.length,
    totalInvoiced,
    totalPaid,
    outstandingBalance,
  };
  const summary = `${workflow.reference} for ${workflow.clientName} completed with ${completedTasks} completed tasks, ${releasedDeliverables} released deliverables, and ${data.messages.length} messages.`;
  await WorkflowInstanceModel.updateOne(
    { _id: workflow.id, status: "active", archivedAt: null },
    {
      $set: {
        status: "completed",
        currentStageName: "Completed",
        nextAction: "Archive the completed engagement",
        lastActivityAt: now,
        completionChecklist: requirements.map((item) => ({ label: item.label, completed: item.complete })),
        completion: {
          notes: input.notes,
          summary,
          completedAt: now,
          completedByUserId: input.principal.id,
          completedByName,
          closureSummary,
        },
      },
      $push: { activity: { $each: [
        { type: "engagement_completed", title: "Engagement Completed", actorName: completedByName, actorUserId: input.principal.id, description: input.notes, relatedResource: workflow.reference, clientVisible: true, createdAt: now },
        { type: "engagement_completed", title: "Closure Summary Generated", actorName: "IFTA System", actorUserId: input.principal.id, description: "A permanent completion and financial summary was generated.", relatedResource: workflow.reference, clientVisible: true, createdAt: now },
      ] } },
    },
  ).exec();
  const recipients = [workflow.clientUserId, ...workflow.team.map((member) => member.userId)];
  await Promise.all([
    notifyUsers({ recipientIds: recipients, actor: input.principal, type: "engagement_update", title: "Engagement completed", description: `${workflow.reference} has been completed.`, workflowId: workflow.id, tab: "completion" }),
    notifyUsers({ recipientIds: recipients, actor: input.principal, type: "engagement_update", title: "Closure summary generated", description: `The closure summary for ${workflow.reference} is ready.`, workflowId: workflow.id, tab: "completion" }),
  ]);
  if (workflow.clientUserId) {
    await sendClientJourneyEmailToUser({ clientUserId: workflow.clientUserId, fallbackName: workflow.clientName, title: "Your IFTA engagement is complete", summary, actionLabel: "View final deliverables", actionPath: `/client/engagements/${workflow.id}?tab=deliverables` }).catch(() => undefined);
  }
  await writeAuditLog({ actor: input.principal, action: "engagement.completed", resourceType: "WorkflowInstance", resourceId: workflow.id, newValues: { completedAt: now, summary, closureSummary } });
  return { ok: true as const, missing: [] };
}

export async function createFollowUpEngagement(input: {
  principal: Principal;
  previousWorkflowId: string;
  serviceName: string;
}) {
  if (!isAdministrator(input.principal) || !hasPermission(input.principal, "engagements.assign")) return null;
  const previous = await getWorkflowForPrincipal(input.principal, input.previousWorkflowId, true);
  if (!previous || !["completed", "archived"].includes(previous.status)) return null;
  await connectToDatabase();
  const source = await WorkflowInstanceModel.findById(input.previousWorkflowId)
    .select("clientName clientUserId organizationName organizationId templateId reference")
    .lean()
    .exec();
  if (!source?.templateId) return null;
  const template = await WorkflowTemplateModel.findById(source.templateId).lean().exec();
  if (!template || template.stages.length === 0) return null;

  const now = new Date();
  const activeStageIndex = template.stages.findIndex((stage) => stage.key === "active_work");
  const deliveryStages = template.stages
    .slice(activeStageIndex >= 0 ? activeStageIndex : 0)
    .filter((stage) => stage.key !== "team_assignment");
  if (deliveryStages.length === 0) return null;
  const durationDays = Math.max(1, deliveryStages.reduce((total, stage) => total + stage.expectedDurationDays, 1));
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + durationDays);
  const actorUserId = Types.ObjectId.isValid(input.principal.id) ? new Types.ObjectId(input.principal.id) : null;
  const workflow = await WorkflowInstanceModel.create({
    reference: `ENG-${now.getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`,
    clientName: source.clientName,
    clientUserId: source.clientUserId,
    organizationName: source.organizationName,
    organizationId: source.organizationId,
    sourceRequestId: null,
    engagementLetterId: null,
    previousEngagementId: source._id,
    previousEngagementReference: source.reference,
    serviceName: input.serviceName,
    templateId: template._id,
    templateName: template.name,
    templateVersion: template.version,
    templateSnapshot: template,
    status: "active",
    currentStageKey: "team_assignment",
    riskLevel: "low",
    riskReason: "",
    nextAction: "Assign the consultant, reviewer, and finance officer",
    responsibleUserId: null,
    responsibleUserName: "",
    startDate: now,
    activatedAt: now,
    signedAt: null,
    signedByUserId: null,
    signedByName: "",
    teamAssignedAt: null,
    dueDate,
    lastActivityAt: now,
    team: [],
    stages: [{
      key: "team_assignment",
      name: "Team Assignment",
      internalDescription: "Assign the delivery team before client work begins.",
      clientTitle: "Team Assignment",
      order: 1,
      expectedDurationDays: 1,
      responsibleRole: "admin",
      entryConditions: ["Follow-up engagement created"],
      completionConditions: ["Consultant assigned", "Reviewer assigned", "Finance officer assigned"],
      requiredDocuments: [],
      approvalRequired: false,
      clientVisible: true,
      status: "in_progress",
      enteredAt: now,
      completedAt: null,
      dueAt: new Date(now.getTime() + 86_400_000),
    }, ...deliveryStages.map((stage, index) => ({
      key: stage.key,
      name: stage.name,
      internalDescription: stage.internalDescription,
      clientTitle: stage.clientTitle,
      order: index + 2,
      expectedDurationDays: stage.expectedDurationDays,
      responsibleRole: stage.responsibleRole,
      entryConditions: stage.entryConditions,
      completionConditions: stage.completionConditions,
      requiredDocuments: stage.requiredDocuments,
      approvalRequired: stage.approvalRequired,
      clientVisible: stage.clientVisible,
      status: "not_started",
      enteredAt: null,
      completedAt: null,
      dueAt: null,
    }))],
    tasks: deliveryStages.flatMap((stage) => stage.tasks.map((task) => ({
      key: task.key,
      stageKey: stage.key,
      title: task.title,
      description: task.description,
      assignedUserId: null,
      assignedUserName: "",
      assignedRole: task.assignedRole,
      priority: task.priority,
      status: "not_started",
      startDate: null,
      completedAt: null,
      completedByUserId: null,
      dueDate: null,
      dependencies: task.dependencies,
      checklist: task.checklist.map((label) => ({ label, completed: false })),
      requiredDocuments: task.requiredDocuments,
      clientVisible: task.clientVisible,
      approvalRequired: task.approvalRequired,
      reviewHistory: [],
    }))),
    milestones: template.milestones.map((title, index) => ({
      key: `milestone-${index + 1}`,
      title,
      status: "pending",
      clientVisible: true,
    })),
    approvals: template.approvalPoints
      .filter((approval) => deliveryStages.some((stage) => stage.key === approval.stageKey))
      .map((approval) => ({
        key: approval.key,
        title: approval.title,
        stageKey: approval.stageKey,
        approverRole: approval.approverRole,
        status: "not_submitted",
      })),
    clientActions: [],
    documents: [],
    financial: { invoiceStatus: "draft", paymentStatus: "pending", balanceDue: 0, currency: previous.financial.currency, invoices: [] },
    completionChecklist: template.completionConditions.map((label) => ({ label, completed: false })),
    completion: {},
    archive: { status: "not_ready" },
    activity: [{
      type: "workflow_created",
      title: "Follow-up Engagement Created",
      actorName: input.principal.displayName || input.principal.email,
      actorUserId,
      description: `Created as a new engagement linked to ${source.reference}.`,
      relatedResource: source.reference,
      clientVisible: true,
      createdAt: now,
    }],
    internalNotes: [],
  });

  await notifyUsers({
    recipientIds: [source.clientUserId?.toString()],
    actor: input.principal,
    type: "engagement_update",
    title: "Follow-up engagement created",
    description: `${workflow.reference} was created for ${input.serviceName} and linked to ${source.reference}.`,
    workflowId: workflow._id.toString(),
    tab: "overview",
  });
  await writeAuditLog({
    actor: input.principal,
    action: "engagement.follow_up_created",
    resourceType: "WorkflowInstance",
    resourceId: workflow._id.toString(),
    newValues: { previousEngagementId: source._id.toString(), previousEngagementReference: source.reference },
  });
  return workflow._id.toString();
}

async function buildEngagementArchiveLinkedState(workflowId: string): Promise<EngagementArchiveLinkedState> {
  const requestIds = await EngagementRequestModel.find({ workflowId }).distinct("_id").exec();
  const requestIdStrings = requestIds.map((id) => id.toString());
  const [
    documents,
    conversations,
    payments,
    requests,
    quotations,
    staffNotes,
    notifications,
    engagementLetters,
    requestAssignments,
  ] = await Promise.all([
    ClientDocumentModel.find({ workflowId, status: { $ne: "archived" } })
      .select("_id status")
      .lean()
      .exec(),
    CommunicationConversationModel.find({ engagementId: workflowId, archivedAt: null })
      .select("_id status closedAt")
      .lean()
      .exec(),
    ClientPaymentModel.find({ workflowId, archivedAt: null }).select("_id").lean().exec(),
    EngagementRequestModel.find({ _id: { $in: requestIds }, archivedAt: null })
      .select("_id")
      .lean()
      .exec(),
    QuotationModel.find({ requestId: { $in: requestIds }, archivedAt: null })
      .select("_id")
      .lean()
      .exec(),
    StaffNoteModel.find({ workflowId, archivedAt: null }).select("_id").lean().exec(),
    CommunicationNotificationModel.find({ relatedRecordId: workflowId, archivedAt: null })
      .select("_id")
      .lean()
      .exec(),
    EngagementLetterModel.find({ workflowId, archivedAt: null }).select("_id").lean().exec(),
    RequestStaffAssignmentModel.find({ requestId: { $in: requestIdStrings }, archivedAt: null })
      .select("_id")
      .lean()
      .exec(),
  ]);

  return {
    documents: documents.map((document) => ({
      id: document._id.toString(),
      status: document.status,
    })),
    conversations: conversations.map((conversation) => ({
      id: conversation._id.toString(),
      status: conversation.status,
      closedAt: conversation.closedAt ? new Date(conversation.closedAt).toISOString() : null,
    })),
    payments: payments.map((payment) => payment._id.toString()),
    requests: requests.map((request) => request._id.toString()),
    quotations: quotations.map((quotation) => quotation._id.toString()),
    staffNotes: staffNotes.map((note) => note._id.toString()),
    notifications: notifications.map((notification) => notification._id.toString()),
    engagementLetters: engagementLetters.map((letter) => letter._id.toString()),
    requestAssignments: requestAssignments.map((assignment) => assignment._id.toString()),
  };
}

export async function archiveCompletedEngagement(input: { principal: Principal; workflowId: string }) {
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  if (!workflow || !canArchiveEngagementWorkflow(workflow.status) || !isAdministrator(input.principal) || !hasPermission(input.principal, "engagements.archive")) return null;
  await connectToDatabase();
  const data = await getEngagementExecutionData(input.principal, input.workflowId);
  if (!data) return null;
  const [existing, auditRecords, linkedState] = await Promise.all([
    ArchiveRecordModel.findOne({
      recordId: workflow.id,
      recordType: "engagement",
      archiveStatus: { $ne: "restored" },
    }).lean().exec(),
    AuditLogModel.find({ resourceId: workflow.id }).sort({ createdAt: 1 }).lean().exec(),
    buildEngagementArchiveLinkedState(workflow.id),
  ]);
  if (existing) return existing._id.toString();
  const now = new Date();
  const archiveReference = `ARC-ENG-${randomBytes(4).toString("hex").toUpperCase()}`;
  let archivePackage: Awaited<ReturnType<typeof createEngagementArchivePackage>>;
  try {
    archivePackage = await createEngagementArchivePackage({
      archiveReference,
      workflow,
      data,
      auditRecords,
    });
  } catch {
    return null;
  }
  const retentionExpiry = new Date(now);
  retentionExpiry.setFullYear(retentionExpiry.getFullYear() + 7);
  const archive = await ArchiveRecordModel.create({
    archiveReference,
    recordId: workflow.id,
    recordType: "engagement",
    recordReference: workflow.reference,
    recordName: `${workflow.clientName} - ${workflow.serviceName}`,
    clientId: workflow.clientUserId,
    clientName: workflow.clientName,
    engagementId: workflow.id,
    engagementReference: workflow.reference,
    serviceName: workflow.serviceName,
    originalStatus: workflow.status,
    archiveStatus: "archived",
    archiveReason: getEngagementArchiveReason(workflow.status),
    archivedByUserId: input.principal.id,
    archivedByName: input.principal.displayName || input.principal.email,
    archivedAt: now,
    retentionPolicyName: "Engagement records - 7 years",
    retentionExpiryDate: retentionExpiry,
    readOnly: true,
    restoreEligible: true,
    clientVisible: true,
    previousLocation: `/admin/active-engagements/${workflow.id}`,
    archiveNotes: workflow.completion.notes,
    archivePackageStorageKey: archivePackage.storageKey,
    archivePackageFileName: archivePackage.fileName,
    archivePackageSize: archivePackage.size,
    archivePackageCreatedAt: archivePackage.createdAt,
    snapshot: {
      linkedState,
      workflowHistory: workflow.stages.map((stage) => ({
        stage: stage.name,
        status: stage.status,
        duration: `${stage.expectedDurationDays ?? 0} days`,
        order: String(stage.order ?? 0),
      })),
      tasks: workflow.tasks.map((task) => ({
        task: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : "",
      })),
      documents: data.documents.map((doc) => ({
        name: doc.name,
        status: doc.status,
        documentKind: doc.documentKind ?? "general",
        uploadedAt: doc.uploadedAt,
      })),
      messages: data.messages.map((msg) => ({
        message: msg.body ?? "",
        sender: msg.senderName ?? "",
        date: msg.createdAt ?? "",
      })),
      finance: [
        ...workflow.financial.invoices.map((inv) => ({
          invoice: inv.invoiceNumber ?? "",
          status: inv.status,
          amount: String(inv.amount ?? 0),
          currency: inv.currency ?? "",
        })),
        ...data.payments.map((pmt) => ({
          payment: pmt.transactionReference ?? "",
          status: pmt.status,
          amount: String(pmt.amount ?? 0),
          currency: pmt.currency ?? "",
        })),
      ],
      timeline: workflow.activity.map((activity) => ({
        title: activity.title ?? "",
        date: activity.createdAt ? new Date(activity.createdAt).toISOString() : "",
        description: activity.description ?? "",
      })),
      approvals: workflow.approvals.map((approval) => ({
        approval: approval.title ?? "",
        stage: approval.stageKey ?? "",
        status: approval.status,
      })),
      auditRecords: auditRecords.map((rec) => ({
        action: rec.action ?? "",
        actor: rec.actorEmail ?? "System",
        date: rec.createdAt ? new Date(rec.createdAt).toISOString() : "",
      })),
      completion: {
        notes: workflow.completion?.notes ?? "",
        status: workflow.completion?.summary ?? "",
        completedAt: workflow.completion?.completedAt ? new Date(workflow.completion.completedAt).toISOString() : "",
      },
    },
  });
  await Promise.all([
    WorkflowInstanceModel.updateOne({ _id: workflow.id }, { $set: { status: "archived", archivedAt: now, "archive.status": "archived", "archive.archivedAt": now, "completion.archivedAt": now, "completion.archivedByUserId": input.principal.id, "completion.archivedByName": input.principal.displayName || input.principal.email }, $push: { activity: { type: "workflow_archived", title: "Engagement Archived", actorName: input.principal.displayName || input.principal.email, actorUserId: input.principal.id, description: `The ${workflow.status === "active" ? "active" : "completed"} engagement is now read-only and its ZIP package contains ${archivePackage.documentCount} document record(s).`, relatedResource: archive._id.toString(), clientVisible: true, createdAt: now } } }).exec(),
    CommunicationConversationModel.updateMany(
      { _id: { $in: linkedState.conversations.map((item) => item.id) } },
      { $set: { archivedAt: now, status: "closed", closedAt: now } },
    ).exec(),
    ClientPaymentModel.updateMany(
      { _id: { $in: linkedState.payments } },
      { $set: { archivedAt: now } },
    ).exec(),
    ClientDocumentModel.updateMany(
      { _id: { $in: linkedState.documents.map((item) => item.id) } },
      { $set: { status: "archived" } },
    ).exec(),
    EngagementRequestModel.updateMany(
      { _id: { $in: linkedState.requests } },
      { $set: { archivedAt: now } },
    ).exec(),
    QuotationModel.updateMany(
      { _id: { $in: linkedState.quotations } },
      { $set: { archivedAt: now } },
    ).exec(),
    StaffNoteModel.updateMany(
      { _id: { $in: linkedState.staffNotes } },
      { $set: { archivedAt: now } },
    ).exec(),
    CommunicationNotificationModel.updateMany(
      { _id: { $in: linkedState.notifications } },
      { $set: { archivedAt: now } },
    ).exec(),
    EngagementLetterModel.updateMany(
      { _id: { $in: linkedState.engagementLetters } },
      { $set: { archivedAt: now } },
    ).exec(),
    RequestStaffAssignmentModel.updateMany(
      { _id: { $in: linkedState.requestAssignments } },
      { $set: { archivedAt: now } },
    ).exec(),
  ]);
  await notifyUsers({ recipientIds: [workflow.clientUserId, ...workflow.team.map((member) => member.userId)], actor: input.principal, type: "engagement_update", title: "Engagement archived", description: `${workflow.reference} is now available as a read-only record.`, workflowId: workflow.id, tab: "completion", archiveId: archive._id.toString() });
  await writeAuditLog({ actor: input.principal, action: "engagement.archived", resourceType: "ArchiveRecord", resourceId: archive._id.toString(), newValues: { workflowId: workflow.id, archivedAt: now, linkedState } });
  return archive._id.toString();
}
