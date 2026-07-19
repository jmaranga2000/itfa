import { Types } from "mongoose";
import {
  assertPermission,
  type Principal,
} from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuthorizationError } from "@/lib/errors";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { createCommunicationNotification } from "@/repositories/communication-repository";

export const ENGAGEMENT_TEAM_ROLES = ["consultant", "reviewer", "finance_officer"] as const;
export type EngagementTeamRole = (typeof ENGAGEMENT_TEAM_ROLES)[number];

export type EngagementTeamCandidate = {
  id: string;
  name: string;
  email: string;
  roleKeys: EngagementTeamRole[];
  departments: Record<EngagementTeamRole, string>;
  activeEngagements: number;
  workloadLevel: "available" | "balanced" | "high" | "overloaded";
  heavyWorkload: boolean;
};

const departmentByRole: Record<EngagementTeamRole, string> = {
  consultant: "Consulting",
  reviewer: "Quality and Compliance",
  finance_officer: "Finance",
};

function assertAdministrator(principal: Principal) {
  assertPermission(principal, "engagements.assign");
  if (!principal.roleKeys.some((role) => role === "admin" || role === "super_admin")) {
    throw new AuthorizationError("Only an administrator can change engagement assignments.");
  }
}

function workloadLevel(count: number): EngagementTeamCandidate["workloadLevel"] {
  if (count >= 7) return "overloaded";
  if (count >= 5) return "high";
  if (count >= 2) return "balanced";
  return "available";
}

async function activeEngagementCounts(userIds: Types.ObjectId[]) {
  if (userIds.length === 0) return new Map<string, number>();
  const rows = await WorkflowInstanceModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { status: "active", archivedAt: null, "team.userId": { $in: userIds } } },
    { $unwind: "$team" },
    { $match: { "team.userId": { $in: userIds } } },
    { $group: { _id: { userId: "$team.userId", workflowId: "$_id" } } },
    { $group: { _id: "$_id.userId", count: { $sum: 1 } } },
  ]).exec();
  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}

export async function listEngagementTeamCandidates(principal: Principal) {
  assertAdministrator(principal);
  await connectToDatabase();
  const users = await UserModel.find({
    status: "active",
    archivedAt: null,
    roleKeys: { $in: ENGAGEMENT_TEAM_ROLES },
  }).select("firstName lastName email roleKeys").sort({ firstName: 1, lastName: 1 }).lean().exec();
  const counts = await activeEngagementCounts(users.map((user) => user._id));

  return users.map((user): EngagementTeamCandidate => {
    const roles = ENGAGEMENT_TEAM_ROLES.filter((role) => user.roleKeys.includes(role));
    const activeEngagements = counts.get(user._id.toString()) ?? 0;
    return {
      id: user._id.toString(),
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
      email: user.email,
      roleKeys: roles,
      departments: departmentByRole,
      activeEngagements,
      workloadLevel: workloadLevel(activeEngagements),
      heavyWorkload: activeEngagements >= 5,
    };
  });
}

function selectedRoleForTask(role: string): EngagementTeamRole | null {
  if (role === "consultant" || role === "lead_consultant") return "consultant";
  if (role === "reviewer") return "reviewer";
  if (role === "finance_officer") return "finance_officer";
  return null;
}

export async function assignEngagementTeam(input: {
  principal: Principal;
  workflowId: string;
  consultantUserId: string;
  reviewerUserId: string;
  financeOfficerUserId: string;
}) {
  assertAdministrator(input.principal);
  const selectedIds = [input.consultantUserId, input.reviewerUserId, input.financeOfficerUserId];
  if (!Types.ObjectId.isValid(input.workflowId) || selectedIds.some((id) => !Types.ObjectId.isValid(id))) {
    return { ok: false as const, reason: "invalid" as const };
  }
  if (new Set(selectedIds).size !== selectedIds.length) {
    return { ok: false as const, reason: "duplicate" as const };
  }

  await connectToDatabase();
  const [workflow, selectedUsers] = await Promise.all([
    WorkflowInstanceModel.findOne({ _id: input.workflowId, status: "active", archivedAt: null }).exec(),
    UserModel.find({ _id: { $in: selectedIds }, status: "active", archivedAt: null })
      .select("firstName lastName email roleKeys")
      .exec(),
  ]);
  if (!workflow || selectedUsers.length !== 3) return { ok: false as const, reason: "not_found" as const };

  const selections: Array<{ role: EngagementTeamRole; userId: string }> = [
    { role: "consultant", userId: input.consultantUserId },
    { role: "reviewer", userId: input.reviewerUserId },
    { role: "finance_officer", userId: input.financeOfficerUserId },
  ];
  const selected = selections.map((selection) => {
    const user = selectedUsers.find((item) => item._id.toString() === selection.userId);
    if (!user || !user.roleKeys.includes(selection.role)) return null;
    return { selection, user };
  });
  if (selected.some((item) => !item)) return { ok: false as const, reason: "role" as const };

  const resolved = selected.filter((item): item is NonNullable<typeof item> => Boolean(item));
  const counts = await activeEngagementCounts(resolved.map((item) => item.user._id));
  const previousTeamIds = workflow.team
    .filter((member) => ENGAGEMENT_TEAM_ROLES.includes(member.role as EngagementTeamRole))
    .map((member) => member.userId?.toString())
    .filter((value): value is string => Boolean(value));
  const now = new Date();
  const wasAwaitingTeam = workflow.currentStageKey === "team_assignment" || !workflow.teamAssignedAt;

  workflow.set("team", resolved.map(({ selection, user }) => {
    const activeEngagements = counts.get(user._id.toString()) ?? 0;
    return {
      userId: user._id,
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
      email: user.email,
      role: selection.role,
      department: departmentByRole[selection.role],
      workloadLevel: workloadLevel(activeEngagements),
    };
  }));

  const consultant = resolved.find((item) => item.selection.role === "consultant")!;
  workflow.responsibleUserId = consultant.user._id;
  workflow.responsibleUserName = `${consultant.user.firstName ?? ""} ${consultant.user.lastName ?? ""}`.trim() || consultant.user.email;
  workflow.teamAssignedAt = workflow.teamAssignedAt ?? now;
  workflow.lastActivityAt = now;

  if (wasAwaitingTeam) {
    const assignmentStage = workflow.stages.find((stage) => stage.key === "team_assignment");
    if (assignmentStage) {
      assignmentStage.status = "completed";
      assignmentStage.completedAt = now;
      assignmentStage.blockedReason = null;
    }
    const nextStage = [...workflow.stages]
      .sort((left, right) => left.order - right.order)
      .find((stage) => stage.key !== "team_assignment" && stage.status !== "completed");
    if (nextStage) {
      nextStage.status = "in_progress";
      nextStage.enteredAt = now;
      nextStage.dueAt = new Date(now.getTime() + nextStage.expectedDurationDays * 86_400_000);
      workflow.currentStageKey = nextStage.key;
      workflow.nextAction = nextStage.clientTitle;
    }
  }

  for (const task of workflow.tasks) {
    const teamRole = selectedRoleForTask(task.assignedRole);
    const assignee = teamRole ? resolved.find((item) => item.selection.role === teamRole) : null;
    if (!assignee) continue;
    task.assignedUserId = assignee.user._id;
    task.assignedUserName = `${assignee.user.firstName ?? ""} ${assignee.user.lastName ?? ""}`.trim() || assignee.user.email;
    if (wasAwaitingTeam && task.stageKey === workflow.currentStageKey && task.status === "not_started") {
      task.status = "ready";
      task.dueDate = workflow.stages.find((stage) => stage.key === workflow.currentStageKey)?.dueAt ?? null;
    }
  }

  workflow.activity.push({
    type: "team_assigned",
    title: wasAwaitingTeam ? "Team Assigned" : "Team Updated",
    actorName: input.principal.displayName || input.principal.email,
    actorUserId: new Types.ObjectId(input.principal.id),
    description: resolved.map((item) => `${item.selection.role.replaceAll("_", " ")}: ${item.user.firstName} ${item.user.lastName}`.trim()).join("; "),
    relatedResource: workflow.reference,
    clientVisible: true,
    createdAt: now,
  });
  await workflow.save();

  const removedIds = previousTeamIds.filter((id) => !selectedIds.includes(id));
  await Promise.all([
    removedIds.length > 0
      ? UserModel.updateMany({ _id: { $in: removedIds } }, { $pull: { assignedEngagementIds: workflow._id } }).exec()
      : Promise.resolve(),
    UserModel.updateMany({ _id: { $in: selectedIds } }, { $addToSet: { assignedEngagementIds: workflow._id } }).exec(),
  ]);
  await Promise.allSettled(resolved.map(({ selection, user }) => createCommunicationNotification({
      recipientUserId: user._id.toString(),
      type: "task_assigned",
      title: `${selection.role.replaceAll("_", " ")} assignment`,
      description: `You have been assigned to ${workflow.reference} for ${workflow.clientName}.`,
      relatedModule: "engagements",
      relatedRecordId: workflow._id.toString(),
      actionUrl: `/staff/engagements/${workflow._id}`,
      createdByUserId: input.principal.id,
    })));
  await writeAuditLog({
    actor: input.principal,
    action: wasAwaitingTeam ? "engagement.team_assigned" : "engagement.team_updated",
    resourceType: "WorkflowInstance",
    resourceId: workflow._id.toString(),
    previousValues: { teamUserIds: previousTeamIds },
    newValues: { team: selections },
  });
  return { ok: true as const };
}

export async function addEngagementInternalNote(input: {
  principal: Principal;
  workflowId: string;
  body: string;
}) {
  assertAdministrator(input.principal);
  if (!Types.ObjectId.isValid(input.workflowId) || !Types.ObjectId.isValid(input.principal.id)) return false;
  const body = input.body.trim().slice(0, 2000);
  if (body.length < 3) return false;
  await connectToDatabase();
  const now = new Date();
  const result = await WorkflowInstanceModel.updateOne(
    { _id: input.workflowId, status: "active", archivedAt: null },
    {
      $push: {
        internalNotes: {
          body,
          createdByUserId: new Types.ObjectId(input.principal.id),
          createdByName: input.principal.displayName || input.principal.email,
          createdAt: now,
        },
        activity: {
          type: "internal_note_added",
          title: "Internal note added",
          actorName: input.principal.displayName || input.principal.email,
          actorUserId: new Types.ObjectId(input.principal.id),
          description: "An internal-only engagement note was recorded.",
          relatedResource: input.workflowId,
          clientVisible: false,
          createdAt: now,
        },
      },
      $set: { lastActivityAt: now },
    },
  ).exec();
  if (result.matchedCount === 0) return false;
  await writeAuditLog({
    actor: input.principal,
    action: "engagement.internal_note_added",
    resourceType: "WorkflowInstance",
    resourceId: input.workflowId,
  });
  return true;
}
