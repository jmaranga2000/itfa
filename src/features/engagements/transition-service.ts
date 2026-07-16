import { assertPermission, type Principal } from "@/features/authorization/access-control";
import type { Permission } from "@/features/authorization/permissions";
import type {
  EngagementRequestStatus,
  EngagementStatus,
  WorkflowPrerequisites,
} from "@/features/engagements/status";
import { AppError, AuthorizationError } from "@/lib/errors";

type TransitionKind = "engagement_request" | "engagement";

type TransitionDefinition<TStatus extends string> = {
  from: TStatus;
  to: TStatus;
  permission: Permission;
  requiredPrerequisites?: (keyof WorkflowPrerequisites)[];
  requiresReason?: boolean;
  notificationTypes: string[];
};

export type TransitionAuditEvent<TStatus extends string> = {
  actor: Principal;
  action: string;
  resourceType: TransitionKind;
  resourceId: string;
  previousValues: { status: TStatus };
  newValues: { status: TStatus };
  reason?: string;
};

export type TransitionInput<TStatus extends string> = {
  actor: Principal;
  resourceId: string;
  currentStatus: TStatus;
  nextStatus: TStatus;
  prerequisites?: WorkflowPrerequisites;
  reason?: string;
  audit?: (event: TransitionAuditEvent<TStatus>) => Promise<void> | void;
};

export type TransitionResult<TStatus extends string> = {
  status: TStatus;
  notifications: string[];
};

const requestTransitions: readonly TransitionDefinition<EngagementRequestStatus>[] = [
  {
    from: "draft",
    to: "submitted",
    permission: "engagements.create",
    notificationTypes: ["engagement_request.submitted"],
  },
  {
    from: "submitted",
    to: "awaiting_admin_review",
    permission: "engagements.accept",
    notificationTypes: ["engagement_request.ready_for_review"],
  },
  {
    from: "awaiting_admin_review",
    to: "clarification_requested",
    permission: "engagements.accept",
    requiresReason: true,
    notificationTypes: ["engagement_request.clarification_requested"],
  },
  {
    from: "awaiting_admin_review",
    to: "scope_revision_pending",
    permission: "engagements.accept",
    requiresReason: true,
    notificationTypes: ["engagement_request.scope_revision_pending"],
  },
  {
    from: "awaiting_admin_review",
    to: "accepted",
    permission: "engagements.accept",
    requiredPrerequisites: ["assignedStaff"],
    notificationTypes: ["engagement_request.accepted", "kyc.opened"],
  },
  {
    from: "awaiting_admin_review",
    to: "rejected",
    permission: "engagements.accept",
    requiresReason: true,
    notificationTypes: ["engagement_request.rejected"],
  },
  {
    from: "clarification_requested",
    to: "submitted",
    permission: "engagements.create",
    notificationTypes: ["engagement_request.clarification_answered"],
  },
  {
    from: "scope_revision_pending",
    to: "submitted",
    permission: "engagements.create",
    notificationTypes: ["engagement_request.scope_revision_answered"],
  },
  {
    from: "draft",
    to: "cancelled",
    permission: "engagements.create",
    requiresReason: true,
    notificationTypes: ["engagement_request.cancelled"],
  },
  {
    from: "submitted",
    to: "cancelled",
    permission: "engagements.create",
    requiresReason: true,
    notificationTypes: ["engagement_request.cancelled"],
  },
];

const engagementTransitions: readonly TransitionDefinition<EngagementStatus>[] = [
  {
    from: "awaiting_kyc",
    to: "kyc_in_progress",
    permission: "documents.upload",
    notificationTypes: ["kyc.started"],
  },
  {
    from: "kyc_in_progress",
    to: "kyc_pending_review",
    permission: "documents.upload",
    requiredPrerequisites: ["kycSubmitted"],
    notificationTypes: ["kyc.submitted"],
  },
  {
    from: "kyc_pending_review",
    to: "kyc_changes_requested",
    permission: "kyc.review",
    requiresReason: true,
    notificationTypes: ["kyc.changes_requested"],
  },
  {
    from: "kyc_changes_requested",
    to: "kyc_in_progress",
    permission: "documents.upload",
    notificationTypes: ["kyc.reopened"],
  },
  {
    from: "kyc_pending_review",
    to: "kyc_approved",
    permission: "kyc.approve",
    requiredPrerequisites: ["mandatoryDocumentsApproved"],
    notificationTypes: ["kyc.approved"],
  },
  {
    from: "kyc_approved",
    to: "engagement_letter_pending",
    permission: "templates.manage",
    notificationTypes: ["engagement_letter.pending_generation"],
  },
  {
    from: "engagement_letter_pending",
    to: "engagement_letter_generated",
    permission: "templates.manage",
    requiredPrerequisites: ["engagementLetterGenerated"],
    notificationTypes: ["engagement_letter.generated"],
  },
  {
    from: "engagement_letter_generated",
    to: "awaiting_client_signature",
    permission: "templates.manage",
    notificationTypes: ["signature.requested"],
  },
  {
    from: "awaiting_client_signature",
    to: "signature_changes_requested",
    permission: "engagements.create",
    requiresReason: true,
    notificationTypes: ["signature.changes_requested"],
  },
  {
    from: "signature_changes_requested",
    to: "engagement_letter_pending",
    permission: "templates.manage",
    notificationTypes: ["engagement_letter.amendment_requested"],
  },
  {
    from: "awaiting_client_signature",
    to: "ready_to_start",
    permission: "engagements.create",
    requiredPrerequisites: ["clientSignatureCompleted"],
    notificationTypes: ["signature.completed"],
  },
  {
    from: "ready_to_start",
    to: "active",
    permission: "engagements.update_workflow",
    requiredPrerequisites: ["assignedStaff", "kycApproved", "clientSignatureCompleted"],
    notificationTypes: ["engagement.activated"],
  },
  {
    from: "active",
    to: "awaiting_client_action",
    permission: "engagements.update_workflow",
    notificationTypes: ["client.action_required"],
  },
  {
    from: "awaiting_client_action",
    to: "active",
    permission: "engagements.update_workflow",
    notificationTypes: ["client.action_completed"],
  },
  {
    from: "active",
    to: "awaiting_staff_action",
    permission: "engagements.update_workflow",
    notificationTypes: ["staff.action_required"],
  },
  {
    from: "awaiting_staff_action",
    to: "active",
    permission: "engagements.update_workflow",
    notificationTypes: ["staff.action_completed"],
  },
  {
    from: "active",
    to: "on_hold",
    permission: "engagements.update_workflow",
    requiresReason: true,
    notificationTypes: ["engagement.on_hold"],
  },
  {
    from: "on_hold",
    to: "active",
    permission: "engagements.update_workflow",
    notificationTypes: ["engagement.resumed"],
  },
  {
    from: "active",
    to: "completed",
    permission: "engagements.complete",
    requiredPrerequisites: ["requiredTasksCompleted", "finalDeliverablesAccepted"],
    notificationTypes: ["engagement.completed"],
  },
  {
    from: "completed",
    to: "archived",
    permission: "engagements.archive",
    requiredPrerequisites: ["archiveGracePeriodElapsed"],
    notificationTypes: ["workspace.archived"],
  },
  {
    from: "awaiting_kyc",
    to: "cancelled",
    permission: "engagements.accept",
    requiresReason: true,
    notificationTypes: ["engagement.cancelled"],
  },
  {
    from: "active",
    to: "cancelled",
    permission: "engagements.accept",
    requiresReason: true,
    notificationTypes: ["engagement.cancelled"],
  },
];

function findTransition<TStatus extends string>(
  transitions: readonly TransitionDefinition<TStatus>[],
  currentStatus: TStatus,
  nextStatus: TStatus,
) {
  return transitions.find(
    (transition) => transition.from === currentStatus && transition.to === nextStatus,
  );
}

function assertPrerequisites(
  transition: TransitionDefinition<string>,
  prerequisites: WorkflowPrerequisites,
) {
  const missing = (transition.requiredPrerequisites ?? []).filter(
    (prerequisite) => !prerequisites[prerequisite],
  );

  if (missing.length > 0) {
    throw new AppError("CONFLICT", `Missing workflow prerequisite(s): ${missing.join(", ")}`, 409);
  }
}

async function transitionStatus<TStatus extends string>(
  kind: TransitionKind,
  transitions: readonly TransitionDefinition<TStatus>[],
  input: TransitionInput<TStatus>,
): Promise<TransitionResult<TStatus>> {
  const transition = findTransition(transitions, input.currentStatus, input.nextStatus);

  if (!transition) {
    throw new AppError(
      "CONFLICT",
      `Invalid ${kind} status transition: ${input.currentStatus} -> ${input.nextStatus}`,
      409,
    );
  }

  if (input.actor.readOnly) {
    throw new AuthorizationError("Read-only users cannot transition workflow status.");
  }

  assertPermission(input.actor, transition.permission);
  assertPrerequisites(transition, input.prerequisites ?? {});

  if (transition.requiresReason && !input.reason?.trim()) {
    throw new AppError("VALIDATION_ERROR", "A transition reason is required.", 422);
  }

  await input.audit?.({
    actor: input.actor,
    action: `${kind}.status_transitioned`,
    resourceType: kind,
    resourceId: input.resourceId,
    previousValues: { status: input.currentStatus },
    newValues: { status: input.nextStatus },
    reason: input.reason,
  });

  return {
    status: input.nextStatus,
    notifications: [...transition.notificationTypes],
  };
}

export function canTransitionEngagementRequest(
  currentStatus: EngagementRequestStatus,
  nextStatus: EngagementRequestStatus,
) {
  return Boolean(findTransition(requestTransitions, currentStatus, nextStatus));
}

export function canTransitionEngagement(
  currentStatus: EngagementStatus,
  nextStatus: EngagementStatus,
) {
  return Boolean(findTransition(engagementTransitions, currentStatus, nextStatus));
}

export async function transitionEngagementRequestStatus(
  input: TransitionInput<EngagementRequestStatus>,
) {
  return transitionStatus("engagement_request", requestTransitions, input);
}

export async function transitionEngagementStatus(input: TransitionInput<EngagementStatus>) {
  return transitionStatus("engagement", engagementTransitions, input);
}
