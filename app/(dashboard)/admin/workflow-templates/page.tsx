import { WorkflowBuilder } from "@/components/dashboard/workflows/workflow-builder";
import { listWorkflowTemplatesForAdmin } from "@/repositories/workflow-repository";

export default async function AdminWorkflowTemplatesPage() {
  const templates = await listWorkflowTemplatesForAdmin();

  return <WorkflowBuilder templates={templates} />;
}
