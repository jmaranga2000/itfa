import {
  canOverrideWorkflowTransition,
  getWorkflowForPrincipal,
  type WorkflowInstanceRecord,
} from "@/repositories/workflow-repository";
import type { Principal } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuthorizationError } from "@/lib/errors";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { UserModel } from "@/models/user";
import { createCommunicationNotification } from "@/repositories/communication-repository";
import type { WorkflowTransitionResult } from "@/features/workflows/types";

export type WorkflowTransitionInput = {
  workflowId: string;
  nextStageKey: string;
  actor: Principal;
  reason?: string;
  override?: boolean;
};

function currentStageIndex(workflow: WorkflowInstanceRecord) {
  return workflow.stages.findIndex((stage) => stage.key === workflow.currentStageKey);
}

function targetStageIndex(workflow: WorkflowInstanceRecord, nextStageKey: string) {
  return workflow.stages.findIndex((stage) => stage.key === nextStageKey);
}

function incompleteRequiredTasks(workflow: WorkflowInstanceRecord) {
  return workflow.tasks.filter(
    (task) =>
      task.stageKey === workflow.currentStageKey &&
      task.status !== "completed" &&
      task.status !== "cancelled",
  );
}

function unresolvedApprovals(workflow: WorkflowInstanceRecord) {
  return workflow.approvals.filter(
    (approval) =>
      approval.stageKey === workflow.currentStageKey &&
      approval.status !== "approved" &&
      approval.status !== "not_submitted",
  );
}

function missingRequiredDocuments(workflow: WorkflowInstanceRecord) {
  const stage = workflow.stages.find((item) => item.key === workflow.currentStageKey);
  const requiredDocuments = stage?.requiredDocuments ?? [];

  return requiredDocuments.filter(
    (documentName) =>
      !workflow.documents.some(
        (document) =>
          document.name.toLowerCase().includes(documentName.toLowerCase()) &&
          ["approved", "final"].includes(document.status),
      ),
  );
}

function incompleteClientActions(workflow: WorkflowInstanceRecord) {
  if (workflow.currentStageKey !== "client_review") return [];
  return workflow.clientActions.filter((action) => !["approved", "completed"].includes(action.status));
}

export function validateWorkflowTransition({
  workflow,
  nextStageKey,
  actor,
  reason,
  override = false,
}: {
  workflow: WorkflowInstanceRecord;
  nextStageKey: string;
  actor: Principal;
  reason?: string;
  override?: boolean;
}): WorkflowTransitionResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const currentIndex = currentStageIndex(workflow);
  const nextIndex = targetStageIndex(workflow, nextStageKey);
  const hasOverride = override && canOverrideWorkflowTransition(actor);

  if (workflow.status === "archived" || workflow.status === "read_only") {
    reasons.push("Archived or read-only workflows cannot be advanced.");
  }

  if (currentIndex === -1) {
    reasons.push("Current workflow stage is invalid.");
  }

  if (nextIndex === -1) {
    reasons.push("Requested next stage is not part of this workflow.");
  }

  if (currentIndex !== -1 && nextIndex !== -1 && nextIndex !== currentIndex + 1 && !hasOverride) {
    reasons.push("Workflow stages must advance in order unless an authorized override is used.");
  }

  if (override && !hasOverride) {
    reasons.push("You do not have permission to override workflow transitions.");
  }

  if (hasOverride && !reason?.trim()) {
    reasons.push("A reason is required when overriding workflow transition rules.");
  }

  const incompleteTasks = incompleteRequiredTasks(workflow);

  if (incompleteTasks.length > 0 && !hasOverride) {
    reasons.push(`${incompleteTasks.length} required task(s) are not completed.`);
  }

  const missingDocuments = missingRequiredDocuments(workflow);

  if (missingDocuments.length > 0 && !hasOverride) {
    reasons.push(`Missing required document(s): ${missingDocuments.join(", ")}.`);
  }

  const approvals = unresolvedApprovals(workflow);

  if (approvals.length > 0 && !hasOverride) {
    reasons.push(`${approvals.length} approval gate(s) still need a decision.`);
  }

  const clientActions = incompleteClientActions(workflow);
  if (clientActions.length > 0 && !hasOverride) {
    reasons.push(`${clientActions.length} client review action(s) still need a response.`);
  }

  const blockedItems = workflow.progress.blockedItems;

  if (blockedItems > 0 && !hasOverride) {
    reasons.push(`${blockedItems} blocker(s) must be resolved before transition.`);
  }

  if (workflow.progress.overdueItems > 0) {
    warnings.push(`${workflow.progress.overdueItems} overdue item(s) remain on this workflow.`);
  }

  if (hasOverride) {
    warnings.push("This transition will be recorded as an override in the audit history.");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    warnings,
    nextStageKey,
  };
}

export async function transitionWorkflowStage(input: WorkflowTransitionInput) {
  await connectToDatabase();

  if (!input.actor.roleKeys.some((role) => role === "admin" || role === "super_admin" || role === "engagement_manager")) {
    throw new AuthorizationError("Only an administrator or engagement manager can advance the engagement process.");
  }

  const workflow = await getWorkflowForPrincipal(input.actor, input.workflowId);

  if (!workflow) {
    throw new AuthorizationError("This workflow is outside your access scope.");
  }

  const administrator = input.actor.roleKeys.some((role) => role === "admin" || role === "super_admin");
  const assignedManager = input.actor.roleKeys.includes("engagement_manager") && (
    workflow.responsibleUserId === input.actor.id
    || workflow.team.some((member) => member.userId === input.actor.id)
    || workflow.tasks.some((task) => task.assignedUserId === input.actor.id)
  );
  if (!administrator && !assignedManager) {
    throw new AuthorizationError("You can view this engagement, but only its assigned manager can advance the process.");
  }

  const validation = validateWorkflowTransition({
    workflow,
    nextStageKey: input.nextStageKey,
    actor: input.actor,
    reason: input.reason,
    override: input.override,
  });

  if (!validation.allowed) {
    throw new AuthorizationError(validation.reasons.join(" "));
  }

  const currentStage = workflow.stages.find((stage) => stage.key === workflow.currentStageKey);
  const nextStage = workflow.stages.find((stage) => stage.key === input.nextStageKey);

  await WorkflowInstanceModel.updateOne(
    { _id: workflow.id },
    {
      $set: {
        currentStageKey: input.nextStageKey,
        nextAction: nextStage?.completionConditions[0] ?? "Review next required action",
        lastActivityAt: new Date(),
        "stages.$[current].status": "completed",
        "stages.$[current].completedAt": new Date(),
        "stages.$[next].status": "in_progress",
        "stages.$[next].enteredAt": new Date(),
      },
      $push: {
        activity: {
          type: "stage_changed",
          title: `Stage changed to ${nextStage?.name ?? input.nextStageKey}`,
          actorName: input.actor.email,
          actorUserId: input.actor.id,
          description: input.reason ?? `Advanced from ${currentStage?.name ?? workflow.currentStageKey}.`,
          relatedResource: workflow.reference,
          clientVisible: Boolean(nextStage?.clientVisible),
          createdAt: new Date(),
        },
      },
    },
    {
      arrayFilters: [{ "current.key": workflow.currentStageKey }, { "next.key": input.nextStageKey }],
    },
  ).exec();

  await writeAuditLog({
    actor: input.actor,
    action: "workflow.stage_changed",
    resourceType: "Workflow",
    resourceId: workflow.id,
    previousValues: { stage: workflow.currentStageKey },
    newValues: { stage: input.nextStageKey },
    reason: input.reason ?? null,
    metadata: {
      reference: workflow.reference,
      override: Boolean(input.override),
      warnings: validation.warnings,
    },
  });

  const recipientUserIds = [
    workflow.clientUserId,
    workflow.responsibleUserId,
    ...workflow.team.map((member) => member.userId),
  ].filter((value): value is string => Boolean(value) && value !== input.actor.id);

  const recipients = recipientUserIds.length
    ? await UserModel.find({ _id: { $in: recipientUserIds } }).select("roleKeys").lean().exec()
    : [];
  await Promise.all(recipients.map((recipient) => {
    const roles = recipient.roleKeys ?? [];
    const actionUrl = roles.some((role) => role === "client" || role === "client_representative")
      ? `/client/engagements/${workflow.id}?tab=overview`
      : roles.some((role) => role === "admin" || role === "super_admin")
        ? `/admin/active-engagements/${workflow.id}?tab=overview`
        : `/staff/engagements/${workflow.id}?tab=overview`;
    return createCommunicationNotification({
      recipientUserId: recipient._id.toString(),
      type: "engagement_update",
      title: `${workflow.reference} moved to ${nextStage?.name ?? input.nextStageKey}`,
      description: nextStage?.completionConditions[0] ?? "Review the next required engagement action.",
      relatedModule: "engagements",
      relatedRecordId: workflow.id,
      actionUrl,
      createdByUserId: input.actor.id,
    });
  }));

  return validation;
}
