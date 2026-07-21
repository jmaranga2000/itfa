import { AdminActiveEngagements } from "@/components/dashboard/admin/admin-active-engagements";
import { requirePermission } from "@/features/auth/server";
import type { EngagementHealthStatus } from "@/repositories/engagement-execution-repository";
import { listWorkflowsForPrincipal } from "@/repositories/workflow-repository";

const healthStatuses: EngagementHealthStatus[] = ["on_track", "waiting_for_client", "waiting_for_review", "waiting_for_payment", "overdue"];

export default async function AdminActiveEngagementsPage({
  searchParams,
}: {
  searchParams: Promise<{ activated?: string; health?: string }>;
}) {
  const [principal, query] = await Promise.all([requirePermission("engagements.read_all"), searchParams]);
  const workflows = await listWorkflowsForPrincipal(principal);

  const healthStatus = healthStatuses.includes(query.health as EngagementHealthStatus)
    ? query.health as EngagementHealthStatus
    : undefined;
  return <AdminActiveEngagements activatedWorkflowId={query.activated} healthStatus={healthStatus} workflows={workflows} />;
}
