import type {
  ArchiveRecordType,
  ArchiveStatus,
  LegalHoldStatus,
  RetentionTrigger,
} from "@/features/archive/types";

export type ArchiveEligibilityInput = {
  status: string;
  mandatoryTasksCompleted: boolean;
  finalDeliverablesUploaded: boolean;
  engagementLetterAvailable: boolean;
  clientActionsResolved: boolean;
  internalApprovalsCompleted: boolean;
  invoicesIssued: boolean;
  paymentStatusReviewed: boolean;
  outstandingEscalationsResolved: boolean;
  completionNotesAdded: boolean;
  archiveReasonProvided: boolean;
  retentionPolicySelected: boolean;
};

export type ArchiveEligibilityReport = {
  eligible: boolean;
  checklist: Array<{ key: keyof ArchiveEligibilityInput; label: string; completed: boolean }>;
  blockers: string[];
};

export type RetentionPolicyInput = {
  recordType: ArchiveRecordType;
  retentionPeriodMonths: number;
  warningDays: number[];
  retentionStartTrigger: RetentionTrigger;
  restoreEligible: boolean;
  deletionEligible: boolean;
  approvalRequired: boolean;
  legalHoldBehavior: "suspend_expiry" | "continue_expiry_block_deletion";
};

export type ArchiveDeletionInput = {
  archiveStatus: ArchiveStatus;
  retentionExpiryDate?: Date | string | null;
  legalHoldStatus?: LegalHoldStatus | null;
  hasActiveEngagementDependency: boolean;
  hasUnresolvedFinancialDependency: boolean;
  approvalRecorded: boolean;
  deletionReasonProvided: boolean;
};

const DAY = 86_400_000;

const engagementChecklist: Array<{ key: keyof ArchiveEligibilityInput; label: string }> = [
  { key: "mandatoryTasksCompleted", label: "Mandatory tasks completed" },
  { key: "finalDeliverablesUploaded", label: "Final deliverables uploaded" },
  { key: "engagementLetterAvailable", label: "Engagement letter available" },
  { key: "clientActionsResolved", label: "Client actions resolved" },
  { key: "internalApprovalsCompleted", label: "Internal approvals completed" },
  { key: "invoicesIssued", label: "Invoices issued" },
  { key: "paymentStatusReviewed", label: "Payment status reviewed" },
  { key: "outstandingEscalationsResolved", label: "Outstanding escalations resolved" },
  { key: "completionNotesAdded", label: "Completion notes added" },
  { key: "archiveReasonProvided", label: "Archive reason provided" },
  { key: "retentionPolicySelected", label: "Retention policy selected" },
];

export function validateEngagementArchiveEligibility(
  input: ArchiveEligibilityInput,
): ArchiveEligibilityReport {
  const checklist = engagementChecklist.map((item) => ({
    ...item,
    completed: Boolean(input[item.key]),
  }));
  const blockers = checklist.filter((item) => !item.completed).map((item) => item.label);

  if (!["completed", "read_only", "archived"].includes(input.status)) {
    blockers.unshift("Engagement must be completed or in read-only grace period");
  }

  return {
    eligible: blockers.length === 0,
    checklist,
    blockers,
  };
}

export function calculateRetentionExpiry(startDate: Date, retentionPeriodMonths: number) {
  return new Date(
    startDate.getFullYear(),
    startDate.getMonth() + retentionPeriodMonths,
    startDate.getDate(),
    startDate.getHours(),
    startDate.getMinutes(),
    startDate.getSeconds(),
    startDate.getMilliseconds(),
  );
}

export function daysUntilRetentionExpiry(
  retentionExpiryDate: Date | string | null | undefined,
  now = new Date(),
) {
  if (!retentionExpiryDate) {
    return null;
  }

  return Math.ceil((new Date(retentionExpiryDate).getTime() - now.getTime()) / DAY);
}

export function isRetentionExpired(retentionExpiryDate: Date | string | null | undefined, now = new Date()) {
  const days = daysUntilRetentionExpiry(retentionExpiryDate, now);
  return days !== null && days <= 0;
}

export function isRetentionNearExpiry(
  retentionExpiryDate: Date | string | null | undefined,
  warningDays: number[],
  now = new Date(),
) {
  const days = daysUntilRetentionExpiry(retentionExpiryDate, now);

  if (days === null || days < 0) {
    return false;
  }

  return warningDays.some((warning) => days <= warning);
}

export function isArchiveReadOnly(status: ArchiveStatus) {
  return [
    "archived",
    "read_only",
    "legal_hold",
    "restore_requested",
    "retention_expired",
    "pending_deletion",
    "permanently_deleted",
  ].includes(status);
}

export function canRestoreArchiveRecord(status: ArchiveStatus) {
  return ["archived", "read_only", "legal_hold", "restore_requested", "retention_expired"].includes(
    status,
  );
}

export function validatePermanentDeletion(input: ArchiveDeletionInput) {
  const blockers: string[] = [];

  if (!["retention_expired", "pending_deletion"].includes(input.archiveStatus)) {
    blockers.push("Retention must be expired or deletion must be pending.");
  }

  if (!isRetentionExpired(input.retentionExpiryDate)) {
    blockers.push("Retention period has not expired.");
  }

  if (input.legalHoldStatus && input.legalHoldStatus !== "released") {
    blockers.push("Active legal hold blocks permanent deletion.");
  }

  if (input.hasActiveEngagementDependency) {
    blockers.push("Active engagement dependency blocks deletion.");
  }

  if (input.hasUnresolvedFinancialDependency) {
    blockers.push("Unresolved financial dependency blocks deletion.");
  }

  if (!input.approvalRecorded) {
    blockers.push("Required deletion approval is missing.");
  }

  if (!input.deletionReasonProvided) {
    blockers.push("Deletion reason is required.");
  }

  return {
    allowed: blockers.length === 0,
    blockers,
  };
}
