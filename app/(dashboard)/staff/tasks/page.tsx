import { WorkflowTasks } from "@/components/dashboard/workflows/workflow-tasks";
import { requireStaffRoute } from "@/features/staff/server";
import { listWorkflowTasksForPrincipal } from "@/repositories/workflow-repository";
import { listStaffKycTasks } from "@/repositories/staff-work-repository";

export default async function StaffTasksPage() {
  const { principal } = await requireStaffRoute("tasks");
  const [tasks, kycTasks] = await Promise.all([
    listWorkflowTasksForPrincipal(principal),
    principal.roleKeys.includes("reviewer") ? listStaffKycTasks(principal) : Promise.resolve([]),
  ]);

  return <WorkflowTasks tasks={[
    ...kycTasks,
    ...tasks.map((task) => ({ ...task, href: `/staff/engagements/${task.workflowId}` })),
  ]} />;
}
