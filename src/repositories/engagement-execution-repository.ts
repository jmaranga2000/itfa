import { randomBytes, randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { hasPermission } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { sendClientJourneyEmail } from "@/features/engagements/client-journey-email";
import type { WorkflowPriority } from "@/features/workflows/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { createZipBuffer, type ZipEntry } from "@/lib/zip";
import { ArchiveRecordModel } from "@/models/archive-record";
import { AuditLogModel } from "@/models/audit-log";
import { ClientPaymentModel } from "@/models/client-payment";
import { ClientDocumentModel } from "@/models/client-document";
import { CommunicationConversationModel } from "@/models/communication-conversation";
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
  getWorkflowForPrincipal,
  type WorkflowInstanceRecord,
} from "@/repositories/workflow-repository";

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
  const storedDocuments = await ClientDocumentModel.find({ workflowId: input.workflow.id })
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

function isFinance(workflow: WorkflowInstanceRecord, principal: Principal) {
  return isAdministrator(principal) || teamMember(workflow, principal, "finance_officer");
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
  if (workflow.status === "active" && workflow.financial.balanceDue > 0 && workflow.financial.invoices.some((invoice) =>
    ["issued", "partially_paid", "overdue"].includes(invoice.status),
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
  const reviewsApproved = reviewTasks.every((task) =>
    task.reviewHistory.some((review) => review.decision === "approved"),
  );
  const finalDeliverables = documents.filter((document) =>
    document.documentKind === "final_deliverable"
    && (document.deliverableStatus === "released" || (!document.deliverableStatus && document.status === "final")),
  );
  const outstandingClientActions = workflow.clientActions.filter((action) =>
    !["approved", "completed"].includes(action.status),
  );
  const issuedInvoices = workflow.financial.invoices.filter((invoice) =>
    ["issued", "partially_paid", "paid"].includes(invoice.status),
  );
  const invoiceRequired = workflow.financial.balanceDue > 0 || workflow.financial.invoices.length > 0;
  const pendingPayments = payments.filter((payment) => payment.status === "pending");

  return [
    { key: "tasks", label: "All mandatory tasks completed", complete: tasksComplete, detail: tasksComplete ? `${mandatoryTasks.length} tasks complete` : `${mandatoryTasks.filter((task) => task.status !== "completed").length} tasks remain`, actionLabel: "Open tasks", actionTab: "tasks" },
    { key: "reviews", label: "All required reviews approved", complete: reviewsApproved, detail: reviewsApproved ? "Review gates are clear" : `${reviewTasks.filter((task) => !task.reviewHistory.some((review) => review.decision === "approved")).length} reviews remain`, actionLabel: "Review tasks", actionTab: "tasks" },
    { key: "deliverables", label: "Final deliverable uploaded", complete: finalDeliverables.length > 0, detail: finalDeliverables.length > 0 ? `${finalDeliverables.length} final deliverable(s)` : "Upload at least one final deliverable", actionLabel: "Upload deliverable", actionTab: "documents", actionHash: "document-upload" },
    { key: "client_actions", label: "Client requests resolved", complete: outstandingClientActions.length === 0, detail: outstandingClientActions.length === 0 ? "No client response is outstanding" : `${outstandingClientActions.length} client action(s) remain`, actionLabel: "Open client actions", actionTab: "overview" },
    { key: "invoices", label: "Required invoices issued", complete: !invoiceRequired || issuedInvoices.length > 0, detail: !invoiceRequired ? "No invoice is required" : issuedInvoices.length > 0 ? `${issuedInvoices.length} invoice(s) issued` : "An invoice still needs to be issued", actionLabel: "Open finance", actionTab: "finance" },
    { key: "payments", label: "Submitted payments reviewed", complete: pendingPayments.length === 0, detail: pendingPayments.length === 0 ? "No payment is waiting for review" : `${pendingPayments.length} payment(s) await review`, actionLabel: "Review payments", actionTab: "finance" },
    { key: "notes", label: "Completion notes added", complete: completionNotes.trim().length >= 10, detail: completionNotes.trim().length >= 10 ? "Completion notes are ready" : "Add at least 10 characters of completion notes", actionLabel: "Add completion notes", actionTab: "completion", actionHash: "completion-notes" },
  ];
}

export async function getEngagementExecutionData(principal: Principal, workflowId: string) {
  const workflow = await getWorkflowForPrincipal(principal, workflowId, true);
  if (!workflow) return null;
  const [documents, storedPayments, conversation] = await Promise.all([
    listEngagementDocumentsForPrincipal(principal, workflowId),
    ClientPaymentModel.find({ workflowId }).sort({ submittedAt: -1 }).lean().exec(),
    getOrCreateEngagementConversation(principal, workflow),
  ]);
  const payments = (storedPayments as unknown as RawPayment[]).map((payment): EngagementPaymentRecord => ({
    id: payment._id.toString(),
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    transactionReference: payment.transactionReference,
    receiptNumber: payment.receiptNumber ?? null,
    status: payment.status,
    submittedAt: payment.submittedAt.toISOString(),
    verifiedAt: payment.verifiedAt?.toISOString() ?? null,
    reviewNote: payment.reviewNote ?? "",
  }));
  const messages = conversation
    ? await listMessagesForConversation(principal, conversation.id, 100, workflow.status === "archived")
    : [];
  const due = workflow.dueDate ? new Date(workflow.dueDate).getTime() : null;
  const daysRemaining = due === null ? null : Math.ceil((due - Date.now()) / 86_400_000);
  return {
    workflow,
    documents,
    conversation,
    messages,
    payments,
    completionRequirements: getCompletionRequirements(workflow, documents, payments),
    daysRemaining,
    health: getEngagementHealth(workflow),
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
  if (!workflow || workflow.status !== "active" || !isConsultant(workflow, input.principal)) return false;
  const assignee = workflow.team.find((member) => member.userId === input.assignedUserId);
  if (!assignee || !Types.ObjectId.isValid(input.principal.id)) return false;
  const key = `task-${randomUUID()}`;
  const now = new Date();
  await WorkflowInstanceModel.updateOne(
    { _id: workflow.id, status: "active" },
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
    { _id: workflow.id, "tasks.key": task.key, status: "active" },
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
    { _id: workflow.id, status: "active" },
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
    { _id: workflow.id, "clientActions.key": action.key },
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
  if (!workflow || workflow.status !== "active" || !isFinance(workflow, input.principal) || !hasPermission(input.principal, "invoices.create")) return null;
  const now = new Date();
  const invoiceId = randomUUID();
  const invoiceNumber = `INV-${now.getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  await WorkflowInstanceModel.updateOne(
    { _id: workflow.id, status: "active" },
    {
      $push: { "financial.invoices": { invoiceId, invoiceNumber, issueDate: now, dueDate: input.dueDate, amount: input.amount, currency: workflow.financial.currency, status: "draft", notes: input.notes, createdByUserId: input.principal.id, createdByName: input.principal.displayName || input.principal.email } },
      $set: { "financial.invoiceStatus": "draft", "financial.balanceDue": workflow.financial.balanceDue > 0 ? workflow.financial.balanceDue : input.amount, currentStageName: "Finance", nextAction: `Review ${invoiceNumber}`, lastActivityAt: now },
    },
  ).exec();
  return invoiceId;
}

export async function sendEngagementInvoice(input: { principal: Principal; workflowId: string; invoiceId: string }) {
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  const invoice = workflow?.financial.invoices.find((item) => item.invoiceId === input.invoiceId);
  if (!workflow || !invoice || workflow.status !== "active" || invoice.status !== "draft" || !isFinance(workflow, input.principal) || !hasPermission(input.principal, "invoices.approve")) return false;
  const now = new Date();
  await WorkflowInstanceModel.updateOne(
    { _id: workflow.id },
    {
      $set: { "financial.invoices.$[invoice].status": "issued", "financial.invoices.$[invoice].sentAt": now, "financial.invoiceStatus": "issued", currentStageName: "Finance", nextAction: "Await and verify client payment", lastActivityAt: now },
      $push: { activity: { type: "invoice_issued", title: "Invoice Generated", actorName: input.principal.displayName || input.principal.email, actorUserId: input.principal.id, description: `${invoice.invoiceNumber} - ${invoice.currency} ${invoice.amount.toLocaleString("en-KE")}`, relatedResource: invoice.invoiceId, clientVisible: true, createdAt: now } },
    },
    { arrayFilters: [{ "invoice.invoiceId": input.invoiceId }] },
  ).exec();
  await notifyUsers({ recipientIds: [workflow.clientUserId], actor: input.principal, type: "invoice_generated", title: "Invoice generated", description: `${invoice.invoiceNumber} is ready in your engagement workspace.`, workflowId: workflow.id, tab: "finance" });
  if (workflow.clientUserId) {
    const client = await UserModel.findById(workflow.clientUserId).select("email firstName lastName").lean().exec();
    if (client?.email) await sendClientJourneyEmail({ recipientEmail: client.email, recipientName: `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || client.email, title: "Your IFTA invoice is ready", summary: `${invoice.invoiceNumber} for ${invoice.currency} ${invoice.amount.toLocaleString("en-KE")} is available in your engagement workspace.`, actionLabel: "Open finance", actionPath: `/client/engagements/${workflow.id}?tab=finance` }).catch(() => undefined);
  }
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
    { _id: workflow.id, status: "active" },
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
    const client = await UserModel.findById(workflow.clientUserId).select("email firstName lastName").lean().exec();
    if (client?.email) await sendClientJourneyEmail({ recipientEmail: client.email, recipientName: `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || client.email, title: "Your IFTA engagement is complete", summary, actionLabel: "View final deliverables", actionPath: `/client/engagements/${workflow.id}?tab=deliverables` }).catch(() => undefined);
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

export async function archiveCompletedEngagement(input: { principal: Principal; workflowId: string }) {
  const workflow = await getWorkflowForPrincipal(input.principal, input.workflowId);
  if (!workflow || workflow.status !== "completed" || !isAdministrator(input.principal) || !hasPermission(input.principal, "engagements.archive")) return null;
  await connectToDatabase();
  const data = await getEngagementExecutionData(input.principal, input.workflowId);
  if (!data) return null;
  const [existing, auditRecords] = await Promise.all([
    ArchiveRecordModel.findOne({ recordId: workflow.id, recordType: "engagement" }).lean().exec(),
    AuditLogModel.find({ resourceId: workflow.id }).sort({ createdAt: 1 }).lean().exec(),
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
    archiveReason: "Engagement completed and archived from the execution workspace.",
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
      workflowHistory: workflow.stages,
      tasks: workflow.tasks,
      documents: data.documents,
      messages: data.messages,
      finance: [...workflow.financial.invoices, ...data.payments],
      timeline: workflow.activity,
      approvals: workflow.approvals,
      auditRecords,
      completion: workflow.completion,
    },
  });
  await Promise.all([
    WorkflowInstanceModel.updateOne({ _id: workflow.id }, { $set: { status: "archived", archivedAt: now, "archive.status": "archived", "archive.archivedAt": now, "completion.archivedAt": now, "completion.archivedByUserId": input.principal.id, "completion.archivedByName": input.principal.displayName || input.principal.email }, $push: { activity: { type: "workflow_archived", title: "Engagement Archived", actorName: input.principal.displayName || input.principal.email, actorUserId: input.principal.id, description: `The completed engagement is now read-only and its ZIP package contains ${archivePackage.documentCount} document record(s).`, relatedResource: archive._id.toString(), clientVisible: true, createdAt: now } } }).exec(),
    CommunicationConversationModel.updateMany({ engagementId: workflow.id }, { $set: { archivedAt: now, status: "closed", closedAt: now } }).exec(),
  ]);
  await notifyUsers({ recipientIds: [workflow.clientUserId, ...workflow.team.map((member) => member.userId)], actor: input.principal, type: "engagement_update", title: "Engagement archived", description: `${workflow.reference} is now available as a read-only record.`, workflowId: workflow.id, tab: "completion", archiveId: archive._id.toString() });
  await writeAuditLog({ actor: input.principal, action: "engagement.archived", resourceType: "ArchiveRecord", resourceId: archive._id.toString(), newValues: { workflowId: workflow.id, archivedAt: now } });
  return archive._id.toString();
}
