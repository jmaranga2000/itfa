"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { APP_ROLES, isAppRole, type AppRole } from "@/features/authorization/roles";
import { requirePermission } from "@/features/auth/server";
import { writeAuditLog } from "@/features/audit/audit-service";
import { assignRolesToUser } from "@/repositories/user-repository";

export type AssignRolesState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const assignRolesSchema = z.object({
  userId: z.string().min(1),
  roleKeys: z.array(z.enum(APP_ROLES)).min(1),
});

export async function assignRolesToUserAction(
  _previousState: AssignRolesState,
  formData: FormData,
): Promise<AssignRolesState> {
  const actor = await requirePermission("permissions.manage");
  const requestedRoles = formData
    .getAll("roleKeys")
    .filter((value): value is AppRole => typeof value === "string" && isAppRole(value));

  const parsed = assignRolesSchema.safeParse({
    userId: formData.get("userId"),
    roleKeys: requestedRoles,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted role fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const updated = await assignRolesToUser(parsed.data.userId, parsed.data.roleKeys);

  if (!updated) {
    return {
      ok: false,
      message: "The selected user could not be found.",
    };
  }

  await writeAuditLog({
    actor,
    action: "permissions.user_roles_assigned",
    resourceType: "User",
    resourceId: updated._id.toString(),
    newValues: { roleKeys: parsed.data.roleKeys },
    reason: "Role assignment through admin server action.",
  });

  revalidatePath("/admin/staff");

  return {
    ok: true,
    message: "User roles updated.",
  };
}
