import { notifyTaskAssigned, notifyTaskOverdue } from "@/features/communication/event-notifications";
import { connectToDatabase } from "@/lib/db/mongoose";
import { WorkflowInstanceModel } from "@/models/workflow-instance";

export async function unlockReadyWorkflowTasks(workflowId: string) {
  await connectToDatabase();

  const workflow = await WorkflowInstanceModel.findById(workflowId).lean().exec();

  if (!workflow) {
    return { unlocked: 0 };
  }

  const completedTaskKeys = new Set(
    (workflow.tasks ?? [])
      .filter((task) => task.status === "completed")
      .map((task) => task.key),
  );
  const readyTaskKeys = (workflow.tasks ?? [])
    .filter((task) => task.status === "not_started")
    .filter((task) => (task.dependencies ?? []).every((dependency) => completedTaskKeys.has(dependency)))
    .map((task) => task.key);

  if (readyTaskKeys.length === 0) {
    return { unlocked: 0 };
  }

  await WorkflowInstanceModel.updateOne(
    { _id: workflow._id },
    {
      $set: {
        "tasks.$[task].status": "ready",
        lastActivityAt: new Date(),
      },
      $push: {
        activity: {
          type: "task_assigned",
          title: `${readyTaskKeys.length} task(s) unlocked`,
          actorName: "System",
          description: "Dependencies are complete and tasks are ready for work.",
          relatedResource: workflow.reference,
          clientVisible: false,
          createdAt: new Date(),
        },
      },
    },
    { arrayFilters: [{ "task.key": { $in: readyTaskKeys } }] },
  ).exec();

  await Promise.all(
    (workflow.tasks ?? [])
      .filter((task) => readyTaskKeys.includes(task.key) && task.assignedUserId)
      .map((task) =>
        notifyTaskAssigned({
          recipientUserIds: [String(task.assignedUserId)],
          title: task.title,
          description: `${workflow.reference} is ready for your action.`,
          relatedRecordId: String(workflow._id),
          actionUrl: `/staff/tasks`,
        }),
      ),
  );

  return { unlocked: readyTaskKeys.length };
}

export async function markOverdueWorkflowTasks() {
  await connectToDatabase();

  const now = new Date();
  const workflows = await WorkflowInstanceModel.find({
    archivedAt: null,
    "tasks.dueDate": { $lt: now },
    "tasks.status": { $nin: ["completed", "cancelled", "overdue"] },
  })
    .select("reference tasks team responsibleUserId")
    .lean()
    .exec();
  let overdue = 0;

  for (const workflow of workflows) {
    const overdueTasks = (workflow.tasks ?? []).filter(
      (task) =>
        task.dueDate &&
        task.dueDate < now &&
        !["completed", "cancelled", "overdue"].includes(task.status),
    );

    if (overdueTasks.length === 0) {
      continue;
    }

    overdue += overdueTasks.length;

    await WorkflowInstanceModel.updateOne(
      { _id: workflow._id },
      {
        $set: {
          "tasks.$[task].status": "overdue",
          riskLevel: "high",
          riskReason: "One or more tasks are overdue.",
          lastActivityAt: now,
        },
        $push: {
          activity: {
            type: "due_date_changed",
            title: `${overdueTasks.length} task(s) marked overdue`,
            actorName: "System",
            description: "The workflow has overdue staff action.",
            relatedResource: workflow.reference,
            clientVisible: false,
            createdAt: now,
          },
        },
      },
      { arrayFilters: [{ "task.key": { $in: overdueTasks.map((task) => task.key) } }] },
    ).exec();

    const recipients = [
      workflow.responsibleUserId ? String(workflow.responsibleUserId) : null,
      ...overdueTasks.map((task) => (task.assignedUserId ? String(task.assignedUserId) : null)),
    ].filter((value): value is string => Boolean(value));

    await notifyTaskOverdue({
      recipientUserIds: [...new Set(recipients)],
      title: `${workflow.reference} has overdue work`,
      description: overdueTasks.map((task) => task.title).join(", "),
      relatedRecordId: String(workflow._id),
      actionUrl: "/admin/tasks",
    });
  }

  return { overdue };
}

export async function prepareArchiveForCompletedWorkflows() {
  await connectToDatabase();

  const result = await WorkflowInstanceModel.updateMany(
    {
      status: "completed",
      "archive.status": "not_ready",
      completionChecklist: { $not: { $elemMatch: { completed: false } } },
    },
    {
      $set: {
        "archive.status": "grace_period",
        "archive.retentionUntil": new Date(Date.now() + 30 * 86_400_000),
        lastActivityAt: new Date(),
      },
      $push: {
        activity: {
          type: "engagement_completed",
          title: "Archive grace period started",
          actorName: "System",
          description: "Completion checklist is satisfied and the workspace is preparing for archive.",
          relatedResource: "archive",
          clientVisible: false,
          createdAt: new Date(),
        },
      },
    },
  ).exec();

  return { prepared: result.modifiedCount };
}
