import type { Permission } from "@/features/authorization/permissions";

export const ARCHIVE_RECORD_TYPES = [
  "client",
  "client_organization",
  "engagement",
  "workflow",
  "task",
  "milestone",
  "kyc_record",
  "document",
  "engagement_letter",
  "message",
  "invoice",
  "payment",
  "ai_draft",
  "template",
  "notification",
  "staff_record",
  "audit_record",
] as const;

export type ArchiveRecordType = (typeof ARCHIVE_RECORD_TYPES)[number];

export const ARCHIVE_CATEGORIES = [
  "overview",
  "clients",
  "engagements",
  "documents",
  "kyc_records",
  "messages",
  "finance_records",
  "templates",
  "staff_records",
  "legal_holds",
  "retention_management",
  "restore_requests",
  "pending_deletion",
] as const;

export type ArchiveCategory = (typeof ARCHIVE_CATEGORIES)[number];

export const ARCHIVE_STATUSES = [
  "pending_archive",
  "archived",
  "read_only",
  "legal_hold",
  "restore_requested",
  "restored",
  "retention_expired",
  "pending_deletion",
  "permanently_deleted",
] as const;

export type ArchiveStatus = (typeof ARCHIVE_STATUSES)[number];

export const LEGAL_HOLD_STATUSES = ["active", "under_review", "extended", "released"] as const;

export type LegalHoldStatus = (typeof LEGAL_HOLD_STATUSES)[number];

export const RESTORE_TYPES = [
  "restore_for_viewing",
  "restore_to_active",
  "reopen_engagement",
  "create_new_engagement_from_archive",
  "restore_client_profile",
  "restore_document",
] as const;

export type RestoreType = (typeof RESTORE_TYPES)[number];

export const RESTORE_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
] as const;

export type RestoreRequestStatus = (typeof RESTORE_REQUEST_STATUSES)[number];

export const DELETION_STATUSES = [
  "not_eligible",
  "eligible",
  "deletion_requested",
  "pending_approval",
  "approved",
  "scheduled",
  "completed",
  "cancelled",
] as const;

export type DeletionStatus = (typeof DELETION_STATUSES)[number];

export const RETENTION_TRIGGERS = [
  "engagement_completion_date",
  "client_archive_date",
  "invoice_issue_date",
  "payment_date",
  "document_upload_date",
  "kyc_approval_date",
  "staff_deactivation_date",
  "archive_date",
] as const;

export type RetentionTrigger = (typeof RETENTION_TRIGGERS)[number];

export type ArchiveCategoryMeta = {
  key: ArchiveCategory;
  label: string;
  description: string;
  icon: "archive" | "users" | "briefcase" | "file" | "shield" | "message" | "finance" | "template" | "staff" | "lock" | "clock" | "restore" | "trash";
  recordTypes: ArchiveRecordType[];
  requiredPermission: Permission;
};

export const ARCHIVE_CATEGORY_META: Record<ArchiveCategory, ArchiveCategoryMeta> = {
  overview: {
    key: "overview",
    label: "Overview",
    description: "Archive state, retention alerts, legal holds and restore activity.",
    icon: "archive",
    recordTypes: [...ARCHIVE_RECORD_TYPES],
    requiredPermission: "archive.view_overview",
  },
  clients: {
    key: "clients",
    label: "Clients",
    description: "Archived client profiles, organizations and representatives.",
    icon: "users",
    recordTypes: ["client", "client_organization"],
    requiredPermission: "archive.view_clients",
  },
  engagements: {
    key: "engagements",
    label: "Engagements",
    description: "Completed and archived engagement workspaces.",
    icon: "briefcase",
    recordTypes: ["engagement", "workflow", "task", "milestone", "engagement_letter"],
    requiredPermission: "archive.view_engagements",
  },
  documents: {
    key: "documents",
    label: "Documents",
    description: "Archived documents, versions, review history and download controls.",
    icon: "file",
    recordTypes: ["document", "engagement_letter"],
    requiredPermission: "archive.view_documents",
  },
  kyc_records: {
    key: "kyc_records",
    label: "KYC Records",
    description: "Archived KYC submissions, risk classifications and reviewer decisions.",
    icon: "shield",
    recordTypes: ["kyc_record"],
    requiredPermission: "archive.view_kyc",
  },
  messages: {
    key: "messages",
    label: "Messages",
    description: "Read-only archived conversations and permitted communication history.",
    icon: "message",
    recordTypes: ["message", "notification"],
    requiredPermission: "archive.view_messages",
  },
  finance_records: {
    key: "finance_records",
    label: "Finance Records",
    description: "Archived invoices, payments, receipts, statements and reconciliation history.",
    icon: "finance",
    recordTypes: ["invoice", "payment"],
    requiredPermission: "archive.view_finance",
  },
  templates: {
    key: "templates",
    label: "Templates",
    description: "Retired templates, superseded versions and historical usage.",
    icon: "template",
    recordTypes: ["template"],
    requiredPermission: "archive.view_templates",
  },
  staff_records: {
    key: "staff_records",
    label: "Staff Records",
    description: "Archived staff identity, assignments, approvals and deactivation history.",
    icon: "staff",
    recordTypes: ["staff_record"],
    requiredPermission: "archive.view_staff",
  },
  legal_holds: {
    key: "legal_holds",
    label: "Legal Holds",
    description: "Records protected from deletion for disputes, audits and legal review.",
    icon: "lock",
    recordTypes: [...ARCHIVE_RECORD_TYPES],
    requiredPermission: "archive.apply_legal_hold",
  },
  retention_management: {
    key: "retention_management",
    label: "Retention Management",
    description: "Retention policies, expiry warnings, extensions and covered records.",
    icon: "clock",
    recordTypes: [...ARCHIVE_RECORD_TYPES],
    requiredPermission: "archive.manage_retention",
  },
  restore_requests: {
    key: "restore_requests",
    label: "Restore Requests",
    description: "Controlled restoration requests, approval decisions and restore outcomes.",
    icon: "restore",
    recordTypes: [...ARCHIVE_RECORD_TYPES],
    requiredPermission: "archive.request_restore",
  },
  pending_deletion: {
    key: "pending_deletion",
    label: "Pending Deletion",
    description: "Restricted deletion queue for retention-expired records.",
    icon: "trash",
    recordTypes: [...ARCHIVE_RECORD_TYPES],
    requiredPermission: "archive.request_deletion",
  },
};

export const ARCHIVE_PERMISSION_MATRIX = [
  { label: "View Archive Overview", permission: "archive.view_overview" },
  { label: "View Archived Clients", permission: "archive.view_clients" },
  { label: "View Archived Engagements", permission: "archive.view_engagements" },
  { label: "View Archived Documents", permission: "archive.view_documents" },
  { label: "View Archived KYC", permission: "archive.view_kyc" },
  { label: "View Archived Messages", permission: "archive.view_messages" },
  { label: "View Archived Finance", permission: "archive.view_finance" },
  { label: "View Archived Templates", permission: "archive.view_templates" },
  { label: "View Archived Staff", permission: "archive.view_staff" },
  { label: "Archive Records", permission: "archive.records" },
  { label: "Request Restore", permission: "archive.request_restore" },
  { label: "Approve Restore", permission: "archive.approve_restore" },
  { label: "Restore Records", permission: "archive.restore_records" },
  { label: "Extend Retention", permission: "archive.extend_retention" },
  { label: "Manage Retention Policies", permission: "archive.manage_retention" },
  { label: "Apply Legal Hold", permission: "archive.apply_legal_hold" },
  { label: "Remove Legal Hold", permission: "archive.remove_legal_hold" },
  { label: "Request Deletion", permission: "archive.request_deletion" },
  { label: "Approve Deletion", permission: "archive.approve_deletion" },
  { label: "Permanently Delete", permission: "archive.permanent_delete" },
  { label: "Export Archived Records", permission: "archive.export" },
] as const satisfies ReadonlyArray<{ label: string; permission: Permission }>;

export function getArchiveStatusLabel(status: ArchiveStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getArchiveRecordTypeLabel(recordType: ArchiveRecordType) {
  return recordType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
