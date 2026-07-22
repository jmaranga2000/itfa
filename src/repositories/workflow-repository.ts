import { Types } from "mongoose";
import {
  hasPermission,
  type Principal,
} from "@/features/authorization/access-control";
import type {
  ClientActionStatus,
  DocumentWorkflowStatus,
  InvoiceWorkflowStatus,
  PaymentWorkflowStatus,
  WorkflowApprovalStatus,
  WorkflowInstanceStatus,
  WorkflowPriority,
  WorkflowRiskLevel,
  WorkflowStageStatus,
  WorkflowTaskStatus,
  WorkflowTemplateStatus,
} from "@/features/workflows/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { WorkflowTemplateModel } from "@/models/workflow-template";

export type WorkflowTemplateStage = {
  key: string;
  name: string;
  clientTitle: string;
  order: number;
  expectedDurationDays: number;
  responsibleRole: string;
  entryConditions: string[];
  completionConditions: string[];
  requiredDocuments: string[];
  approvalRequired: boolean;
  clientVisible: boolean;
  tasks: Array<{
    key: string;
    title: string;
    assignedRole: string;
    priority: WorkflowPriority;
    dueOffsetDays: number;
    dependencies: string[];
    checklist: string[];
    clientVisible: boolean;
    approvalRequired: boolean;
  }>;
};

export type WorkflowTemplateRecord = {
  id: string;
  name: string;
  description: string;
  applicableServices: string[];
  version: number;
  status: WorkflowTemplateStatus;
  stages: WorkflowTemplateStage[];
  milestones: string[];
  approvalPoints: Array<{
    key: string;
    title: string;
    stageKey: string;
    approverRole: string;
    status: WorkflowApprovalStatus;
  }>;
  completionConditions: string[];
  archiveRules: string[];
  notificationRules: string[];
  escalationRules: string[];
  publishedAt: string | null;
  updatedAt: string | null;
};

export type WorkflowStageRecord = {
  key: string;
  name: string;
  clientTitle: string;
  order: number;
  responsibleRole: string;
  status: WorkflowStageStatus;
  expectedDurationDays: number;
  dueAt: string | null;
  enteredAt: string | null;
  completedAt: string | null;
  completionConditions: string[];
  requiredDocuments: string[];
  approvalRequired: boolean;
  clientVisible: boolean;
  blockedReason: string | null;
};

export type WorkflowTaskRecord = {
  key: string;
  stageKey: string;
  title: string;
  description: string;
  assignedUserId: string | null;
  assignedUserName: string;
  assignedRole: string;
  priority: WorkflowPriority;
  status: WorkflowTaskStatus;
  startDate: string | null;
  dueDate: string | null;
  dependencies: string[];
  checklist: Array<{ label: string; completed: boolean }>;
  requiredDocuments: string[];
  clientVisible: boolean;
  clientActionRequired: boolean;
  internalNotes: string;
  completionNotes: string;
  createdByUserId: string | null;
  reviewHistory: Array<{
    decision: "approved" | "changes_requested";
    comments: string;
    reviewerUserId: string;
    reviewerName: string;
    reviewedAt: string;
  }>;
  approvalRequired: boolean;
  blockerReason: string | null;
};

export type WorkflowMilestoneRecord = {
  key: string;
  title: string;
  status: "pending" | "completed" | "blocked";
  date: string | null;
  relatedTaskKeys: string[];
  clientVisible: boolean;
};

export type WorkflowApprovalRecord = {
  key: string;
  title: string;
  stageKey: string;
  status: WorkflowApprovalStatus;
  approverName: string;
  approvalDate: string | null;
  reason: string;
  comments: string;
};

export type WorkflowClientActionRecord = {
  key: string;
  title: string;
  instructions: string;
  dueDate: string | null;
  relatedTaskKey: string | null;
  requiredDocumentType: string | null;
  priority: WorkflowPriority;
  assignedClientUserId: string | null;
  status: ClientActionStatus;
  response: string;
  respondedAt: string | null;
};

export type WorkflowDocumentRecord = {
  documentId: string;
  name: string;
  status: DocumentWorkflowStatus;
  version: number;
  visibility: "client" | "staff" | "admin" | "finance" | "all";
  reviewerComments: string;
  clientFeedback: string;
  uploadedAt: string;
};

export type WorkflowActivityRecord = {
  type: string;
  title: string;
  actorName: string;
  description: string;
  relatedResource: string;
  clientVisible: boolean;
  createdAt: string;
};

export type WorkflowInternalNoteRecord = {
  id: string;
  body: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
};

export type WorkflowTeamMemberRecord = {
  userId: string | null;
  name: string;
  email: string;
  role: string;
  department: string;
  workloadLevel: "available" | "balanced" | "high" | "overloaded";
};

export type WorkflowClosureSummary = {
  generatedAt: string | null;
  generatedByName: string;
  totalTasksCompleted: number;
  totalDocumentsUploaded: number;
  totalDeliverablesReleased: number;
  totalInternalReviews: number;
  totalMessages: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
};

export type WorkflowInstanceRecord = {
  id: string;
  reference: string;
  clientName: string;
  clientUserId: string | null;
  organizationName: string;
  sourceRequestId: string | null;
  engagementLetterId: string | null;
  previousEngagementId?: string | null;
  previousEngagementReference?: string;
  serviceName: string;
  templateName: string;
  templateVersion: number;
  status: WorkflowInstanceStatus;
  currentStageKey: string;
  currentStageName: string;
  riskLevel: WorkflowRiskLevel;
  riskReason: string;
  nextAction: string;
  responsibleUserName: string;
  responsibleUserId: string | null;
  startDate: string | null;
  activatedAt: string | null;
  signedAt: string | null;
  signedByUserId: string | null;
  signedByName: string;
  teamAssignedAt: string | null;
  dueDate: string | null;
  lastActivityAt: string | null;
  progress: WorkflowProgress;
  team: WorkflowTeamMemberRecord[];
  stages: WorkflowStageRecord[];
  tasks: WorkflowTaskRecord[];
  milestones: WorkflowMilestoneRecord[];
  approvals: WorkflowApprovalRecord[];
  clientActions: WorkflowClientActionRecord[];
  documents: WorkflowDocumentRecord[];
  financial: {
    invoiceStatus: InvoiceWorkflowStatus;
    paymentStatus: PaymentWorkflowStatus;
    balanceDue: number;
    currency: string;
    invoices: Array<{
      invoiceId: string;
      invoiceNumber: string;
      issueDate: string;
      dueDate: string;
      amount: number;
      currency: string;
      status: InvoiceWorkflowStatus;
      notes: string;
      createdByUserId: string | null;
      createdByName: string;
      sentAt: string | null;
    }>;
  };
  completionChecklist: Array<{ label: string; completed: boolean }>;
  completion: {
    notes: string;
    summary: string;
    completedAt: string | null;
    completedByUserId: string | null;
    completedByName: string;
    archivedAt: string | null;
    archivedByUserId: string | null;
    archivedByName: string;
    closureSummary?: WorkflowClosureSummary | null;
  };
  archive: {
    status: "not_ready" | "grace_period" | "read_only" | "archived" | "legal_hold";
    retentionUntil: string | null;
    archivedAt: string | null;
    legalHoldReason: string;
  };
  activity: WorkflowActivityRecord[];
  internalNotes: WorkflowInternalNoteRecord[];
};

export type WorkflowProgress = {
  overall: number;
  clientVisible: number;
  completedStages: number;
  totalStages: number;
  completedRequiredTasks: number;
  totalRequiredTasks: number;
  completedClientActions: number;
  totalClientActions: number;
  overdueItems: number;
  blockedItems: number;
  pendingApprovals: number;
};

export type WorkflowDashboardData = {
  summary: Array<{ label: string; value: string; helper: string; href: string }>;
  pipeline: Array<{ key: string; label: string; count: number; overdue: number; risk: number }>;
  actionRequired: Array<{
    item: string;
    client: string;
    engagement: string;
    action: string;
    responsibleUser: string;
    dueDate: string | null;
    priority: WorkflowPriority;
    href: string;
  }>;
  overdueWork: Array<{
    task: string;
    engagement: string;
    assignee: string;
    daysOverdue: number;
    priority: WorkflowPriority;
    escalationStatus: string;
    href: string;
  }>;
  staffWorkload: Array<{
    consultant: string;
    activeEngagements: number;
    openTasks: number;
    overdueTasks: number;
    workloadLevel: "available" | "balanced" | "high" | "overloaded";
  }>;
  recentActivity: WorkflowActivityRecord[];
  workflows: WorkflowInstanceRecord[];
};

type RawWorkflowTemplate = {
  _id: Types.ObjectId;
  name: string;
  description: string;
  applicableServices?: string[];
  version?: number;
  status?: WorkflowTemplateStatus;
  stages?: WorkflowTemplateStage[];
  milestones?: string[];
  approvalPoints?: WorkflowTemplateRecord["approvalPoints"];
  completionConditions?: string[];
  archiveRules?: string[];
  notificationRules?: string[];
  escalationRules?: string[];
  publishedAt?: Date | null;
  updatedAt?: Date | null;
};

type RawWorkflowInstance = Omit<
  WorkflowInstanceRecord,
  | "id"
  | "progress"
  | "sourceRequestId"
  | "engagementLetterId"
  | "previousEngagementId"
  | "previousEngagementReference"
  | "activatedAt"
  | "signedAt"
  | "signedByUserId"
  | "teamAssignedAt"
  | "internalNotes"
  | "financial"
  | "completion"
> & {
  _id: Types.ObjectId;
  organizationId?: Types.ObjectId | null;
  engagementId?: Types.ObjectId | null;
  sourceRequestId?: Types.ObjectId | null;
  engagementLetterId?: Types.ObjectId | null;
  previousEngagementId?: Types.ObjectId | null;
  previousEngagementReference?: string;
  templateId?: Types.ObjectId;
  clientUserId?: Types.ObjectId | null;
  responsibleUserId?: Types.ObjectId | null;
  startDate?: Date | null;
  activatedAt?: Date | null;
  signedAt?: Date | null;
  signedByUserId?: Types.ObjectId | null;
  teamAssignedAt?: Date | null;
  dueDate?: Date | null;
  lastActivityAt?: Date | null;
  stages?: Array<Omit<WorkflowStageRecord, "dueAt" | "enteredAt" | "completedAt"> & {
    dueAt?: Date | null;
    enteredAt?: Date | null;
    completedAt?: Date | null;
  }>;
  tasks?: Array<Omit<WorkflowTaskRecord, "assignedUserId" | "startDate" | "dueDate" | "createdByUserId" | "reviewHistory"> & {
    assignedUserId?: Types.ObjectId | null;
    startDate?: Date | null;
    dueDate?: Date | null;
    createdByUserId?: Types.ObjectId | null;
    reviewHistory?: Array<{
      decision: "approved" | "changes_requested";
      comments: string;
      reviewerUserId: Types.ObjectId;
      reviewerName: string;
      reviewedAt?: Date | null;
    }>;
  }>;
  milestones?: Array<Omit<WorkflowMilestoneRecord, "date"> & { date?: Date | null }>;
  approvals?: Array<Omit<WorkflowApprovalRecord, "approvalDate"> & { approvalDate?: Date | null }>;
  clientActions?: Array<
    Omit<WorkflowClientActionRecord, "assignedClientUserId" | "dueDate" | "respondedAt"> & {
      assignedClientUserId?: Types.ObjectId | null;
      dueDate?: Date | null;
      respondedAt?: Date | null;
    }
  >;
  documents?: Array<Omit<WorkflowDocumentRecord, "uploadedAt"> & { uploadedAt?: Date | null }>;
  team?: Array<Omit<WorkflowTeamMemberRecord, "userId"> & { userId?: Types.ObjectId | null }>;
  activity?: Array<Omit<WorkflowActivityRecord, "createdAt"> & { createdAt?: Date | null }>;
  internalNotes?: Array<{
    _id?: Types.ObjectId;
    body: string;
    createdByUserId: Types.ObjectId;
    createdByName: string;
    createdAt?: Date | null;
  }>;
  financial: {
    invoiceStatus: InvoiceWorkflowStatus;
    paymentStatus: PaymentWorkflowStatus;
    balanceDue: number;
    currency: string;
    invoices?: Array<{
      invoiceId: string;
      invoiceNumber: string;
      issueDate: Date;
      dueDate: Date;
      amount: number;
      currency: string;
      status: InvoiceWorkflowStatus;
      notes?: string;
      createdByUserId?: Types.ObjectId | null;
      createdByName?: string;
      sentAt?: Date | null;
    }>;
  };
  completion?: {
    notes?: string;
    summary?: string;
    completedAt?: Date | null;
    completedByUserId?: Types.ObjectId | null;
    completedByName?: string;
    archivedAt?: Date | null;
    archivedByUserId?: Types.ObjectId | null;
    archivedByName?: string;
    closureSummary?: {
      generatedAt?: Date | null;
      generatedByName?: string;
      totalTasksCompleted?: number;
      totalDocumentsUploaded?: number;
      totalDeliverablesReleased?: number;
      totalInternalReviews?: number;
      totalMessages?: number;
      totalInvoiced?: number;
      totalPaid?: number;
      outstandingBalance?: number;
    } | null;
  };
};

function serializeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.toISOString();
}

function objectId(value: string | null | undefined) {
  if (!value || !Types.ObjectId.isValid(value)) {
    return null;
  }

  return new Types.ObjectId(value);
}

function isAdmin(principal: Principal) {
  return principal.roleKeys.some((role) => role === "admin" || role === "super_admin");
}

function workflowAccessFilter(principal: Principal, includeArchived = false): Record<string, unknown> {
  const activeFilter = includeArchived ? {} : { archivedAt: null };
  if (isAdmin(principal) || principal.roleKeys.includes("engagement_manager")) {
    return activeFilter;
  }

  const principalId = objectId(principal.id);
  const orgIds = principal.clientOrganizationIds.map(objectId).filter(Boolean);
  const engagementIds = principal.assignedEngagementIds.map(objectId).filter(Boolean);
  const clauses: Record<string, unknown>[] = [];

  if (principalId) {
    clauses.push({ clientUserId: principalId });
    clauses.push({ responsibleUserId: principalId });
    clauses.push({ "team.userId": principalId });
    clauses.push({ "tasks.assignedUserId": principalId });
    clauses.push({ "clientActions.assignedClientUserId": principalId });
  }

  // Finance work is intentionally assigned to the finance role so any available
  // finance officer can pick it up, even before a named officer is selected.
  if (principal.roleKeys.includes("finance_officer")) {
    clauses.push({ "tasks.assignedRole": "finance_officer" });
    clauses.push({ "stages.responsibleRole": "finance_officer" });
  }

  if (orgIds.length > 0) {
    clauses.push({ organizationId: { $in: orgIds } });
  }

  if (engagementIds.length > 0) {
    clauses.push({ engagementId: { $in: engagementIds } });
  }

  return clauses.length > 0 ? { ...activeFilter, $or: clauses } : { _id: null };
}

function calculateProgress(rawWorkflow: Pick<
  RawWorkflowInstance,
  "stages" | "tasks" | "approvals" | "clientActions" | "documents" | "financial"
>): WorkflowProgress {
  const stages = rawWorkflow.stages ?? [];
  const tasks = rawWorkflow.tasks ?? [];
  const approvals = rawWorkflow.approvals ?? [];
  const clientActions = rawWorkflow.clientActions ?? [];
  const documents = rawWorkflow.documents ?? [];
  const requiredTasks = tasks.filter((task) => task.status !== "cancelled");
  const completedRequiredTasks = requiredTasks.filter((task) => task.status === "completed").length;
  const visibleStages = stages.filter((stage) => stage.clientVisible);
  const completedVisibleStages = visibleStages.filter((stage) => stage.status === "completed").length;
  const completedStages = stages.filter((stage) => stage.status === "completed").length;
  const completedClientActions = clientActions.filter((action) =>
    ["approved", "completed"].includes(action.status),
  ).length;
  const now = Date.now();
  const overdueItems =
    tasks.filter(
      (task) =>
        task.status !== "completed" &&
        task.status !== "cancelled" &&
        task.dueDate &&
        new Date(task.dueDate).getTime() < now,
    ).length +
    clientActions.filter(
      (action) =>
        !["approved", "completed"].includes(action.status) &&
        action.dueDate &&
        new Date(action.dueDate).getTime() < now,
    ).length;
  const blockedItems =
    tasks.filter((task) => task.status === "blocked").length +
    stages.filter((stage) => stage.status === "blocked").length;
  const pendingApprovals = approvals.filter((approval) => approval.status === "awaiting_approval").length;
  const stageWeight = stages.length > 0 ? completedStages / stages.length : 0;
  const taskWeight =
    requiredTasks.length > 0 ? completedRequiredTasks / requiredTasks.length : stageWeight;
  const clientActionWeight =
    clientActions.length > 0 ? completedClientActions / clientActions.length : stageWeight;
  const documentWeight = documents.length > 0
    ? documents.filter((document) => ["approved", "final"].includes(document.status)).length / documents.length
    : stageWeight;
  const invoiceStatus = rawWorkflow.financial?.invoiceStatus ?? "draft";
  const financeWeight = invoiceStatus === "paid"
    ? 1
    : invoiceStatus === "partially_paid"
      ? 0.75
      : ["issued", "approved"].includes(invoiceStatus)
        ? 0.5
        : stageWeight;

  return {
    overall: Math.round((stageWeight * 0.3 + taskWeight * 0.35 + clientActionWeight * 0.1 + documentWeight * 0.15 + financeWeight * 0.1) * 100),
    clientVisible:
      visibleStages.length > 0
        ? Math.round((completedVisibleStages / visibleStages.length) * 100)
        : Math.round(stageWeight * 100),
    completedStages,
    totalStages: stages.length,
    completedRequiredTasks,
    totalRequiredTasks: requiredTasks.length,
    completedClientActions,
    totalClientActions: clientActions.length,
    overdueItems,
    blockedItems,
    pendingApprovals,
  };
}

function serializeTemplate(template: RawWorkflowTemplate): WorkflowTemplateRecord {
  return {
    id: template._id.toString(),
    name: template.name,
    description: template.description,
    applicableServices: template.applicableServices ?? [],
    version: template.version ?? 1,
    status: template.status ?? "draft",
    stages: template.stages ?? [],
    milestones: template.milestones ?? [],
    approvalPoints: template.approvalPoints ?? [],
    completionConditions: template.completionConditions ?? [],
    archiveRules: template.archiveRules ?? [],
    notificationRules: template.notificationRules ?? [],
    escalationRules: template.escalationRules ?? [],
    publishedAt: serializeDate(template.publishedAt),
    updatedAt: serializeDate(template.updatedAt),
  };
}

function serializeWorkflow(workflow: RawWorkflowInstance, clientView = false): WorkflowInstanceRecord {
  const stages = (workflow.stages ?? [])
    .filter((stage) => !clientView || stage.clientVisible)
    .map((stage) => ({
      ...stage,
      dueAt: serializeDate(stage.dueAt),
      enteredAt: serializeDate(stage.enteredAt),
      completedAt: serializeDate(stage.completedAt),
      blockedReason: stage.blockedReason ?? null,
    }));
  const tasks = (workflow.tasks ?? [])
    .filter((task) => !clientView || task.clientVisible)
    .map((task) => ({
      ...task,
      assignedUserId: task.assignedUserId?.toString() ?? null,
      startDate: serializeDate(task.startDate),
      dueDate: serializeDate(task.dueDate),
      blockerReason: task.blockerReason ?? null,
      createdByUserId: task.createdByUserId?.toString() ?? null,
      reviewHistory: (task.reviewHistory ?? []).map((review) => ({
        decision: review.decision,
        comments: review.comments,
        reviewerUserId: review.reviewerUserId.toString(),
        reviewerName: review.reviewerName,
        reviewedAt: serializeDate(review.reviewedAt) ?? "",
      })),
    }));
  const progress = calculateProgress({
    stages: workflow.stages,
    tasks: workflow.tasks,
    approvals: workflow.approvals,
    clientActions: workflow.clientActions,
    documents: workflow.documents,
    financial: workflow.financial,
  });

  return {
    id: workflow._id.toString(),
    reference: workflow.reference,
    clientName: workflow.clientName,
    clientUserId: workflow.clientUserId?.toString() ?? null,
    organizationName: workflow.organizationName,
    sourceRequestId: workflow.sourceRequestId?.toString() ?? null,
    engagementLetterId: workflow.engagementLetterId?.toString() ?? null,
    previousEngagementId: workflow.previousEngagementId?.toString() ?? null,
    previousEngagementReference: workflow.previousEngagementReference ?? "",
    serviceName: workflow.serviceName,
    templateName: workflow.templateName,
    templateVersion: workflow.templateVersion,
    status: workflow.status,
    currentStageKey: workflow.currentStageKey,
    currentStageName:
      (workflow.stages ?? []).find((stage) => stage.key === workflow.currentStageKey)?.name ??
      workflow.currentStageKey,
    riskLevel: workflow.riskLevel,
    riskReason: workflow.riskReason,
    nextAction: workflow.nextAction,
    responsibleUserName: workflow.responsibleUserName,
    responsibleUserId: workflow.responsibleUserId?.toString() ?? null,
    startDate: serializeDate(workflow.startDate),
    activatedAt: serializeDate(workflow.activatedAt),
    signedAt: serializeDate(workflow.signedAt),
    signedByUserId: workflow.signedByUserId?.toString() ?? null,
    signedByName: workflow.signedByName ?? "",
    teamAssignedAt: serializeDate(workflow.teamAssignedAt),
    dueDate: serializeDate(workflow.dueDate),
    lastActivityAt: serializeDate(workflow.lastActivityAt),
    progress,
    team: (workflow.team ?? []).map((member) => ({
      ...member,
      userId: member.userId?.toString() ?? null,
    })),
    stages,
    tasks,
    milestones: (workflow.milestones ?? [])
      .filter((milestone) => !clientView || milestone.clientVisible)
      .map((milestone) => ({ ...milestone, date: serializeDate(milestone.date) })),
    approvals: clientView
      ? []
      : (workflow.approvals ?? []).map((approval) => ({
          ...approval,
          approvalDate: serializeDate(approval.approvalDate),
        })),
    clientActions: (workflow.clientActions ?? []).map((action) => ({
      ...action,
      assignedClientUserId: action.assignedClientUserId?.toString() ?? null,
      dueDate: serializeDate(action.dueDate),
      response: action.response ?? "",
      respondedAt: serializeDate(action.respondedAt),
    })),
    documents: (workflow.documents ?? [])
      .filter((document) => !clientView || document.visibility === "client" || document.visibility === "all")
      .map((document) => ({
        ...document,
        reviewerComments: clientView ? "" : document.reviewerComments,
        uploadedAt: serializeDate(document.uploadedAt) ?? new Date().toISOString(),
      })),
    financial: {
      invoiceStatus: workflow.financial.invoiceStatus,
      paymentStatus: workflow.financial.paymentStatus,
      balanceDue: workflow.financial.balanceDue,
      currency: workflow.financial.currency,
      invoices: (workflow.financial.invoices ?? []).map((invoice) => ({
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: serializeDate(invoice.issueDate) ?? "",
        dueDate: serializeDate(invoice.dueDate) ?? "",
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        notes: invoice.notes ?? "",
        createdByUserId: invoice.createdByUserId?.toString() ?? null,
        createdByName: invoice.createdByName ?? "",
        sentAt: serializeDate(invoice.sentAt),
      })),
    },
    completionChecklist: clientView ? [] : workflow.completionChecklist,
    completion: {
      notes: clientView ? "" : workflow.completion?.notes ?? "",
      summary: workflow.completion?.summary ?? "",
      completedAt: serializeDate(workflow.completion?.completedAt),
      completedByUserId: workflow.completion?.completedByUserId?.toString() ?? null,
      completedByName: workflow.completion?.completedByName ?? "",
      archivedAt: serializeDate(workflow.completion?.archivedAt),
      archivedByUserId: workflow.completion?.archivedByUserId?.toString() ?? null,
      archivedByName: workflow.completion?.archivedByName ?? "",
      closureSummary: workflow.completion?.closureSummary?.generatedAt
        ? {
            generatedAt: serializeDate(workflow.completion.closureSummary.generatedAt),
            generatedByName: workflow.completion.closureSummary.generatedByName ?? "",
            totalTasksCompleted: workflow.completion.closureSummary.totalTasksCompleted ?? 0,
            totalDocumentsUploaded: workflow.completion.closureSummary.totalDocumentsUploaded ?? 0,
            totalDeliverablesReleased: workflow.completion.closureSummary.totalDeliverablesReleased ?? 0,
            totalInternalReviews: workflow.completion.closureSummary.totalInternalReviews ?? 0,
            totalMessages: workflow.completion.closureSummary.totalMessages ?? 0,
            totalInvoiced: workflow.completion.closureSummary.totalInvoiced ?? 0,
            totalPaid: workflow.completion.closureSummary.totalPaid ?? 0,
            outstandingBalance: workflow.completion.closureSummary.outstandingBalance ?? 0,
          }
        : null,
    },
    archive: {
      ...workflow.archive,
      retentionUntil: serializeDate(workflow.archive.retentionUntil),
      archivedAt: serializeDate(workflow.archive.archivedAt),
    },
    activity: (workflow.activity ?? [])
      .filter((activity) => !clientView || activity.clientVisible)
      .map((activity) => ({ ...activity, createdAt: serializeDate(activity.createdAt) ?? "" })),
    internalNotes: clientView
      ? []
      : (workflow.internalNotes ?? []).map((note) => ({
          id: note._id?.toString() ?? `${note.createdByUserId}-${note.createdAt?.toISOString() ?? "note"}`,
          body: note.body,
          createdByUserId: note.createdByUserId.toString(),
          createdByName: note.createdByName,
          createdAt: serializeDate(note.createdAt) ?? "",
        })),
  };
}

function daysOverdue(value: string | Date | null | undefined) {
  if (!value) {
    return 0;
  }

  return Math.max(0, Math.ceil((Date.now() - new Date(value).getTime()) / 86_400_000));
}

export async function listWorkflowTemplatesForAdmin() {
  await connectToDatabase();

  const templates = await WorkflowTemplateModel.find({ archivedAt: null })
    .sort({ status: 1, updatedAt: -1 })
    .lean()
    .exec();

  return (templates as unknown as RawWorkflowTemplate[]).map(serializeTemplate);
}

export async function listWorkflowsForPrincipal(principal: Principal) {
  await connectToDatabase();

  const workflows = await WorkflowInstanceModel.find(workflowAccessFilter(principal))
    .sort({ lastActivityAt: -1 })
    .limit(100)
    .lean()
    .exec();

  const clientView = principal.roleKeys.some((role) => role === "client" || role === "client_representative");

  return (workflows as unknown as RawWorkflowInstance[]).map((workflow) =>
    serializeWorkflow(workflow, clientView),
  );
}

export async function listArchivedWorkflowsForPrincipal(principal: Principal) {
  await connectToDatabase();
  const workflows = await WorkflowInstanceModel.find({
    ...workflowAccessFilter(principal, true),
    $and: [
      { $or: [{ archivedAt: { $ne: null } }, { status: { $in: ["completed", "read_only", "archived"] } }, { "archive.status": { $ne: "not_ready" } }] },
    ],
  }).sort({ "archive.archivedAt": -1, lastActivityAt: -1 }).limit(100).lean().exec();
  const clientView = principal.roleKeys.some((role) => role === "client" || role === "client_representative");
  return (workflows as unknown as RawWorkflowInstance[]).map((workflow) => serializeWorkflow(workflow, clientView));
}

export async function getWorkflowForPrincipal(
  principal: Principal,
  workflowId: string,
  includeArchived = false,
) {
  await connectToDatabase();

  const id = objectId(workflowId);

  if (!id) {
    return null;
  }

  const workflow = await WorkflowInstanceModel.findOne({
    _id: id,
    ...workflowAccessFilter(principal, includeArchived),
  })
    .lean()
    .exec();

  if (!workflow) {
    return null;
  }

  const clientView = principal.roleKeys.some((role) => role === "client" || role === "client_representative");

  return serializeWorkflow(workflow as unknown as RawWorkflowInstance, clientView);
}

export async function getWorkflowDashboardData(principal: Principal): Promise<WorkflowDashboardData> {
  const workflows = await listWorkflowsForPrincipal(principal);
  const openTasks = workflows.flatMap((workflow) =>
    workflow.tasks.map((task) => ({ workflow, task })),
  );
  const overdueWork = openTasks
    .filter(({ task }) => task.dueDate && task.status !== "completed" && task.status !== "cancelled")
    .filter(({ task }) => new Date(task.dueDate as string).getTime() < Date.now())
    .map(({ workflow, task }) => ({
      task: task.title,
      engagement: workflow.reference,
      assignee: task.assignedUserName || task.assignedRole,
      daysOverdue: daysOverdue(task.dueDate),
      priority: task.priority,
      escalationStatus: task.priority === "critical" ? "Escalated" : "Pending escalation",
      href: `/admin/active-engagements/${workflow.id}?tab=tasks`,
    }))
    .slice(0, 8);
  const actionRequired = workflows
    .flatMap((workflow) => [
      ...workflow.clientActions
        .filter((action) => action.status === "pending" || action.status === "overdue")
        .map((action) => ({
          item: action.title,
          client: workflow.clientName,
          engagement: workflow.reference,
          action: action.status === "overdue" ? "Request response" : "Follow up",
          responsibleUser: workflow.responsibleUserName,
          dueDate: action.dueDate,
          priority: action.priority,
          href: `/admin/active-engagements/${workflow.id}?tab=overview`,
        })),
      ...workflow.approvals
        .filter((approval) => approval.status === "awaiting_approval")
        .map((approval) => ({
          item: approval.title,
          client: workflow.clientName,
          engagement: workflow.reference,
          action: "Approve",
          responsibleUser: approval.approverName || workflow.responsibleUserName,
          dueDate: workflow.dueDate,
          priority: "high" as const,
          href: `/admin/active-engagements/${workflow.id}?tab=tasks`,
        })),
    ])
    .slice(0, 8);
  const stageKeys = [
    ["intake", "Intake"],
    ["kyc", "KYC"],
    ["letter", "Engagement Letter"],
    ["active_work", "Active Work"],
    ["client_review", "Client Review"],
    ["finance", "Finance"],
    ["completion", "Completion"],
    ["archive", "Archive"],
  ] as const;
  const pipeline = stageKeys.map(([key, label]) => {
    const stageWorkflows = workflows.filter((workflow) => workflow.currentStageKey === key);

    return {
      key,
      label,
      count: stageWorkflows.length,
      overdue: stageWorkflows.filter((workflow) => workflow.progress.overdueItems > 0).length,
      risk: stageWorkflows.filter((workflow) => workflow.riskLevel === "high" || workflow.riskLevel === "critical").length,
    };
  });
  const workloadMap = new Map<
    string,
    { activeEngagements: Set<string>; openTasks: number; overdueTasks: number; workloadLevel: "available" | "balanced" | "high" | "overloaded" }
  >();

  for (const workflow of workflows) {
    for (const member of workflow.team) {
      const current = workloadMap.get(member.name) ?? {
        activeEngagements: new Set<string>(),
        openTasks: 0,
        overdueTasks: 0,
        workloadLevel: member.workloadLevel,
      };

      current.activeEngagements.add(workflow.id);
      current.openTasks += workflow.tasks.filter(
        (task) => task.assignedUserName === member.name && task.status !== "completed" && task.status !== "cancelled",
      ).length;
      current.overdueTasks += workflow.tasks.filter(
        (task) =>
          task.assignedUserName === member.name &&
          task.dueDate &&
          new Date(task.dueDate).getTime() < Date.now() &&
          task.status !== "completed",
      ).length;
      current.workloadLevel = member.workloadLevel;
      workloadMap.set(member.name, current);
    }
  }
  const recentActivity = workflows
    .flatMap((workflow) => workflow.activity)
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, 10);

  return {
    summary: [
      {
        label: "Active Workflows",
        value: String(workflows.filter((workflow) => workflow.status === "active").length),
        helper: "Live workflows currently moving through the engagement lifecycle.",
        href: "/admin/workflows",
      },
      {
        label: "Workflows at Risk",
        value: String(workflows.filter((workflow) => workflow.riskLevel === "high" || workflow.riskLevel === "critical").length),
        helper: "High-risk or critical workflows requiring attention.",
        href: "/admin/workflows",
      },
      {
        label: "Overdue Tasks",
        value: String(overdueWork.length),
        helper: "Tasks past due across active workflow instances.",
        href: "/admin/tasks",
      },
      {
        label: "Pending Approvals",
        value: String(workflows.reduce((total, workflow) => total + workflow.progress.pendingApprovals, 0)),
        helper: "Approval gates waiting for authorized reviewers.",
        href: "/admin/workflows",
      },
      {
        label: "Waiting for Client",
        value: String(workflows.filter((workflow) => workflow.currentStageKey === "client_review" || workflow.progress.totalClientActions > workflow.progress.completedClientActions).length),
        helper: "Workflows with pending client actions.",
        href: "/admin/workflows",
      },
      {
        label: "Waiting for Staff",
        value: String(workflows.filter((workflow) => workflow.tasks.some((task) => task.status === "waiting_for_staff" || task.status === "ready")).length),
        helper: "Workflows waiting on staff action.",
        href: "/admin/workflows",
      },
    ],
    pipeline,
    actionRequired,
    overdueWork,
    staffWorkload: [...workloadMap.entries()].map(([consultant, item]) => ({
      consultant,
      activeEngagements: item.activeEngagements.size,
      openTasks: item.openTasks,
      overdueTasks: item.overdueTasks,
      workloadLevel: item.workloadLevel,
    })),
    recentActivity,
    workflows,
  };
}

export async function listWorkflowTasksForPrincipal(principal: Principal) {
  const workflows = await listWorkflowsForPrincipal(principal);
  const roleAssignments = new Set<string>(principal.roleKeys);
  if (principal.roleKeys.includes("consultant")) roleAssignments.add("lead_consultant");
  const canSeeEveryTask = isAdmin(principal);
  const engagementBasePath = canSeeEveryTask ? "/admin/active-engagements" : "/staff/engagements";

  return workflows.flatMap((workflow) =>
    workflow.tasks
      .filter((task) => canSeeEveryTask || task.assignedUserId === principal.id || roleAssignments.has(task.assignedRole))
      .map((task) => ({
      ...task,
      assignedUserName: task.assignedRole === "finance_officer" && principal.roleKeys.includes("finance_officer") && task.assignedUserId !== principal.id
        ? "Finance queue"
        : task.assignedUserName,
      workflowId: workflow.id,
      engagement: workflow.reference,
      client: workflow.clientName,
      service: workflow.serviceName,
      href: `${engagementBasePath}/${workflow.id}?tab=tasks`,
      })),
  );
}

export function canOverrideWorkflowTransition(principal: Principal) {
  return hasPermission(principal, "permissions.manage") || hasPermission(principal, "settings.manage");
}

export { calculateProgress };
