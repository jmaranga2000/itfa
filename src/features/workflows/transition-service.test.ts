import { describe, expect, it } from "vitest";
import type { Principal } from "@/features/authorization/access-control";
import { calculateProgress, type WorkflowInstanceRecord } from "@/repositories/workflow-repository";
import { validateWorkflowTransition } from "@/features/workflows/transition-service";

const admin: Principal = {
  id: "64d000000000000000000001",
  email: "admin@ifta.test",
  roleKeys: ["admin"],
  permissions: ["engagements.update_workflow", "permissions.manage"],
  clientOrganizationIds: [],
  assignedEngagementIds: [],
};

const consultant: Principal = {
  id: "64d000000000000000000002",
  email: "staff@ifta.test",
  roleKeys: ["consultant"],
  permissions: ["engagements.update_workflow"],
  clientOrganizationIds: [],
  assignedEngagementIds: [],
};

function workflowFixture(overrides: Partial<WorkflowInstanceRecord> = {}): WorkflowInstanceRecord {
  const workflow: WorkflowInstanceRecord = {
    id: "64d000000000000000000010",
    reference: "IFTA-WF-TEST",
    clientName: "Client",
    clientUserId: "64d000000000000000000003",
    organizationName: "Client",
    serviceName: "Tax Advisory",
    templateName: "Tax Advisory Engagement",
    templateVersion: 1,
    status: "active",
    currentStageKey: "intake",
    currentStageName: "Client Request",
    riskLevel: "low",
    riskReason: "",
    nextAction: "Review request",
    responsibleUserName: "Admin",
    responsibleUserId: admin.id,
    startDate: null,
    dueDate: null,
    lastActivityAt: null,
    progress: {
      overall: 0,
      clientVisible: 0,
      completedStages: 0,
      totalStages: 2,
      completedRequiredTasks: 0,
      totalRequiredTasks: 1,
      completedClientActions: 0,
      totalClientActions: 0,
      overdueItems: 0,
      blockedItems: 0,
      pendingApprovals: 0,
    },
    team: [],
    stages: [
      {
        key: "intake",
        name: "Client Request",
        clientTitle: "Request received",
        order: 1,
        responsibleRole: "admin",
        status: "in_progress",
        expectedDurationDays: 2,
        dueAt: null,
        enteredAt: null,
        completedAt: null,
        completionConditions: ["Request reviewed"],
        requiredDocuments: [],
        approvalRequired: false,
        clientVisible: true,
        blockedReason: null,
      },
      {
        key: "kyc",
        name: "KYC Review",
        clientTitle: "Compliance",
        order: 2,
        responsibleRole: "reviewer",
        status: "not_started",
        expectedDurationDays: 5,
        dueAt: null,
        enteredAt: null,
        completedAt: null,
        completionConditions: ["KYC approved"],
        requiredDocuments: [],
        approvalRequired: true,
        clientVisible: true,
        blockedReason: null,
      },
    ],
    tasks: [
      {
        key: "review_request",
        stageKey: "intake",
        title: "Review request",
        description: "",
        assignedUserId: admin.id,
        assignedUserName: "Admin",
        assignedRole: "admin",
        priority: "high",
        status: "completed",
        startDate: null,
        dueDate: null,
        dependencies: [],
        checklist: [],
        requiredDocuments: [],
        clientVisible: false,
        clientActionRequired: false,
        internalNotes: "",
        completionNotes: "",
        approvalRequired: false,
        blockerReason: null,
      },
    ],
    milestones: [],
    approvals: [],
    clientActions: [],
    documents: [],
    financial: {
      invoiceStatus: "draft",
      paymentStatus: "pending",
      balanceDue: 0,
      currency: "KES",
    },
    completionChecklist: [],
    archive: {
      status: "not_ready",
      retentionUntil: null,
      archivedAt: null,
      legalHoldReason: "",
    },
    activity: [],
    ...overrides,
  };

  return workflow;
}

describe("workflow transition validation", () => {
  it("allows the next ordered stage when requirements are satisfied", () => {
    const result = validateWorkflowTransition({
      workflow: workflowFixture(),
      nextStageKey: "kyc",
      actor: consultant,
    });

    expect(result.allowed).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("blocks skipped stages without an authorized override", () => {
    const result = validateWorkflowTransition({
      workflow: workflowFixture({
        stages: [
          ...workflowFixture().stages,
          {
            key: "letter",
            name: "Letter",
            clientTitle: "Letter",
            order: 3,
            responsibleRole: "manager",
            status: "not_started",
            expectedDurationDays: 3,
            dueAt: null,
            enteredAt: null,
            completedAt: null,
            completionConditions: [],
            requiredDocuments: [],
            approvalRequired: false,
            clientVisible: true,
            blockedReason: null,
          },
        ],
      }),
      nextStageKey: "letter",
      actor: consultant,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toContain("advance in order");
  });

  it("requires a reason when using an authorized override", () => {
    const result = validateWorkflowTransition({
      workflow: workflowFixture(),
      nextStageKey: "kyc",
      actor: admin,
      override: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toContain("reason is required");
  });

  it("blocks incomplete required tasks", () => {
    const workflow = workflowFixture({
      tasks: [{ ...workflowFixture().tasks[0], status: "in_progress" }],
    });
    const result = validateWorkflowTransition({
      workflow,
      nextStageKey: "kyc",
      actor: consultant,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toContain("required task");
  });
});

describe("workflow progress calculation", () => {
  it("derives progress from stages, tasks and client actions", () => {
    const progress = calculateProgress({
      stages: [
        { status: "completed", clientVisible: true },
        { status: "in_progress", clientVisible: true },
      ],
      tasks: [
        { status: "completed", dueDate: null },
        { status: "ready", dueDate: null },
      ],
      approvals: [{ status: "awaiting_approval" }],
      clientActions: [{ status: "completed", dueDate: null }],
    } as never);

    expect(progress.completedStages).toBe(1);
    expect(progress.completedRequiredTasks).toBe(1);
    expect(progress.pendingApprovals).toBe(1);
    expect(progress.overall).toBeGreaterThan(40);
  });
});
