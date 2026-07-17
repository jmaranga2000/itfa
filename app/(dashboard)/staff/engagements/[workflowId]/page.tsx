import { notFound } from "next/navigation";
import { StaffEngagementDetail } from "@/components/dashboard/staff/staff-engagement-detail";
import { requireStaffRoute } from "@/features/staff/server";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

export default async function StaffEngagementDetailPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const [{ principal }, { workflowId }] = await Promise.all([
    requireStaffRoute("engagements"),
    params,
  ]);
  const workflow = await getWorkflowForPrincipal(principal, workflowId);
  if (!workflow) notFound();

  return <StaffEngagementDetail workflow={workflow} />;
}
