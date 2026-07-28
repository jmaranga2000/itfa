import { describe, expect, it } from "vitest";
import {
  canArchiveEngagementWorkflow,
  getEngagementArchiveLinkedState,
  getEngagementArchiveReason,
} from "./engagement-archive-utils";

describe("engagement archive helpers", () => {
  it("allows active and completed engagements to be archived", () => {
    expect(canArchiveEngagementWorkflow("active")).toBe(true);
    expect(canArchiveEngagementWorkflow("completed")).toBe(true);
    expect(canArchiveEngagementWorkflow("archived")).toBe(false);
    expect(canArchiveEngagementWorkflow("request")).toBe(false);
  });

  it("returns a reason that reflects whether the archive came from active or completed work", () => {
    expect(getEngagementArchiveReason("active")).toContain("active execution workspace");
    expect(getEngagementArchiveReason("completed")).toContain("completed");
  });

  it("reads the exact linked records and original states from an archive snapshot", () => {
    expect(getEngagementArchiveLinkedState({
      linkedState: {
        documents: [{ id: "document-1", status: "approved" }],
        conversations: [{ id: "conversation-1", status: "open", closedAt: null }],
        payments: ["payment-1"],
        requests: ["request-1"],
        quotations: ["quotation-1"],
        staffNotes: ["note-1"],
        notifications: ["notification-1"],
        engagementLetters: ["letter-1"],
        requestAssignments: ["assignment-1"],
      },
    })).toEqual({
      documents: [{ id: "document-1", status: "approved" }],
      conversations: [{ id: "conversation-1", status: "open", closedAt: null }],
      payments: ["payment-1"],
      requests: ["request-1"],
      quotations: ["quotation-1"],
      staffNotes: ["note-1"],
      notifications: ["notification-1"],
      engagementLetters: ["letter-1"],
      requestAssignments: ["assignment-1"],
    });
  });

  it("uses the legacy restoration path when an archive has no linked-state manifest", () => {
    expect(getEngagementArchiveLinkedState({ documents: [] })).toBeNull();
    expect(getEngagementArchiveLinkedState(null)).toBeNull();
  });
});
