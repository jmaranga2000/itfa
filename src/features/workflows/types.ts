export const WORKFLOW_TEMPLATE_STATUSES = ["draft", "review", "published", "archived"] as const;

export type WorkflowTemplateStatus = (typeof WORKFLOW_TEMPLATE_STATUSES)[number];

export const WORKFLOW_INSTANCE_STATUSES = [
  "request",
  "active",
  "on_hold",
  "completed",
  "read_only",
  "archived",
] as const;

export type WorkflowInstanceStatus = (typeof WORKFLOW_INSTANCE_STATUSES)[number];

export const WORKFLOW_STAGE_STATUSES = [
  "not_started",
  "ready",
  "in_progress",
  "waiting_for_client",
  "waiting_for_staff",
  "waiting_for_approval",
  "blocked",
  "completed",
  "skipped",
] as const;

export type WorkflowStageStatus = (typeof WORKFLOW_STAGE_STATUSES)[number];

export const WORKFLOW_TASK_STATUSES = [
  "not_started",
  "ready",
  "in_progress",
  "waiting_for_client",
  "waiting_for_staff",
  "waiting_for_approval",
  "blocked",
  "completed",
  "cancelled",
  "overdue",
] as const;

export type WorkflowTaskStatus = (typeof WORKFLOW_TASK_STATUSES)[number];

export const WORKFLOW_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export type WorkflowPriority = (typeof WORKFLOW_PRIORITIES)[number];

export const WORKFLOW_RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

export type WorkflowRiskLevel = (typeof WORKFLOW_RISK_LEVELS)[number];

export const APPROVAL_STATUSES = [
  "not_submitted",
  "awaiting_approval",
  "approved",
  "rejected",
  "changes_requested",
] as const;

export type WorkflowApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const CLIENT_ACTION_STATUSES = [
  "pending",
  "in_progress",
  "submitted",
  "approved",
  "changes_requested",
  "completed",
  "overdue",
] as const;

export type ClientActionStatus = (typeof CLIENT_ACTION_STATUSES)[number];

export const DOCUMENT_WORKFLOW_STATUSES = [
  "uploaded",
  "pending_review",
  "approved",
  "rejected",
  "replacement_requested",
  "superseded",
  "final",
  "archived",
] as const;

export type DocumentWorkflowStatus = (typeof DOCUMENT_WORKFLOW_STATUSES)[number];

export const INVOICE_WORKFLOW_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "void",
  "refunded",
] as const;

export type InvoiceWorkflowStatus = (typeof INVOICE_WORKFLOW_STATUSES)[number];

export const PAYMENT_WORKFLOW_STATUSES = [
  "pending",
  "verified",
  "partially_allocated",
  "allocated",
  "reconciled",
  "failed",
  "refunded",
] as const;

export type PaymentWorkflowStatus = (typeof PAYMENT_WORKFLOW_STATUSES)[number];

export const WORKFLOW_ACTIVITY_TYPES = [
  "workflow_created",
  "engagement_letter_sent",
  "engagement_letter_signed",
  "engagement_activated",
  "team_assigned",
  "internal_note_added",
  "stage_changed",
  "task_assigned",
  "task_reassigned",
  "due_date_changed",
  "task_completed",
  "task_created",
  "work_submitted_for_review",
  "review_approved",
  "changes_requested",
  "approval_submitted",
  "approval_decision",
  "client_action_requested",
  "client_response_received",
  "document_uploaded",
  "message_received",
  "message_sent",
  "invoice_issued",
  "payment_recorded",
  "engagement_on_hold",
  "engagement_completed",
  "workflow_archived",
  "template_published",
] as const;

export type WorkflowActivityType = (typeof WORKFLOW_ACTIVITY_TYPES)[number];

export type WorkflowRole =
  | "admin"
  | "engagement_manager"
  | "lead_consultant"
  | "consultant"
  | "reviewer"
  | "finance_officer"
  | "document_controller"
  | "client";

export type WorkflowTransitionResult = {
  allowed: boolean;
  reasons: string[];
  warnings: string[];
  nextStageKey?: string;
};
