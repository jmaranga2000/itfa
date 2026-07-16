import { describe, expect, it, vi } from "vitest";
import type { Principal } from "@/features/authorization/access-control";
import {
  canTransitionEngagement,
  transitionEngagementRequestStatus,
  transitionEngagementStatus,
} from "@/features/engagements/transition-service";

const adminPrincipal: Principal = {
  id: "admin_1",
  email: "admin@example.com",
  roleKeys: ["admin"],
  permissions: [
    "engagements.accept",
    "engagements.update_workflow",
    "engagements.complete",
    "engagements.archive",
    "templates.manage",
    "kyc.approve",
  ],
  clientOrganizationIds: [],
  assignedEngagementIds: [],
};

const clientPrincipal: Principal = {
  id: "client_1",
  email: "client@example.com",
  roleKeys: ["client"],
  permissions: ["engagements.create", "documents.upload"],
  clientOrganizationIds: ["org_1"],
  assignedEngagementIds: ["eng_1"],
};

describe("transition-service", () => {
  it("lists only valid direct engagement transitions", () => {
    expect(canTransitionEngagement("awaiting_kyc", "kyc_in_progress")).toBe(true);
    expect(canTransitionEngagement("awaiting_kyc", "active")).toBe(false);
  });

  it("requires reasons for rejection transitions", async () => {
    await expect(
      transitionEngagementRequestStatus({
        actor: adminPrincipal,
        resourceId: "req_1",
        currentStatus: "awaiting_admin_review",
        nextStatus: "rejected",
      }),
    ).rejects.toThrow("reason is required");
  });

  it("checks prerequisites before accepting a request", async () => {
    await expect(
      transitionEngagementRequestStatus({
        actor: adminPrincipal,
        resourceId: "req_1",
        currentStatus: "awaiting_admin_review",
        nextStatus: "accepted",
      }),
    ).rejects.toThrow("assignedStaff");
  });

  it("audits successful transitions and returns notification types", async () => {
    const audit = vi.fn();

    const result = await transitionEngagementRequestStatus({
      actor: adminPrincipal,
      resourceId: "req_1",
      currentStatus: "awaiting_admin_review",
      nextStatus: "accepted",
      prerequisites: { assignedStaff: true },
      audit,
    });

    expect(result.status).toBe("accepted");
    expect(result.notifications).toContain("kyc.opened");
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "engagement_request.status_transitioned",
        previousValues: { status: "awaiting_admin_review" },
        newValues: { status: "accepted" },
      }),
    );
  });

  it("allows client KYC submission only after documents are submitted", async () => {
    await expect(
      transitionEngagementStatus({
        actor: clientPrincipal,
        resourceId: "eng_1",
        currentStatus: "kyc_in_progress",
        nextStatus: "kyc_pending_review",
      }),
    ).rejects.toThrow("kycSubmitted");

    await expect(
      transitionEngagementStatus({
        actor: clientPrincipal,
        resourceId: "eng_1",
        currentStatus: "kyc_in_progress",
        nextStatus: "kyc_pending_review",
        prerequisites: { kycSubmitted: true },
      }),
    ).resolves.toMatchObject({
      status: "kyc_pending_review",
    });
  });
});
