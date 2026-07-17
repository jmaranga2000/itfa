import { AdminIntegrations } from "@/components/dashboard/admin/admin-integrations";
import { requirePermission } from "@/features/auth/server";
import { listIntegrationConnections } from "@/repositories/integration-repository";

export default async function AdminIntegrationsPage() {
  await requirePermission("settings.manage");
  const connections = await listIntegrationConnections();
  return <AdminIntegrations connections={connections} />;
}
