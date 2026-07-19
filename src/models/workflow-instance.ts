import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  APPROVAL_STATUSES,
  CLIENT_ACTION_STATUSES,
  DOCUMENT_WORKFLOW_STATUSES,
  INVOICE_WORKFLOW_STATUSES,
  PAYMENT_WORKFLOW_STATUSES,
  WORKFLOW_ACTIVITY_TYPES,
  WORKFLOW_INSTANCE_STATUSES,
  WORKFLOW_PRIORITIES,
  WORKFLOW_RISK_LEVELS,
  WORKFLOW_STAGE_STATUSES,
  WORKFLOW_TASK_STATUSES,
} from "@/features/workflows/types";

const workflowTeamMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, default: null, index: true },
    name: { type: String, required: true },
    email: { type: String, default: "" },
    role: { type: String, required: true },
    department: { type: String, default: "Consulting" },
    workloadLevel: {
      type: String,
      enum: ["available", "balanced", "high", "overloaded"],
      default: "available",
    },
  },
  { _id: false },
);

const workflowStageInstanceSchema = new Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    internalDescription: { type: String, default: "" },
    clientTitle: { type: String, required: true },
    order: { type: Number, required: true },
    expectedDurationDays: { type: Number, default: 3 },
    responsibleRole: { type: String, required: true },
    status: { type: String, enum: WORKFLOW_STAGE_STATUSES, default: "not_started" },
    entryConditions: { type: [String], default: [] },
    completionConditions: { type: [String], default: [] },
    requiredDocuments: { type: [String], default: [] },
    approvalRequired: { type: Boolean, default: false },
    clientVisible: { type: Boolean, default: true },
    enteredAt: { type: Date, default: null },
    dueAt: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null },
    blockedReason: { type: String, default: null },
  },
  { _id: false },
);

const workflowTaskInstanceSchema = new Schema(
  {
    key: { type: String, required: true },
    stageKey: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    assignedUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    assignedUserName: { type: String, default: "" },
    assignedRole: { type: String, required: true },
    priority: { type: String, enum: WORKFLOW_PRIORITIES, default: "medium", index: true },
    status: { type: String, enum: WORKFLOW_TASK_STATUSES, default: "not_started", index: true },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null, index: true },
    estimatedHours: { type: Number, default: null },
    dependencies: { type: [String], default: [] },
    checklist: {
      type: [
        {
          label: { type: String, required: true },
          completed: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    requiredDocuments: { type: [String], default: [] },
    clientVisible: { type: Boolean, default: false },
    clientActionRequired: { type: Boolean, default: false },
    internalNotes: { type: String, default: "" },
    completionNotes: { type: String, default: "" },
    createdByUserId: { type: Schema.Types.ObjectId, default: null },
    reviewHistory: {
      type: [
        {
          decision: { type: String, enum: ["approved", "changes_requested"], required: true },
          comments: { type: String, required: true },
          reviewerUserId: { type: Schema.Types.ObjectId, required: true },
          reviewerName: { type: String, required: true },
          reviewedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    approvalRequired: { type: Boolean, default: false },
    completedByUserId: { type: Schema.Types.ObjectId, default: null },
    completedAt: { type: Date, default: null },
    blockerReason: { type: String, default: null },
  },
  { _id: false },
);

const workflowMilestoneSchema = new Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    status: { type: String, enum: ["pending", "completed", "blocked"], default: "pending" },
    date: { type: Date, default: null },
    responsibleUserId: { type: Schema.Types.ObjectId, default: null },
    relatedTaskKeys: { type: [String], default: [] },
    relatedDocumentIds: { type: [String], default: [] },
    clientVisible: { type: Boolean, default: true },
  },
  { _id: false },
);

const workflowApprovalSchema = new Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    stageKey: { type: String, required: true, index: true },
    status: { type: String, enum: APPROVAL_STATUSES, default: "not_submitted", index: true },
    submittedByUserId: { type: Schema.Types.ObjectId, default: null },
    submittedAt: { type: Date, default: null },
    approverUserId: { type: Schema.Types.ObjectId, default: null },
    approverName: { type: String, default: "" },
    approvalDate: { type: Date, default: null },
    decision: { type: String, default: "" },
    reason: { type: String, default: "" },
    comments: { type: String, default: "" },
    previousVersion: { type: String, default: "" },
    approvedVersion: { type: String, default: "" },
  },
  { _id: false },
);

const workflowClientActionSchema = new Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    instructions: { type: String, required: true },
    dueDate: { type: Date, default: null, index: true },
    relatedTaskKey: { type: String, default: null },
    requiredDocumentType: { type: String, default: null },
    priority: { type: String, enum: WORKFLOW_PRIORITIES, default: "medium" },
    assignedClientUserId: { type: Schema.Types.ObjectId, default: null },
    status: { type: String, enum: CLIENT_ACTION_STATUSES, default: "pending", index: true },
    response: { type: String, default: "" },
    respondedAt: { type: Date, default: null },
  },
  { _id: false },
);

const workflowDocumentSchema = new Schema(
  {
    documentId: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: DOCUMENT_WORKFLOW_STATUSES, default: "uploaded" },
    version: { type: Number, default: 1 },
    visibility: {
      type: String,
      enum: ["client", "staff", "admin", "finance", "all"],
      default: "staff",
    },
    reviewerComments: { type: String, default: "" },
    clientFeedback: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const workflowActivitySchema = new Schema(
  {
    type: { type: String, enum: WORKFLOW_ACTIVITY_TYPES, required: true },
    title: { type: String, required: true },
    actorName: { type: String, default: "System" },
    actorUserId: { type: Schema.Types.ObjectId, default: null },
    description: { type: String, default: "" },
    relatedResource: { type: String, default: "" },
    clientVisible: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const workflowInternalNoteSchema = new Schema(
  {
    body: { type: String, required: true, trim: true },
    createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    createdByName: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const workflowFinancialStateSchema = new Schema(
  {
    invoiceStatus: { type: String, enum: INVOICE_WORKFLOW_STATUSES, default: "draft" },
    paymentStatus: { type: String, enum: PAYMENT_WORKFLOW_STATUSES, default: "pending" },
    balanceDue: { type: Number, default: 0 },
    currency: { type: String, default: "KES" },
    adjustmentReasonRequired: { type: Boolean, default: false },
    invoices: {
      type: [
        {
          invoiceId: { type: String, required: true },
          invoiceNumber: { type: String, required: true },
          issueDate: { type: Date, required: true },
          dueDate: { type: Date, required: true },
          amount: { type: Number, required: true, min: 0 },
          currency: { type: String, required: true, default: "KES" },
          status: { type: String, enum: INVOICE_WORKFLOW_STATUSES, default: "draft" },
          notes: { type: String, default: "" },
          createdByUserId: { type: Schema.Types.ObjectId, default: null },
          createdByName: { type: String, default: "" },
          sentAt: { type: Date, default: null },
        },
      ],
      default: [],
    },
  },
  { _id: false },
);

const workflowCompletionSchema = new Schema(
  {
    notes: { type: String, default: "" },
    summary: { type: String, default: "" },
    completedAt: { type: Date, default: null },
    completedByUserId: { type: Schema.Types.ObjectId, default: null },
    completedByName: { type: String, default: "" },
    archivedAt: { type: Date, default: null },
    archivedByUserId: { type: Schema.Types.ObjectId, default: null },
    archivedByName: { type: String, default: "" },
  },
  { _id: false },
);

const workflowArchiveStateSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["not_ready", "grace_period", "read_only", "archived", "legal_hold"],
      default: "not_ready",
      index: true,
    },
    retentionUntil: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    legalHoldReason: { type: String, default: "" },
  },
  { _id: false },
);

const workflowInstanceSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    clientName: { type: String, required: true, index: true },
    clientUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    organizationName: { type: String, default: "" },
    organizationId: { type: Schema.Types.ObjectId, default: null, index: true },
    engagementId: { type: Schema.Types.ObjectId, default: null, index: true },
    sourceRequestId: { type: Schema.Types.ObjectId, default: null, index: true },
    engagementLetterId: { type: Schema.Types.ObjectId, default: null, index: true },
    serviceName: { type: String, required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, required: true, index: true },
    templateName: { type: String, required: true },
    templateVersion: { type: Number, required: true },
    templateSnapshot: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: WORKFLOW_INSTANCE_STATUSES, default: "active", index: true },
    currentStageKey: { type: String, required: true, index: true },
    riskLevel: { type: String, enum: WORKFLOW_RISK_LEVELS, default: "low", index: true },
    riskReason: { type: String, default: "" },
    nextAction: { type: String, required: true },
    responsibleUserName: { type: String, default: "" },
    responsibleUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    startDate: { type: Date, default: Date.now },
    activatedAt: { type: Date, default: null, index: true },
    signedAt: { type: Date, default: null },
    signedByUserId: { type: Schema.Types.ObjectId, default: null },
    signedByName: { type: String, default: "" },
    teamAssignedAt: { type: Date, default: null, index: true },
    dueDate: { type: Date, default: null, index: true },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    team: { type: [workflowTeamMemberSchema], default: [] },
    stages: { type: [workflowStageInstanceSchema], default: [] },
    tasks: { type: [workflowTaskInstanceSchema], default: [] },
    milestones: { type: [workflowMilestoneSchema], default: [] },
    approvals: { type: [workflowApprovalSchema], default: [] },
    clientActions: { type: [workflowClientActionSchema], default: [] },
    documents: { type: [workflowDocumentSchema], default: [] },
    financial: { type: workflowFinancialStateSchema, default: () => ({}) },
    completionChecklist: {
      type: [
        {
          label: { type: String, required: true },
          completed: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    completion: { type: workflowCompletionSchema, default: () => ({}) },
    archive: { type: workflowArchiveStateSchema, default: () => ({}) },
    activity: { type: [workflowActivitySchema], default: [] },
    internalNotes: { type: [workflowInternalNoteSchema], default: [] },
    archivedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "workflow_instances",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

workflowInstanceSchema.index({ currentStageKey: 1, status: 1 });
workflowInstanceSchema.index({ "tasks.assignedUserId": 1, "tasks.status": 1 });
workflowInstanceSchema.index({ "clientActions.assignedClientUserId": 1, "clientActions.status": 1 });

export type WorkflowInstanceDocument = InferSchemaType<typeof workflowInstanceSchema>;

export const WorkflowInstanceModel =
  (mongoose.models.WorkflowInstance as Model<WorkflowInstanceDocument> | undefined) ??
  mongoose.model<WorkflowInstanceDocument>("WorkflowInstance", workflowInstanceSchema);
