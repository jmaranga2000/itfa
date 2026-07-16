import type { Permission } from "@/features/authorization/permissions";

export const KYC_STATUSES = [
  "not_started",
  "in_progress",
  "submitted",
  "pending_review",
  "under_review",
  "changes_requested",
  "resubmitted",
  "approved",
  "rejected",
  "escalated",
  "expired",
  "cancelled",
] as const;

export type KycStatus = (typeof KYC_STATUSES)[number];

export const KYC_REQUIREMENT_STATUSES = [
  "not_submitted",
  "submitted",
  "under_review",
  "approved",
  "replacement_requested",
  "rejected",
  "expired",
  "escalated",
  "not_applicable",
] as const;

export type KycRequirementStatus = (typeof KYC_REQUIREMENT_STATUSES)[number];

export const KYC_RISK_LEVELS = ["low", "standard", "elevated", "high"] as const;

export type KycRiskLevel = (typeof KYC_RISK_LEVELS)[number];

export const KYC_CLIENT_TYPES = [
  "individual",
  "corporate",
  "returning",
  "client_representative",
] as const;

export type KycClientType = (typeof KYC_CLIENT_TYPES)[number];

export type KycRequirementSection =
  | "Client Identity"
  | "Company Information"
  | "Directors"
  | "Beneficial Ownership"
  | "Tax Information"
  | "Address Verification"
  | "Authorization"
  | "Declarations"
  | "Supporting Documents";

export type KycDocumentIssue =
  | "Missing Document"
  | "Expired"
  | "Replacement Required"
  | "Unclear Copy"
  | "Name Mismatch"
  | "Registration Mismatch"
  | "Unsupported Format"
  | "Duplicate File"
  | "Review Pending";

export type KycReviewerRule = {
  role: string;
  canReview: string;
  assignmentRule: string;
  warning?: string;
};

export const KYC_PERMISSION_MATRIX: Array<{
  label: string;
  permission: Permission;
  description: string;
}> = [
  {
    label: "View KYC Queue",
    permission: "kyc.read",
    description: "View KYC queue, saved views and non-sensitive review status.",
  },
  {
    label: "Start Review",
    permission: "kyc.review",
    description: "Open assigned submissions and make requirement-level review decisions.",
  },
  {
    label: "Approve KYC",
    permission: "kyc.approve",
    description: "Approve full KYC once all mandatory checks are complete.",
  },
  {
    label: "Assign Reviewer",
    permission: "kyc.assign",
    description: "Assign or reassign reviewers and review workload warnings.",
  },
  {
    label: "Risk Review",
    permission: "kyc.view_risk",
    description: "View and change internal risk classification and senior-review flags.",
  },
  {
    label: "Escalate KYC",
    permission: "kyc.escalate",
    description: "Create and resolve internal KYC escalations.",
  },
  {
    label: "Manage KYC Templates",
    permission: "kyc.manage_templates",
    description: "Maintain service-specific KYC templates and requirement rules.",
  },
];

export const KYC_REVIEWER_RULES: KycReviewerRule[] = [
  {
    role: "Compliance reviewer",
    canReview: "Assigned individual and corporate submissions",
    assignmentRule: "Default reviewer for pending and resubmitted KYC.",
  },
  {
    role: "Senior reviewer",
    canReview: "High-risk, escalated and senior-approval submissions",
    assignmentRule: "Required when risk is high or beneficial ownership is unclear.",
  },
  {
    role: "Engagement manager",
    canReview: "Assigned engagement status and client-action blockers",
    assignmentRule: "May not approve high-risk KYC without senior review.",
  },
  {
    role: "Administrator",
    canReview: "All permitted KYC records and reviewer workload",
    assignmentRule: "Can reassign reviewers and manage templates.",
    warning: "Warn when assigning to an overloaded or conflicted reviewer.",
  },
];

export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  pending_review: "Pending Review",
  under_review: "Under Review",
  changes_requested: "Changes Requested",
  resubmitted: "Resubmitted",
  approved: "Approved",
  rejected: "Rejected",
  escalated: "Escalated",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const KYC_REQUIREMENT_STATUS_LABELS: Record<KycRequirementStatus, string> = {
  not_submitted: "Not Submitted",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  replacement_requested: "Replacement Requested",
  rejected: "Rejected",
  expired: "Expired",
  escalated: "Escalated",
  not_applicable: "Not Applicable",
};

export const KYC_RISK_LABELS: Record<KycRiskLevel, string> = {
  low: "Low",
  standard: "Standard",
  elevated: "Elevated",
  high: "High",
};

export const KYC_CLIENT_TYPE_LABELS: Record<KycClientType, string> = {
  individual: "Individual Client",
  corporate: "Corporate Client",
  returning: "Returning Client",
  client_representative: "Client Representative",
};
