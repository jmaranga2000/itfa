import { Types } from "mongoose";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { WorkflowTemplateModel } from "@/models/workflow-template";

type SeedUser = {
  _id: Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  roleKeys?: string[];
};

const day = 86_400_000;

function dateFromNow(days: number) {
  return new Date(Date.now() + days * day);
}

function userName(user: SeedUser | null | undefined, fallback: string) {
  if (!user) {
    return fallback;
  }

  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name || user.email;
}

function baseStages() {
  return [
    {
      key: "intake",
      name: "Client Request",
      internalDescription: "Validate request details, pricing, risk and staffing.",
      clientTitle: "Request received",
      order: 1,
      expectedDurationDays: 2,
      responsibleRole: "admin",
      entryConditions: ["Client submitted selected service and scope"],
      completionConditions: ["Admin accepts, rejects or requests clarification"],
      requiredDocuments: [],
      approvalRequired: true,
      clientVisible: true,
      notificationRules: ["Notify admin on submission"],
      escalationRules: ["Escalate if review exceeds 2 business days"],
      tasks: [
        {
          key: "review_request",
          title: "Review client request",
          description: "Confirm scope, pricing, risk and staffing requirements.",
          assignedRole: "admin",
          priority: "high",
          dueOffsetDays: 1,
          dependencies: [],
          checklist: ["Review scope", "Confirm pricing", "Check risk indicators"],
          requiredDocuments: [],
          clientVisible: false,
          approvalRequired: true,
        },
      ],
    },
    {
      key: "kyc",
      name: "KYC Review",
      internalDescription: "Collect and approve required individual or corporate KYC evidence.",
      clientTitle: "KYC and compliance",
      order: 2,
      expectedDurationDays: 5,
      responsibleRole: "reviewer",
      entryConditions: ["Engagement request accepted"],
      completionConditions: ["All mandatory KYC requirements approved"],
      requiredDocuments: ["Identification", "Tax PIN", "Proof of address"],
      approvalRequired: true,
      clientVisible: true,
      notificationRules: ["Notify client when KYC opens", "Notify reviewer when submitted"],
      escalationRules: ["Escalate if client action is overdue"],
      tasks: [
        {
          key: "open_kyc",
          title: "Open KYC workflow",
          description: "Prepare KYC requirement list and notify client.",
          assignedRole: "reviewer",
          priority: "high",
          dueOffsetDays: 1,
          dependencies: ["review_request"],
          checklist: ["Select KYC template", "Request required documents"],
          requiredDocuments: [],
          clientVisible: false,
          approvalRequired: false,
        },
        {
          key: "review_kyc",
          title: "Review submitted KYC",
          description: "Approve, reject or request replacement for submitted requirements.",
          assignedRole: "reviewer",
          priority: "critical",
          dueOffsetDays: 4,
          dependencies: ["open_kyc"],
          checklist: ["Check mandatory requirements", "Record reviewer comments"],
          requiredDocuments: ["Identification", "Tax PIN"],
          clientVisible: false,
          approvalRequired: true,
        },
      ],
    },
    {
      key: "letter",
      name: "Engagement Letter",
      internalDescription: "Generate, review, approve and collect signature evidence.",
      clientTitle: "Engagement letter",
      order: 3,
      expectedDurationDays: 4,
      responsibleRole: "engagement_manager",
      entryConditions: ["KYC approved"],
      completionConditions: ["Signed letter is stored as final version"],
      requiredDocuments: ["Signed engagement letter"],
      approvalRequired: true,
      clientVisible: true,
      notificationRules: ["Notify client when letter is ready"],
      escalationRules: ["Escalate if signature is overdue"],
      tasks: [
        {
          key: "generate_letter",
          title: "Generate engagement letter",
          description: "Select template and insert final scope, price and service details.",
          assignedRole: "engagement_manager",
          priority: "high",
          dueOffsetDays: 2,
          dependencies: ["review_kyc"],
          checklist: ["Select template", "Preview variables", "Submit for approval"],
          requiredDocuments: [],
          clientVisible: false,
          approvalRequired: true,
        },
      ],
    },
    {
      key: "active_work",
      name: "Active Work",
      internalDescription: "Execute consulting tasks, deliverables, client requests and reviews.",
      clientTitle: "Work in progress",
      order: 4,
      expectedDurationDays: 14,
      responsibleRole: "lead_consultant",
      entryConditions: ["Engagement letter signed"],
      completionConditions: ["Mandatory tasks and deliverables completed"],
      requiredDocuments: ["Draft deliverable"],
      approvalRequired: false,
      clientVisible: true,
      notificationRules: ["Notify staff on assignment", "Notify client for action requests"],
      escalationRules: ["Escalate overdue tasks to engagement manager"],
      tasks: [
        {
          key: "initial_review",
          title: "Complete initial technical review",
          description: "Review client facts and prepare initial advisory findings.",
          assignedRole: "lead_consultant",
          priority: "high",
          dueOffsetDays: 5,
          dependencies: ["generate_letter"],
          checklist: ["Review documents", "Draft findings", "Prepare questions"],
          requiredDocuments: ["Client documents"],
          clientVisible: false,
          approvalRequired: false,
        },
        {
          key: "draft_deliverable",
          title: "Prepare draft deliverable",
          description: "Prepare draft report or advisory memo for review.",
          assignedRole: "consultant",
          priority: "high",
          dueOffsetDays: 9,
          dependencies: ["initial_review"],
          checklist: ["Draft report", "Attach schedules", "Submit for review"],
          requiredDocuments: ["Draft deliverable"],
          clientVisible: true,
          approvalRequired: true,
        },
      ],
    },
    {
      key: "client_review",
      name: "Client Review",
      internalDescription: "Share final draft, receive client feedback and resolve changes.",
      clientTitle: "Review deliverables",
      order: 5,
      expectedDurationDays: 5,
      responsibleRole: "client",
      entryConditions: ["Draft deliverable approved internally"],
      completionConditions: ["Client acknowledges or requests changes"],
      requiredDocuments: [],
      approvalRequired: false,
      clientVisible: true,
      notificationRules: ["Notify client to review deliverable"],
      escalationRules: ["Escalate if client review is overdue"],
      tasks: [],
    },
    {
      key: "finance",
      name: "Invoice Completion",
      internalDescription: "Issue invoice, record payment and reconcile finance state.",
      clientTitle: "Invoice and payment",
      order: 6,
      expectedDurationDays: 4,
      responsibleRole: "finance_officer",
      entryConditions: ["Client review complete"],
      completionConditions: ["Invoice issued and payment reviewed"],
      requiredDocuments: ["Invoice"],
      approvalRequired: true,
      clientVisible: true,
      notificationRules: ["Notify finance when invoice is ready"],
      escalationRules: ["Escalate overdue invoice to admin"],
      tasks: [
        {
          key: "approve_invoice",
          title: "Approve and issue invoice",
          description: "Create invoice, submit for approval, issue and track payment.",
          assignedRole: "finance_officer",
          priority: "medium",
          dueOffsetDays: 2,
          dependencies: ["draft_deliverable"],
          checklist: ["Create invoice", "Submit approval", "Issue to client"],
          requiredDocuments: ["Invoice"],
          clientVisible: false,
          approvalRequired: true,
        },
      ],
    },
    {
      key: "completion",
      name: "Engagement Closed",
      internalDescription: "Confirm completion checklist, final notes and client acknowledgement.",
      clientTitle: "Engagement complete",
      order: 7,
      expectedDurationDays: 2,
      responsibleRole: "admin",
      entryConditions: ["Deliverables and finance checks complete"],
      completionConditions: ["Admin closes engagement"],
      requiredDocuments: ["Final deliverable"],
      approvalRequired: true,
      clientVisible: true,
      notificationRules: ["Notify client when engagement is completed"],
      escalationRules: [],
      tasks: [],
    },
    {
      key: "archive",
      name: "Workspace Archived",
      internalDescription: "Move completed engagement to read-only archive with retention controls.",
      clientTitle: "Archived",
      order: 8,
      expectedDurationDays: 30,
      responsibleRole: "document_controller",
      entryConditions: ["Grace period complete"],
      completionConditions: ["Archive policy satisfied"],
      requiredDocuments: [],
      approvalRequired: true,
      clientVisible: false,
      notificationRules: [],
      escalationRules: ["Permanent deletion requires elevated authorization"],
      tasks: [],
    },
  ];
}

function snapshotStageInstances(currentStageKey: string, completedStageKeys: string[]) {
  return baseStages().map((stage) => ({
    key: stage.key,
    name: stage.name,
    internalDescription: stage.internalDescription,
    clientTitle: stage.clientTitle,
    order: stage.order,
    expectedDurationDays: stage.expectedDurationDays,
    responsibleRole: stage.responsibleRole,
    status: completedStageKeys.includes(stage.key)
      ? "completed"
      : stage.key === currentStageKey
        ? "in_progress"
        : "not_started",
    entryConditions: stage.entryConditions,
    completionConditions: stage.completionConditions,
    requiredDocuments: stage.requiredDocuments,
    approvalRequired: stage.approvalRequired,
    clientVisible: stage.clientVisible,
    enteredAt: stage.key === currentStageKey ? dateFromNow(-2) : null,
    dueAt: stage.key === currentStageKey ? dateFromNow(stage.expectedDurationDays) : null,
    completedAt: completedStageKeys.includes(stage.key) ? dateFromNow(-stage.order) : null,
    blockedReason: null,
  }));
}

function snapshotTaskInstances(
  currentStageKey: string,
  staff: SeedUser,
  manager: SeedUser,
  finance: SeedUser | undefined,
  completedTaskKeys: string[],
  overdueTaskKeys: string[] = [],
) {
  return baseStages().flatMap((stage) =>
    stage.tasks.map((task) => {
      const assignedUser = task.assignedRole === "engagement_manager"
        ? manager
        : task.assignedRole === "finance_officer"
          ? finance
          : staff;
      return ({
      key: task.key,
      stageKey: stage.key,
      title: task.title,
      description: task.description,
      assignedUserId: assignedUser?._id ?? null,
      assignedUserName: assignedUser ? userName(assignedUser, task.assignedRole === "finance_officer" ? "Finance officer" : "Consultant") : "Finance queue",
      assignedRole: task.assignedRole,
      priority: task.priority,
      status: completedTaskKeys.includes(task.key)
        ? "completed"
        : overdueTaskKeys.includes(task.key)
          ? "overdue"
          : stage.key === currentStageKey
            ? "in_progress"
            : task.dependencies.every((dependency) => completedTaskKeys.includes(dependency))
              ? "ready"
              : "not_started",
      startDate: stage.key === currentStageKey ? dateFromNow(-1) : null,
      dueDate: overdueTaskKeys.includes(task.key) ? dateFromNow(-3) : dateFromNow(task.dueOffsetDays),
      estimatedHours: null,
      dependencies: task.dependencies,
      checklist: task.checklist.map((label, index) => ({
        label,
        completed: completedTaskKeys.includes(task.key) || index === 0,
      })),
      requiredDocuments: task.requiredDocuments,
      clientVisible: task.clientVisible,
      clientActionRequired: stage.key === "client_review",
      internalNotes: "",
      completionNotes: completedTaskKeys.includes(task.key) ? "Completed during seeded workflow setup." : "",
      approvalRequired: task.approvalRequired,
      completedByUserId: completedTaskKeys.includes(task.key) ? staff._id : null,
      completedAt: completedTaskKeys.includes(task.key) ? dateFromNow(-1) : null,
      blockerReason: overdueTaskKeys.includes(task.key) ? "Waiting for technical review input." : null,
      });
    }),
  );
}

function milestones(completedKeys: string[]) {
  return [
    "Engagement accepted",
    "KYC approved",
    "Engagement letter signed",
    "Initial review completed",
    "Draft submitted",
    "Client feedback received",
    "Final deliverable approved",
    "Engagement completed",
  ].map((title, index) => ({
    key: title.toLowerCase().replaceAll(" ", "_"),
    title,
    status: completedKeys.includes(title) ? "completed" : "pending",
    date: completedKeys.includes(title) ? dateFromNow(-index - 1) : null,
    responsibleUserId: null,
    relatedTaskKeys: [],
    relatedDocumentIds: [],
    clientVisible: true,
  }));
}

export async function seedWorkflowData() {
  const users = (await UserModel.find({
    $or: [
      { email: { $in: [
          process.env.SEED_ADMIN_EMAIL ?? "admin@ifta.test",
          process.env.SEED_STAFF_EMAIL ?? "staff@ifta.test",
          process.env.SEED_CLIENT_EMAIL ?? "client@ifta.test",
        ] } },
      { roleKeys: "finance_officer", status: "active" },
    ],
  })
    .select("email firstName lastName roleKeys")
    .lean()
    .exec()) as SeedUser[];
  const admin = users.find((user) => user.roleKeys?.includes("admin")) ?? users[0];
  const staff = users.find((user) => user.roleKeys?.includes("consultant")) ?? users[0];
  const client = users.find((user) => user.roleKeys?.includes("client")) ?? users[0];
  const finance = users.find((user) => user.roleKeys?.includes("finance_officer"));

  if (!admin || !staff || !client) {
    return { templates: 0, workflows: 0 };
  }

  const template = await WorkflowTemplateModel.findOneAndUpdate(
    { name: "Tax Advisory Engagement", version: 1 },
    {
      $set: {
        description: "Full consultancy workflow from request intake through KYC, delivery, finance and archive.",
        applicableServices: ["Tax Advisory", "KRA Assessment Review", "Compliance Review"],
        status: "published",
        stages: baseStages(),
        milestones: [
          "Engagement accepted",
          "KYC approved",
          "Engagement letter signed",
          "Initial review completed",
          "Draft submitted",
          "Client feedback received",
          "Final deliverable approved",
          "Engagement completed",
        ],
        approvalPoints: [
          { key: "request_approval", title: "Engagement request approval", stageKey: "intake", approverRole: "admin", status: "approved" },
          { key: "kyc_approval", title: "KYC approval", stageKey: "kyc", approverRole: "reviewer", status: "approved" },
          { key: "letter_approval", title: "Engagement letter approval", stageKey: "letter", approverRole: "engagement_manager", status: "not_submitted" },
          { key: "completion_approval", title: "Final completion approval", stageKey: "completion", approverRole: "admin", status: "not_submitted" },
          { key: "archive_approval", title: "Archive approval", stageKey: "archive", approverRole: "document_controller", status: "not_submitted" },
        ],
        completionConditions: ["Mandatory tasks completed", "Deliverables uploaded", "Finance status reviewed", "Final notes added"],
        archiveRules: ["Grace period before archive", "Read-only workspace retained", "Legal hold blocks permanent deletion"],
        notificationRules: ["Notify admin on request", "Notify staff on assignment", "Notify client for actions"],
        escalationRules: ["Overdue staff tasks notify engagement manager", "Overdue client actions notify admin"],
        createdByUserId: admin._id,
        publishedByUserId: admin._id,
        publishedAt: dateFromNow(-5),
        archivedAt: null,
      },
    },
    { returnDocument: "after", upsert: true },
  ).exec();

  const templateId = template._id as Types.ObjectId;
  const commonTeam = [
    { userId: admin._id, name: userName(admin, "Admin"), email: admin.email, role: "engagement_manager", department: "Operations", workloadLevel: "balanced" },
    { userId: staff._id, name: userName(staff, "Consultant"), email: staff.email, role: "lead_consultant", department: "Tax", workloadLevel: "high" },
    ...(finance ? [{ userId: finance._id, name: userName(finance, "Finance officer"), email: finance.email, role: "finance_officer", department: "Finance", workloadLevel: "balanced" as const }] : []),
  ];

  const workflowPayloads = [
    {
      reference: "IFTA-WF-0001",
      clientName: userName(client, "Client Portal"),
      serviceName: "Tax Advisory",
      currentStageKey: "active_work",
      riskLevel: "high",
      riskReason: "Draft deliverable task is overdue.",
      nextAction: "Complete initial technical review and submit draft deliverable.",
      completedStages: ["intake", "kyc", "letter"],
      completedTasks: ["review_request", "open_kyc", "review_kyc", "generate_letter"],
      overdueTasks: ["initial_review"],
      milestoneKeys: ["Engagement accepted", "KYC approved", "Engagement letter signed"],
      dueDate: dateFromNow(10),
    },
    {
      reference: "IFTA-WF-0002",
      clientName: "Acacia Holdings Ltd",
      serviceName: "Compliance Review",
      currentStageKey: "kyc",
      riskLevel: "medium",
      riskReason: "Waiting for client proof of address.",
      nextAction: "Follow up with client on missing proof of address.",
      completedStages: ["intake"],
      completedTasks: ["review_request", "open_kyc"],
      overdueTasks: [],
      milestoneKeys: ["Engagement accepted"],
      dueDate: dateFromNow(5),
    },
    {
      reference: "IFTA-WF-0003",
      clientName: "Pioneer Foods EA",
      serviceName: "KRA Assessment Review",
      currentStageKey: "finance",
      riskLevel: "low",
      riskReason: "",
      nextAction: "Approve and issue final invoice.",
      completedStages: ["intake", "kyc", "letter", "active_work", "client_review"],
      completedTasks: ["review_request", "open_kyc", "review_kyc", "generate_letter", "initial_review", "draft_deliverable"],
      overdueTasks: [],
      milestoneKeys: ["Engagement accepted", "KYC approved", "Engagement letter signed", "Initial review completed", "Draft submitted", "Client feedback received"],
      dueDate: dateFromNow(3),
    },
  ];

  await Promise.all(
    workflowPayloads.map((workflow) =>
      WorkflowInstanceModel.findOneAndUpdate(
        { reference: workflow.reference },
        {
          $set: {
            clientName: workflow.clientName,
            clientUserId: workflow.reference === "IFTA-WF-0001" ? client._id : null,
            organizationName: workflow.clientName,
            serviceName: workflow.serviceName,
            templateId,
            templateName: template.name,
            templateVersion: template.version,
            templateSnapshot: template.toObject(),
            status: "active",
            currentStageKey: workflow.currentStageKey,
            riskLevel: workflow.riskLevel,
            riskReason: workflow.riskReason,
            nextAction: workflow.nextAction,
            responsibleUserName: userName(staff, "Consultant"),
            responsibleUserId: staff._id,
            startDate: dateFromNow(-12),
            dueDate: workflow.dueDate,
            lastActivityAt: dateFromNow(-1),
            team: commonTeam,
            stages: snapshotStageInstances(workflow.currentStageKey, workflow.completedStages),
            tasks: snapshotTaskInstances(workflow.currentStageKey, staff, admin, finance, workflow.completedTasks, workflow.overdueTasks),
            milestones: milestones(workflow.milestoneKeys),
            approvals: [
              { key: "request_approval", title: "Engagement request approval", stageKey: "intake", status: "approved", approverName: userName(admin, "Admin"), approvalDate: dateFromNow(-11), reason: "", comments: "Accepted for onboarding.", previousVersion: "request-v1", approvedVersion: "request-v1" },
              { key: "kyc_approval", title: "KYC approval", stageKey: "kyc", status: workflow.completedStages.includes("kyc") ? "approved" : "awaiting_approval", approverName: userName(staff, "Reviewer"), approvalDate: workflow.completedStages.includes("kyc") ? dateFromNow(-8) : null, reason: "", comments: "", previousVersion: "kyc-v1", approvedVersion: workflow.completedStages.includes("kyc") ? "kyc-v1" : "" },
              { key: "letter_approval", title: "Engagement letter approval", stageKey: "letter", status: workflow.completedStages.includes("letter") ? "approved" : "not_submitted", approverName: userName(admin, "Admin"), approvalDate: workflow.completedStages.includes("letter") ? dateFromNow(-6) : null, reason: "", comments: "", previousVersion: "letter-v1", approvedVersion: workflow.completedStages.includes("letter") ? "letter-v1-signed" : "" },
            ],
            clientActions: [
              { key: "proof_of_address", title: "Upload proof of address", instructions: "Upload a recent proof of address to complete KYC.", dueDate: workflow.currentStageKey === "kyc" ? dateFromNow(1) : dateFromNow(-7), relatedTaskKey: "review_kyc", requiredDocumentType: "Proof of address", priority: "high", assignedClientUserId: workflow.reference === "IFTA-WF-0001" ? client._id : null, status: workflow.completedStages.includes("kyc") ? "completed" : "pending" },
              { key: "review_deliverable", title: "Review draft deliverable", instructions: "Review the draft deliverable and confirm whether changes are needed.", dueDate: dateFromNow(4), relatedTaskKey: "draft_deliverable", requiredDocumentType: null, priority: "medium", assignedClientUserId: workflow.reference === "IFTA-WF-0001" ? client._id : null, status: workflow.completedStages.includes("client_review") ? "completed" : "pending" },
            ],
            documents: [
              { documentId: `${workflow.reference}-DOC-001`, name: "Identification", status: "approved", version: 1, visibility: "all", reviewerComments: "Valid.", clientFeedback: "Accepted.", uploadedAt: dateFromNow(-9) },
              { documentId: `${workflow.reference}-DOC-003`, name: "Tax PIN", status: "approved", version: 1, visibility: "all", reviewerComments: "KRA PIN verified.", clientFeedback: "Accepted.", uploadedAt: dateFromNow(-9) },
              { documentId: `${workflow.reference}-DOC-004`, name: "Proof of address", status: "approved", version: 1, visibility: "all", reviewerComments: "Address evidence verified.", clientFeedback: "Accepted.", uploadedAt: dateFromNow(-9) },
              { documentId: `${workflow.reference}-DOC-005`, name: "Signed engagement letter", status: workflow.completedStages.includes("letter") ? "final" : "uploaded", version: 1, visibility: "all", reviewerComments: "Signed letter retained.", clientFeedback: "Accepted.", uploadedAt: dateFromNow(-6) },
              { documentId: `${workflow.reference}-DOC-002`, name: "Draft deliverable", status: workflow.completedTasks.includes("draft_deliverable") ? "final" : "pending_review", version: 1, visibility: "client", reviewerComments: "", clientFeedback: "", uploadedAt: dateFromNow(-2) },
            ],
            financial: {
              invoiceStatus: workflow.currentStageKey === "finance" ? "pending_approval" : "draft",
              paymentStatus: "pending",
              balanceDue: workflow.currentStageKey === "finance" ? 180000 : 0,
              currency: "KES",
              adjustmentReasonRequired: false,
            },
            completionChecklist: [
              { label: "Mandatory tasks completed", completed: workflow.completedTasks.includes("draft_deliverable") },
              { label: "Final deliverables uploaded", completed: workflow.completedTasks.includes("draft_deliverable") },
              { label: "Invoice status reviewed", completed: workflow.currentStageKey === "finance" },
              { label: "Final notes added", completed: false },
            ],
            archive: { status: "not_ready", retentionUntil: null, archivedAt: null, legalHoldReason: "" },
            activity: [
              { type: "workflow_created", title: "Workflow created", actorName: userName(admin, "Admin"), description: "Workflow instance created from Tax Advisory Engagement template.", relatedResource: workflow.reference, clientVisible: true, createdAt: dateFromNow(-12) },
              { type: "stage_changed", title: `Moved to ${workflow.currentStageKey.replaceAll("_", " ")}`, actorName: "System", description: workflow.nextAction, relatedResource: workflow.reference, clientVisible: true, createdAt: dateFromNow(-1) },
              { type: "task_assigned", title: "Staff assignment confirmed", actorName: userName(admin, "Admin"), description: "Lead consultant and engagement manager assigned.", relatedResource: workflow.reference, clientVisible: false, createdAt: dateFromNow(-10) },
            ],
            archivedAt: null,
          },
        },
        { upsert: true },
      ).exec(),
    ),
  );

  return { templates: 1, workflows: workflowPayloads.length };
}
