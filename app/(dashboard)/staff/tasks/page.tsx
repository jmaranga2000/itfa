import { WorkflowTasks } from "@/components/dashboard/workflows/workflow-tasks";
import { requireStaffRoute } from "@/features/staff/server";
import { listWorkflowTasksForPrincipal } from "@/repositories/workflow-repository";
import { listStaffKycTasks } from "@/repositories/staff-work-repository";

export default async function StaffTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const [{ principal }, query] = await Promise.all([
    requireStaffRoute("tasks"),
    searchParams,
  ]);
  const [tasks, kycTasks] = await Promise.all([
    listWorkflowTasksForPrincipal(principal),
    principal.roleKeys.includes("reviewer") ? listStaffKycTasks(principal) : Promise.resolve([]),
  ]);

  const returnTo = query.returnTo?.startsWith("/staff/engagements/")
    ? query.returnTo
    : "/staff/engagements";

  return (
    <WorkflowTasks
      backHref={returnTo}
      backLabel="Back to engagements"
      tasks={[
        ...kycTasks,
        ...tasks.map((task) => ({ ...task, href: `/staff/engagements/${task.workflowId}` })),
      ]}
    />
  );
}
