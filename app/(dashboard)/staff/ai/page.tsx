import { PortalAiWorkspace } from "@/components/dashboard/ai/portal-ai-workspace";
import { AI_WORKSPACE_KEYS } from "@/features/ai/workspaces";
import { requireStaffRoute } from "@/features/staff/server";
import { getPortalAiWorkspaceData } from "@/repositories/ai-conversation-repository";

export default async function StaffAiPage({ searchParams }: {
  searchParams: Promise<{ conversation?: string; new?: string; error?: string; archived?: string }>;
}) {
  const { principal } = await requireStaffRoute("ai");
  const query = await searchParams;
  const data = await getPortalAiWorkspaceData(principal, "staff", query.conversation, query.new === "1");
  return <PortalAiWorkspace {...data} archived={query.archived === "1"} availableWorkspaces={AI_WORKSPACE_KEYS} error={query.error} portal="staff" />;
}
