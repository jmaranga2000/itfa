import { PortalAiWorkspace } from "@/components/dashboard/ai/portal-ai-workspace";
import { CLIENT_AI_WORKSPACE_KEYS } from "@/features/ai/workspaces";
import { requireUser } from "@/features/auth/server";
import { getPortalAiWorkspaceData } from "@/repositories/ai-conversation-repository";

export default async function ClientAiPage({ searchParams }: {
  searchParams: Promise<{ conversation?: string; new?: string; error?: string; archived?: string }>;
}) {
  const principal = await requireUser();
  const query = await searchParams;
  const data = await getPortalAiWorkspaceData(principal, "client", query.conversation, query.new === "1");
  return <PortalAiWorkspace {...data} archived={query.archived === "1"} availableWorkspaces={CLIENT_AI_WORKSPACE_KEYS} error={query.error} portal="client" />;
}
