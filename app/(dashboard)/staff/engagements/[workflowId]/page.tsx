import {
  ENGAGEMENT_WORKSPACE_TABS,
  EngagementExecutionWorkspace,
  type EngagementWorkspaceTab,
} from "@/components/dashboard/engagements/engagement-execution-workspace";
import { redirect } from "next/navigation";
import { requireStaffRoute } from "@/features/staff/server";
import { getEngagementExecutionData } from "@/repositories/engagement-execution-repository";

function workspaceTab(value?: string): EngagementWorkspaceTab {
  return ENGAGEMENT_WORKSPACE_TABS.includes(value as EngagementWorkspaceTab)
    ? value as EngagementWorkspaceTab
    : "overview";
}

export default async function StaffEngagementDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workflowId: string }>;
  searchParams: Promise<{ error?: string; saved?: string; missing?: string; tab?: string; replace?: string }>;
}) {
  const [{ principal }, { workflowId }, query] = await Promise.all([
    requireStaffRoute("engagements"),
    params,
    searchParams,
  ]);
  const data = await getEngagementExecutionData(principal, workflowId);
  if (!data) redirect("/access-blocked");

  return (
    <EngagementExecutionWorkspace
      activeTab={workspaceTab(query.tab)}
      data={data}
      portal="staff"
      principal={{ id: principal.id, roleKeys: principal.roleKeys }}
      query={query}
    />
  );
}
