import { WorkflowBuilder } from "@/components/dashboard/workflows/workflow-builder";
import { requirePermission } from "@/features/auth/server";
import { listWorkflowTemplatesForAdmin } from "@/repositories/workflow-repository";

export default async function AdminWorkflowTemplatesPage() {
  await requirePermission("templates.read");
  const templates = await listWorkflowTemplatesForAdmin();

  return <WorkflowBuilder templates={templates} />;
}
