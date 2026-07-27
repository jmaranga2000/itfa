import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("@/repositories/engagement-workspace-repository", () => ({
  listEngagementDocumentsForPrincipal: vi.fn(),
}));
vi.mock("@/repositories/communication-repository", () => ({
  getOrCreateEngagementConversation: vi.fn(),
  listMessagesForConversation: vi.fn(),
}));
vi.mock("@/models/client-payment", () => ({
  ClientPaymentModel: { find: vi.fn() },
}));
vi.mock("@/repositories/workflow-repository", () => ({
  getWorkflowForPrincipal: vi.fn(),
}));

import { getCompletionRequirements, getEngagementExecutionData, type EngagementPaymentRecord } from "@/repositories/engagement-execution-repository";
import { listEngagementDocumentsForPrincipal } from "@/repositories/engagement-workspace-repository";
import { getOrCreateEngagementConversation } from "@/repositories/communication-repository";
import { ClientPaymentModel } from "@/models/client-payment";
import * as workflowRepository from "@/repositories/workflow-repository";
import type { EngagementDocumentRecord } from "@/repositories/engagement-workspace-repository";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";
import type { Principal } from "@/features/authorization/access-control";

afterEach(() => {
  vi.restoreAllMocks();
});

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

describe("engagement execution data", () => {
  it("uses full workflow state for client completion requirements", async () => {
    const principal = {
      id: "client-user-1",
      email: "client@example.com",
      roleKeys: ["client"],
      permissions: [],
      clientOrganizationIds: [],
      assignedEngagementIds: [],
    } as Principal;
    const workflowId = "workflow-123";
    const clientWorkflow = {
      id: workflowId,
      status: "active",
      tasks: [],
      clientActions: [],
      financial: { balanceDue: 0, invoices: [] },
      progress: { overall: 50, clientVisible: 50 },
      completion: { notes: "" },
    } as unknown as WorkflowInstanceRecord;
    const fullWorkflow = {
      ...clientWorkflow,
      tasks: [{ key: "task-1", title: "Review task 1", status: "waiting_for_approval", approvalRequired: true, reviewHistory: [] }],
    } as unknown as WorkflowInstanceRecord;

    vi.spyOn(workflowRepository, "getWorkflowForPrincipal")
      .mockResolvedValueOnce(clientWorkflow)
      .mockResolvedValueOnce(fullWorkflow);
    (listEngagementDocumentsForPrincipal as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (ClientPaymentModel.find as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      sort: vi.fn(() => ({ lean: vi.fn(() => ({ exec: vi.fn(() => Promise.resolve([])) })) })),
    });
    (getOrCreateEngagementConversation as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const data = await getEngagementExecutionData(principal, workflowId);

    expect(data).not.toBeNull();
    expect(data?.workflow.tasks).toEqual([]);
    const reviewRequirement = data?.completionRequirements.find((requirement) => requirement.key === "reviews");
    expect(reviewRequirement).toBeDefined();
    expect(reviewRequirement?.complete).toBe(false);
    expect(reviewRequirement?.detail).toContain("Review task 1");
  });
});
