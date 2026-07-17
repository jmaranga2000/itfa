import { AdminActiveEngagements } from "@/components/dashboard/admin/admin-active-engagements";
import { requirePermission } from "@/features/auth/server";
import { listWorkflowsForPrincipal } from "@/repositories/workflow-repository";

export default async function AdminActiveEngagementsPage({
  searchParams,
}: {
  searchParams: Promise<{ activated?: string }>;
}) {
  const [principal, query] = await Promise.all([requirePermission("engagements.read_all"), searchParams]);
  const workflows = await listWorkflowsForPrincipal(principal);

  return <AdminActiveEngagements activatedWorkflowId={query.activated} workflows={workflows} />;
}
