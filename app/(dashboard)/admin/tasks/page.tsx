import { WorkflowTasks } from "@/components/dashboard/workflows/workflow-tasks";
import { requireUser } from "@/features/auth/server";
import { listWorkflowTasksForPrincipal } from "@/repositories/workflow-repository";

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const [principal, query] = await Promise.all([requireUser(), searchParams]);
  const tasks = await listWorkflowTasksForPrincipal(principal);
  const returnTo = query.returnTo?.startsWith("/admin/active-engagements/") || query.returnTo?.startsWith("/admin/workflows/")
    ? query.returnTo
    : "/admin/workflows";

  return <WorkflowTasks backHref={returnTo} backLabel={returnTo.startsWith("/admin/active-engagements/") ? "Back to engagement" : "Back to workflow monitor"} tasks={tasks} />;
}
