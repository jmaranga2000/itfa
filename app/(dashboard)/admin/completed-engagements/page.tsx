import { AdminCompletedEngagements } from "@/components/dashboard/admin/admin-completed-engagements";
import { requirePermission } from "@/features/auth/server";
import { listWorkflowsForPrincipal } from "@/repositories/workflow-repository";

export default async function AdminCompletedEngagementsPage() {
  const principal = await requirePermission("engagements.read_all");
  const workflows = await listWorkflowsForPrincipal(principal);
  return <AdminCompletedEngagements workflows={workflows} />;
}
