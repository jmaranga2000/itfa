import {
  ENGAGEMENT_WORKSPACE_TABS,
  EngagementExecutionWorkspace,
  type EngagementWorkspaceTab,
} from "@/components/dashboard/engagements/engagement-execution-workspace";
import { EngagementUnavailable } from "@/components/dashboard/engagements/engagement-unavailable";
import { requirePermission } from "@/features/auth/server";
import { listEngagementTeamCandidates } from "@/repositories/engagement-management-repository";
import { getEngagementExecutionData } from "@/repositories/engagement-execution-repository";

function workspaceTab(value?: string): EngagementWorkspaceTab {
  return ENGAGEMENT_WORKSPACE_TABS.includes(value as EngagementWorkspaceTab)
    ? value as EngagementWorkspaceTab
    : "overview";
}

export default async function AdminActiveEngagementPage({
  params,
  searchParams,
}: {
  params: Promise<{ workflowId: string }>;
  searchParams: Promise<{ error?: string; saved?: string; missing?: string; tab?: string; team?: string; note?: string; replace?: string; transitionError?: string; transitioned?: string }>;
}) {
  const principal = await requirePermission("engagements.read_all");
  const [{ workflowId }, query] = await Promise.all([params, searchParams]);
  const [data, candidates] = await Promise.all([
    getEngagementExecutionData(principal, workflowId),
    listEngagementTeamCandidates(principal),
  ]);
  if (!data) return <EngagementUnavailable backHref="/admin/active-engagements" />;

  return (
    <EngagementExecutionWorkspace
      activeTab={workspaceTab(query.tab)}
      data={data}
      portal="admin"
      principal={{ id: principal.id, roleKeys: principal.roleKeys }}
      query={query}
      teamCandidates={candidates}
    />
  );
}
