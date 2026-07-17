import { APP_ROLES, ROLE_LABELS, ROLE_PERMISSION_MATRIX, type AppRole } from "@/features/authorization/roles";
import { PERMISSION_DESCRIPTIONS, PERMISSIONS, type Permission } from "@/features/authorization/permissions";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RoleModel } from "@/models/role";
import { UserModel } from "@/models/user";

export type AdminRoleRecord = {
  key: AppRole;
  label: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  systemManaged: boolean;
  updatedAt: string | null;
};

type RawRole = {
  key: AppRole;
  label: string;
  description: string;
  permissions?: Permission[];
  systemManaged?: boolean;
  updatedAt?: Date | null;
};

function fallbackRole(key: AppRole): AdminRoleRecord {
  return {
    key,
    label: ROLE_LABELS[key],
    description: `${ROLE_LABELS[key]} role for IFTA Consulting portal access.`,
    permissions: [...ROLE_PERMISSION_MATRIX[key]],
    userCount: 0,
    systemManaged: true,
    updatedAt: null,
  };
}

export async function listRolesForAdmin(): Promise<AdminRoleRecord[]> {
  await connectToDatabase();
  const [roleRecords, roleCounts] = await Promise.all([
    RoleModel.find({}).sort({ label: 1 }).lean().exec(),
    UserModel.aggregate<{ _id: string; count: number }>([
      { $match: { status: { $ne: "archived" } } },
      { $unwind: "$roleKeys" },
      { $group: { _id: "$roleKeys", count: { $sum: 1 } } },
    ]).exec(),
  ]);
  const rolesByKey = new Map((roleRecords as RawRole[]).map((role) => [role.key, role]));
  const countsByKey = new Map(roleCounts.map((entry) => [entry._id, entry.count]));

  return APP_ROLES.map((key) => {
    const role = rolesByKey.get(key);
    const fallback = fallbackRole(key);
    return {
      ...fallback,
      ...(role
        ? {
            label: role.label,
            description: role.description,
            permissions: (role.permissions ?? []).filter((permission) => PERMISSIONS.includes(permission)),
            systemManaged: role.systemManaged ?? true,
            updatedAt: role.updatedAt?.toISOString() ?? null,
          }
        : {}),
      userCount: countsByKey.get(key) ?? 0,
    };
  });
}

export async function getRoleForAdmin(roleKey: AppRole) {
  const roles = await listRolesForAdmin();
  const role = roles.find((item) => item.key === roleKey) ?? null;
  if (!role) return null;
  return {
    role,
    permissions: PERMISSIONS.map((key) => ({
      key,
      description: PERMISSION_DESCRIPTIONS[key],
      enabled: role.permissions.includes(key),
      group: key.split(".")[0],
    })),
  };
}

export async function updateRoleForAdmin(input: {
  roleKey: AppRole;
  label: string;
  description: string;
  permissions: Permission[];
}) {
  await connectToDatabase();
  const permissions = input.roleKey === "super_admin" ? [...PERMISSIONS] : input.permissions;
  await RoleModel.updateOne(
    { key: input.roleKey },
    {
      $set: {
        label: input.label,
        description: input.description,
        permissions,
        systemManaged: true,
      },
      $setOnInsert: { key: input.roleKey },
    },
    { upsert: true },
  ).exec();
  return permissions;
}
