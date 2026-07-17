import { AdminPermissions } from "@/components/dashboard/admin/admin-permissions";
import { requirePermission } from "@/features/auth/server";
import { listRolesForAdmin } from "@/repositories/role-repository";

export default async function AdminPermissionsPage() {
  await requirePermission("permissions.manage");
  const roles = await listRolesForAdmin();
  return <AdminPermissions roles={roles} />;
}
