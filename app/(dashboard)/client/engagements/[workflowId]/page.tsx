import {
  ENGAGEMENT_WORKSPACE_TABS,
  EngagementExecutionWorkspace,
  type EngagementWorkspaceTab,
} from "@/components/dashboard/engagements/engagement-execution-workspace";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/server";
import { getEngagementExecutionData } from "@/repositories/engagement-execution-repository";

function workspaceTab(value?: string): EngagementWorkspaceTab {
  return ENGAGEMENT_WORKSPACE_TABS.includes(value as EngagementWorkspaceTab)
    ? value as EngagementWorkspaceTab
    : "overview";
}

export default async function ClientEngagementDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workflowId: string }>;
  searchParams: Promise<{ error?: string; saved?: string; missing?: string; tab?: string; replace?: string }>;
}) {
  const [principal, { workflowId }, query] = await Promise.all([
    requireUser(),
    params,
    searchParams,
  ]);
  const data = await getEngagementExecutionData(principal, workflowId);
  if (!data || data.workflow.clientUserId !== principal.id) {
    redirect("/access-blocked");
  }

  return (
    <EngagementExecutionWorkspace
      activeTab={workspaceTab(query.tab)}
      data={data}
      portal="client"
      principal={{ id: principal.id, roleKeys: principal.roleKeys }}
      query={query}
    />
  );
}
