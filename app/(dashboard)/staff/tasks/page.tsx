import { WorkflowTasks } from "@/components/dashboard/workflows/workflow-tasks";
import { requireStaffRoute } from "@/features/staff/server";
import { listWorkflowTasksForPrincipal } from "@/repositories/workflow-repository";

export default async function StaffTasksPage() {
  const { principal } = await requireStaffRoute("tasks");
  const tasks = await listWorkflowTasksForPrincipal(principal);

  return <WorkflowTasks tasks={tasks.map((task) => ({ ...task, href: `/staff/engagements/${task.workflowId}` }))} />;
}
