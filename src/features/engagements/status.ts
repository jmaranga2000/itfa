export const ENGAGEMENT_REQUEST_STATUSES = [
  "draft",
  "submitted",
  "awaiting_admin_review",
  "clarification_requested",
  "scope_revision_pending",
  "accepted",
  "rejected",
  "cancelled",
] as const;

export const ENGAGEMENT_STATUSES = [
  "awaiting_kyc",
  "kyc_in_progress",
  "kyc_pending_review",
  "kyc_changes_requested",
  "kyc_approved",
  "engagement_letter_pending",
  "engagement_letter_generated",
  "awaiting_client_signature",
  "signature_changes_requested",
  "ready_to_start",
  "active",
  "on_hold",
  "awaiting_client_action",
  "awaiting_staff_action",
  "completed",
  "archived",
  "cancelled",
] as const;

export type EngagementRequestStatus = (typeof ENGAGEMENT_REQUEST_STATUSES)[number];
export type EngagementStatus = (typeof ENGAGEMENT_STATUSES)[number];

export type WorkflowPrerequisites = {
  assignedStaff?: boolean;
  kycSubmitted?: boolean;
  kycApproved?: boolean;
  mandatoryDocumentsApproved?: boolean;
  engagementLetterGenerated?: boolean;
  clientSignatureCompleted?: boolean;
  requiredTasksCompleted?: boolean;
  finalDeliverablesAccepted?: boolean;
  archiveGracePeriodElapsed?: boolean;
};
