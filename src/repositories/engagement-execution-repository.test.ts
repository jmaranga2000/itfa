import { describe, expect, it } from "vitest";
import {
  getCompletionRequirements,
  type EngagementPaymentRecord,
} from "@/repositories/engagement-execution-repository";
import type { EngagementDocumentRecord } from "@/repositories/engagement-workspace-repository";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

function workflowFixture(ready: boolean) {
  return {
    tasks: [{
      status: ready ? "completed" : "waiting_for_approval",
      approvalRequired: true,
      reviewHistory: ready ? [{ decision: "approved" }] : [],
    }],
    clientActions: ready ? [] : [{ status: "pending" }],
    financial: {
      balanceDue: 1_000,
      invoices: [{ status: ready ? "issued" : "draft" }],
    },
  } as unknown as WorkflowInstanceRecord;
}

function documentsFixture(ready: boolean) {
  return ready
    ? [{ documentKind: "final_deliverable", status: "final" } as EngagementDocumentRecord]
    : [];
}

function paymentsFixture(ready: boolean) {
  return [{ status: ready ? "verified" : "pending" } as EngagementPaymentRecord];
}

describe("engagement completion requirements", () => {
  it("blocks completion while any Phase 2 requirement is outstanding", () => {
    const requirements = getCompletionRequirements(
      workflowFixture(false),
      documentsFixture(false),
      paymentsFixture(false),
      "short",
    );

    expect(requirements.every((requirement) => !requirement.complete)).toBe(true);
  });

  it("allows completion only when work, review, delivery, client, and finance records are ready", () => {
    const requirements = getCompletionRequirements(
      workflowFixture(true),
      documentsFixture(true),
      paymentsFixture(true),
      "All final work was delivered and accepted by the client.",
    );

    expect(requirements.every((requirement) => requirement.complete)).toBe(true);
  });
});
