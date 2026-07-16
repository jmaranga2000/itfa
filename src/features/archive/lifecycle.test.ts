import { describe, expect, it } from "vitest";
import {
  calculateRetentionExpiry,
  canRestoreArchiveRecord,
  isArchiveReadOnly,
  isRetentionExpired,
  isRetentionNearExpiry,
  validateEngagementArchiveEligibility,
  validatePermanentDeletion,
} from "@/features/archive/lifecycle";

describe("archive eligibility", () => {
  it("requires every engagement archival checklist item", () => {
    const report = validateEngagementArchiveEligibility({
      status: "completed",
      mandatoryTasksCompleted: true,
      finalDeliverablesUploaded: true,
      engagementLetterAvailable: true,
      clientActionsResolved: true,
      internalApprovalsCompleted: true,
      invoicesIssued: true,
      paymentStatusReviewed: true,
      outstandingEscalationsResolved: true,
      completionNotesAdded: false,
      archiveReasonProvided: true,
      retentionPolicySelected: true,
    });

    expect(report.eligible).toBe(false);
    expect(report.blockers).toContain("Completion notes added");
  });

  it("allows a completed engagement with all checklist items satisfied", () => {
    const report = validateEngagementArchiveEligibility({
      status: "completed",
      mandatoryTasksCompleted: true,
      finalDeliverablesUploaded: true,
      engagementLetterAvailable: true,
      clientActionsResolved: true,
      internalApprovalsCompleted: true,
      invoicesIssued: true,
      paymentStatusReviewed: true,
      outstandingEscalationsResolved: true,
      completionNotesAdded: true,
      archiveReasonProvided: true,
      retentionPolicySelected: true,
    });

    expect(report.eligible).toBe(true);
    expect(report.blockers).toEqual([]);
  });
});

describe("retention and restore rules", () => {
  it("calculates retention expiry from the configured policy duration", () => {
    const expiry = calculateRetentionExpiry(new Date("2026-07-15T00:00:00.000Z"), 12);

    expect(expiry.getFullYear()).toBe(2027);
    expect(expiry.getMonth()).toBe(6);
  });

  it("detects records nearing expiry", () => {
    const now = new Date("2026-07-15T00:00:00.000Z");

    expect(isRetentionNearExpiry("2026-08-10T00:00:00.000Z", [90, 30, 7], now)).toBe(true);
    expect(isRetentionExpired("2026-07-01T00:00:00.000Z", now)).toBe(true);
  });

  it("keeps archived records read-only and restore eligible", () => {
    expect(isArchiveReadOnly("archived")).toBe(true);
    expect(canRestoreArchiveRecord("archived")).toBe(true);
    expect(canRestoreArchiveRecord("permanently_deleted")).toBe(false);
  });
});

describe("permanent deletion controls", () => {
  it("blocks deletion when a legal hold is active", () => {
    const result = validatePermanentDeletion({
      archiveStatus: "retention_expired",
      retentionExpiryDate: "2026-07-01T00:00:00.000Z",
      legalHoldStatus: "active",
      hasActiveEngagementDependency: false,
      hasUnresolvedFinancialDependency: false,
      approvalRecorded: true,
      deletionReasonProvided: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.blockers).toContain("Active legal hold blocks permanent deletion.");
  });

  it("allows deletion only after expiry, approval and reason", () => {
    const result = validatePermanentDeletion({
      archiveStatus: "retention_expired",
      retentionExpiryDate: "2020-01-01T00:00:00.000Z",
      legalHoldStatus: "released",
      hasActiveEngagementDependency: false,
      hasUnresolvedFinancialDependency: false,
      approvalRecorded: true,
      deletionReasonProvided: true,
    });

    expect(result.allowed).toBe(true);
  });
});
