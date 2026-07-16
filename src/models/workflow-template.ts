import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  APPROVAL_STATUSES,
  WORKFLOW_PRIORITIES,
  WORKFLOW_TEMPLATE_STATUSES,
} from "@/features/workflows/types";

const workflowTaskTemplateSchema = new Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    assignedRole: { type: String, required: true },
    priority: { type: String, enum: WORKFLOW_PRIORITIES, default: "medium" },
    dueOffsetDays: { type: Number, default: 2 },
    estimatedHours: { type: Number, default: null },
    dependencies: { type: [String], default: [] },
    checklist: { type: [String], default: [] },
    requiredDocuments: { type: [String], default: [] },
    clientVisible: { type: Boolean, default: false },
    approvalRequired: { type: Boolean, default: false },
  },
  { _id: false },
);

const workflowStageTemplateSchema = new Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    internalDescription: { type: String, default: "" },
    clientTitle: { type: String, required: true },
    order: { type: Number, required: true },
    expectedDurationDays: { type: Number, default: 3 },
    responsibleRole: { type: String, required: true },
    entryConditions: { type: [String], default: [] },
    completionConditions: { type: [String], default: [] },
    requiredDocuments: { type: [String], default: [] },
    approvalRequired: { type: Boolean, default: false },
    clientVisible: { type: Boolean, default: true },
    notificationRules: { type: [String], default: [] },
    escalationRules: { type: [String], default: [] },
    tasks: { type: [workflowTaskTemplateSchema], default: [] },
  },
  { _id: false },
);

const workflowApprovalPointSchema = new Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    stageKey: { type: String, required: true },
    approverRole: { type: String, required: true },
    status: { type: String, enum: APPROVAL_STATUSES, default: "not_submitted" },
  },
  { _id: false },
);

const workflowTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    applicableServices: { type: [String], required: true, default: [] },
    version: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: WORKFLOW_TEMPLATE_STATUSES,
      default: "draft",
      index: true,
    },
    stages: { type: [workflowStageTemplateSchema], required: true, default: [] },
    milestones: { type: [String], default: [] },
    approvalPoints: { type: [workflowApprovalPointSchema], default: [] },
    completionConditions: { type: [String], default: [] },
    archiveRules: { type: [String], default: [] },
    notificationRules: { type: [String], default: [] },
    escalationRules: { type: [String], default: [] },
    createdByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    publishedByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "workflow_templates",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

workflowTemplateSchema.index({ name: 1, version: 1 }, { unique: true });
workflowTemplateSchema.index({ status: 1, updatedAt: -1 });

export type WorkflowTemplateDocument = InferSchemaType<typeof workflowTemplateSchema>;

export const WorkflowTemplateModel =
  (mongoose.models.WorkflowTemplate as Model<WorkflowTemplateDocument> | undefined) ??
  mongoose.model<WorkflowTemplateDocument>("WorkflowTemplate", workflowTemplateSchema);
