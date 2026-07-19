import { randomBytes, randomUUID } from "node:crypto";
import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { hasPermission } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { sendClientJourneyEmail } from "@/features/engagements/client-journey-email";
import type { WorkflowPriority } from "@/features/workflows/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ArchiveRecordModel } from "@/models/archive-record";
import { AuditLogModel } from "@/models/audit-log";
import { ClientPaymentModel } from "@/models/client-payment";
import { CommunicationConversationModel } from "@/models/communication-conversation";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
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
};

export type EngagementExecutionData = {
  workflow: WorkflowInstanceRecord;
  documents: EngagementDocumentRecord[];
  conversation: CommunicationConversation | null;
  messages: CommunicationMessage[];
  payments: EngagementPaymentRecord[];
  completionRequirements: CompletionRequirement[];
  daysRemaining: number | null;
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

function isAdministrator(principal: Principal) {
  return principal.roleKeys.some((role) => role === "admin" || role === "super_admin");
}

function teamMember(workflow: WorkflowInstanceRecord, principal: Principal, role: string) {
  return workflow.team.some((member) => member.userId === principal.id && member.role === role);
}

function isConsultant(workflow: WorkflowInstanceRecord, principal: Principal) {
  return isAdministrator(principal)
    || principal.roleKeys.includes("engagement_manager")
    || teamMember(workflow, principal, "consultant");
}

function isReviewer(workflow: WorkflowInstanceRecord, principal: Principal) {
  return isAdministrator(principal) || teamMember(workflow, principal, "reviewer");
}

function isFinance(workflow: WorkflowInstanceRecord, principal: Principal) {
  return isAdministrator(principal) || teamMember(workflow, principal, "finance_officer");
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
    document.documentKind === "final_deliverable" && ["approved", "final"].includes(document.status),
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
    { key: "tasks", label: "All mandatory tasks completed", complete: tasksComplete, detail: tasksComplete ? `${mandatoryTasks.length} tasks complete` : `${mandatoryTasks.filter((task) => task.status !== "completed").length} tasks remain` },
    { key: "reviews", label: "All required reviews approved", complete: reviewsApproved, detail: reviewsApproved ? "Review gates are clear" : `${reviewTasks.filter((task) => !task.reviewHistory.some((review) => review.decision === "approved")).length} reviews remain` },
    { key: "deliverables", label: "Final deliverable uploaded", complete: finalDeliverables.length > 0, detail: finalDeliverables.length > 0 ? `${finalDeliverables.length} final deliverable(s)` : "Upload at least one final deliverable" },
    { key: "client_actions", label: "Client requests resolved", complete: outstandingClientActions.length === 0, detail: outstandingClientActions.length === 0 ? "No client response is outstanding" : `${outstandingClientActions.length} client action(s) remain` },
    { key: "invoices", label: "Required invoices issued", complete: !invoiceRequired || issuedInvoices.length > 0, detail: !invoiceRequired ? "No invoice is required" : issuedInvoices.length > 0 ? `${issuedInvoices.length} invoice(s) issued` : "An invoice still needs to be issued" },
    { key: "payments", label: "Submitted payments reviewed", complete: pendingPayments.length === 0, detail: pendingPayments.length === 0 ? "No payment is waiting for review" : `${pendingPayments.length} payment(s) await review` },
    { key: "notes", label: "Completion notes added", complete: completionNotes.trim().length >= 10, detail: completionNotes.trim().length >= 10 ? "Completion notes are ready" : "Add at least 10 characters of completion notes" },
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
  const summary = `${workflow.reference} for ${workflow.clientName} completed with ${workflow.tasks.length} tasks, ${data.documents.length} documents, ${workflow.financial.invoices.length} invoices, and ${data.payments.length} payment records.`;
  await WorkflowInstanceModel.updateOne(
    { _id: workflow.id, status: "active" },
    {
      $set: {
        status: "completed",
        currentStageName: "Completed",
        nextAction: "Archive the completed engagement",
        lastActivityAt: now,
        completionChecklist: requirements.map((item) => ({ label: item.label, completed: item.complete })),
        completion: { notes: input.notes, summary, completedAt: now, completedByUserId: input.principal.id, completedByName: input.principal.displayName || input.principal.email },
      },
      $push: { activity: { type: "engagement_completed", title: "Engagement Completed", actorName: input.principal.displayName || input.principal.email, actorUserId: input.principal.id, description: input.notes, relatedResource: workflow.reference, clientVisible: true, createdAt: now } },
    },
  ).exec();
  await notifyUsers({ recipientIds: [workflow.clientUserId, ...workflow.team.map((member) => member.userId)], actor: input.principal, type: "engagement_update", title: "Engagement completed", description: `${workflow.reference} has been completed.`, workflowId: workflow.id, tab: "completion" });
  if (workflow.clientUserId) {
    const client = await UserModel.findById(workflow.clientUserId).select("email firstName lastName").lean().exec();
    if (client?.email) await sendClientJourneyEmail({ recipientEmail: client.email, recipientName: `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || client.email, title: "Your IFTA engagement is complete", summary, actionLabel: "View final deliverables", actionPath: `/client/engagements/${workflow.id}?tab=documents` }).catch(() => undefined);
  }
  await writeAuditLog({ actor: input.principal, action: "engagement.completed", resourceType: "WorkflowInstance", resourceId: workflow.id, newValues: { completedAt: now, summary } });
  return { ok: true as const, missing: [] };
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
  const retentionExpiry = new Date(now);
  retentionExpiry.setFullYear(retentionExpiry.getFullYear() + 7);
  const archive = await ArchiveRecordModel.create({
    archiveReference: `ARC-ENG-${randomBytes(4).toString("hex").toUpperCase()}`,
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
    WorkflowInstanceModel.updateOne({ _id: workflow.id }, { $set: { status: "archived", archivedAt: now, "archive.status": "archived", "archive.archivedAt": now, "completion.archivedAt": now, "completion.archivedByUserId": input.principal.id, "completion.archivedByName": input.principal.displayName || input.principal.email }, $push: { activity: { type: "workflow_archived", title: "Engagement Archived", actorName: input.principal.displayName || input.principal.email, actorUserId: input.principal.id, description: "The completed engagement is now read-only.", relatedResource: archive._id.toString(), clientVisible: true, createdAt: now } } }).exec(),
    CommunicationConversationModel.updateMany({ engagementId: workflow.id }, { $set: { archivedAt: now, status: "closed", closedAt: now } }).exec(),
  ]);
  await notifyUsers({ recipientIds: [workflow.clientUserId, ...workflow.team.map((member) => member.userId)], actor: input.principal, type: "engagement_update", title: "Engagement archived", description: `${workflow.reference} is now available as a read-only record.`, workflowId: workflow.id, tab: "completion", archiveId: archive._id.toString() });
  await writeAuditLog({ actor: input.principal, action: "engagement.archived", resourceType: "ArchiveRecord", resourceId: archive._id.toString(), newValues: { workflowId: workflow.id, archivedAt: now } });
  return archive._id.toString();
}
