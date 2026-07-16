import { WorkflowTasks } from "@/components/dashboard/workflows/workflow-tasks";
import { requireUser } from "@/features/auth/server";
import { listWorkflowTasksForPrincipal } from "@/repositories/workflow-repository";

export default async function StaffTasksPage() {
  const principal = await requireUser();
  const tasks = await listWorkflowTasksForPrincipal(principal);

  return (
    <WorkflowTasks
      tasks={tasks.map((task) => ({
        ...task,
        href: "/staff/tasks",
      }))}
    />
  );
}
