import { AdminAiWorkspace } from "@/components/dashboard/admin/admin-ai-workspace";
import { requirePermission } from "@/features/auth/server";
import { getAdminAiWorkspaceData } from "@/repositories/ai-conversation-repository";

export default async function AdminAiUsagePage({
  searchParams,
}: {
  searchParams: Promise<{
    conversation?: string;
    new?: string;
    error?: string;
    archived?: string;
  }>;
}) {
  const principal = await requirePermission("ai.admin");
  const query = await searchParams;
  const data = await getAdminAiWorkspaceData(query.conversation, query.new === "1");

  return (
    <AdminAiWorkspace
      {...data}
      archived={query.archived === "1"}
      error={query.error}
      principalId={principal.id}
    />
  );
}
