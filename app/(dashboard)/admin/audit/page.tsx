import { AdminAudit } from "@/components/dashboard/admin/admin-audit";
import { requirePermission } from "@/features/auth/server";
import { listAdminAuditRecords } from "@/repositories/admin-audit-repository";

export default async function AdminAuditPage({ searchParams }: {
  searchParams: Promise<{ query?: string; resourceType?: string; actor?: string }>;
}) {
  await requirePermission("audit_logs.read");
  const query = await searchParams;
  const current = {
    query: query.query?.trim() ?? "",
    resourceType: query.resourceType?.trim() ?? "",
    actor: query.actor?.trim() ?? "",
  };
  const data = await listAdminAuditRecords(current);
  return <AdminAudit current={current} data={data} />;
}
