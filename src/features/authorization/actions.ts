"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/features/audit/audit-service";
import { requirePermission } from "@/features/auth/server";
import { APP_ROLES } from "@/features/authorization/roles";
import { isPermission, type Permission } from "@/features/authorization/permissions";
import { getRoleForAdmin, updateRoleForAdmin } from "@/repositories/role-repository";

const roleSchema = z.object({
  roleKey: z.enum(APP_ROLES),
  label: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(300),
});

export async function updateRoleAccessAction(formData: FormData) {
  const actor = await requirePermission("permissions.manage");
  const parsed = roleSchema.safeParse({
    roleKey: formData.get("roleKey"),
    label: formData.get("label"),
    description: formData.get("description"),
  });
  const rawRoleKey = String(formData.get("roleKey") ?? "");
  if (!parsed.success) redirect(`/admin/permissions/${rawRoleKey}?error=invalid`);
  const previous = await getRoleForAdmin(parsed.data.roleKey);
  if (!previous) redirect("/admin/permissions");
  const permissions = formData
    .getAll("permissions")
    .map(String)
    .filter((permission): permission is Permission => isPermission(permission));
  const savedPermissions = await updateRoleForAdmin({
    ...parsed.data,
    permissions: [...new Set(permissions)],
  });
  await writeAuditLog({
    actor,
    action: "role.access_updated",
    resourceType: "Role",
    resourceId: parsed.data.roleKey,
    previousValues: {
      label: previous.role.label,
      description: previous.role.description,
      permissions: previous.role.permissions,
    },
    newValues: {
      label: parsed.data.label,
      description: parsed.data.description,
      permissions: savedPermissions,
    },
  });
  revalidatePath("/admin/permissions");
  revalidatePath(`/admin/permissions/${parsed.data.roleKey}`);
  redirect(`/admin/permissions/${parsed.data.roleKey}?saved=1`);
}
