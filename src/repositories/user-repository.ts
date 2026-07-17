import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { isPermission, type Permission } from "@/features/authorization/permissions";
import { isAppRole, type AppRole } from "@/features/authorization/roles";
import type {
  StaffAccountRole,
  StaffAccountStatus,
} from "@/features/staff/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RoleModel } from "@/models/role";
import { UserModel } from "@/models/user";

export type CreateUserWithPasswordInput = {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  roleKeys?: AppRole[];
};

export type AuthUserRecord = {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  roleKeys?: AppRole[];
  emailVerifiedAt?: Date | null;
  status?: string;
};

export type VerificationUserRecord = {
  _id: Types.ObjectId;
  email: string;
  emailVerifiedAt?: Date | null;
  status?: string;
};

export type AdminDirectoryUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roleKeys: AppRole[];
  directPermissions: Permission[];
  clientOrganizationCount: number;
  assignedEngagementCount: number;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
};

type RawAdminDirectoryUser = {
  _id: Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  roleKeys?: AppRole[];
  directPermissions?: Permission[];
  clientOrganizationIds?: Types.ObjectId[];
  assignedEngagementIds?: Types.ObjectId[];
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  archivedAt?: Date | null;
};

const clientDirectoryRoles: AppRole[] = ["client", "client_representative"];
const staffDirectoryRoles: AppRole[] = [
  "super_admin",
  "admin",
  "engagement_manager",
  "consultant",
  "reviewer",
  "finance_officer",
  "document_controller",
  "support_staff",
  "auditor",
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeObjectIds(values: unknown[] | undefined) {
  return (values ?? []).map((value) => String(value));
}

function normalizeRoles(values: unknown[] | undefined): AppRole[] {
  const roles = (values ?? []).filter(
    (value): value is AppRole => typeof value === "string" && isAppRole(value),
  );

  return roles.length > 0 ? roles : ["client"];
}

function normalizePermissions(values: unknown[] | undefined): Permission[] {
  return (values ?? []).filter(
    (value): value is Permission => typeof value === "string" && isPermission(value),
  );
}

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function serializeAdminDirectoryUser(user: RawAdminDirectoryUser): AdminDirectoryUser {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    status: user.status ?? "active",
    roleKeys: normalizeRoles(user.roleKeys),
    directPermissions: normalizePermissions(user.directPermissions),
    clientOrganizationCount: user.clientOrganizationIds?.length ?? 0,
    assignedEngagementCount: user.assignedEngagementIds?.length ?? 0,
    emailVerifiedAt: serializeDate(user.emailVerifiedAt),
    lastLoginAt: serializeDate(user.lastLoginAt),
    createdAt: serializeDate(user.createdAt),
    updatedAt: serializeDate(user.updatedAt),
    archivedAt: serializeDate(user.archivedAt),
  };
}

async function listUsersForAdminDirectory(filter: Record<string, unknown>) {
  await connectToDatabase();

  const users = await UserModel.find(filter)
    .select(
      "email firstName lastName status roleKeys directPermissions clientOrganizationIds assignedEngagementIds emailVerifiedAt lastLoginAt createdAt updatedAt archivedAt",
    )
    .sort({ createdAt: -1, email: 1 })
    .limit(100)
    .lean()
    .exec();

  return (users as RawAdminDirectoryUser[]).map(serializeAdminDirectoryUser);
}

export async function listRegisteredClientsForAdmin() {
  return listUsersForAdminDirectory({
    roleKeys: { $in: clientDirectoryRoles },
    status: { $ne: "archived" },
  });
}

export async function getRegisteredClientForAdmin(clientId: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(clientId)) {
    return null;
  }

  const user = await UserModel.findOne({
    _id: new Types.ObjectId(clientId),
    roleKeys: { $in: clientDirectoryRoles },
    status: { $ne: "archived" },
  })
    .select(
      "email firstName lastName status roleKeys directPermissions clientOrganizationIds assignedEngagementIds emailVerifiedAt lastLoginAt createdAt updatedAt archivedAt",
    )
    .lean()
    .exec();

  return user ? serializeAdminDirectoryUser(user as RawAdminDirectoryUser) : null;
}

export async function listStaffForAdmin() {
  return listUsersForAdminDirectory({
    roleKeys: { $in: staffDirectoryRoles },
    status: { $ne: "archived" },
  });
}

export async function getStaffForAdmin(staffId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(staffId)) return null;

  const user = await UserModel.findOne({
    _id: new Types.ObjectId(staffId),
    roleKeys: { $in: staffDirectoryRoles },
    status: { $ne: "archived" },
  })
    .select(
      "email firstName lastName status roleKeys directPermissions clientOrganizationIds assignedEngagementIds emailVerifiedAt lastLoginAt createdAt updatedAt archivedAt",
    )
    .lean()
    .exec();

  return user ? serializeAdminDirectoryUser(user as RawAdminDirectoryUser) : null;
}

export async function staffEmailExists(email: string, excludeUserId?: string) {
  await connectToDatabase();
  const excludeId =
    excludeUserId && Types.ObjectId.isValid(excludeUserId)
      ? new Types.ObjectId(excludeUserId)
      : null;

  return Boolean(
    await UserModel.exists({
      email: normalizeEmail(email),
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).exec(),
  );
}

export async function createStaffAccount(input: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: StaffAccountRole;
  status: StaffAccountStatus;
}) {
  await connectToDatabase();
  const user = await UserModel.create({
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    status: input.status,
    roleKeys: [input.role],
    directPermissions: [],
    clientOrganizationIds: [],
    assignedEngagementIds: [],
    emailVerifiedAt: new Date(),
    lastLoginAt: null,
    archivedAt: null,
  });

  return user._id.toString();
}

export async function updateStaffAccount(
  staffId: string,
  input: {
    email: string;
    firstName: string;
    lastName: string;
    role: StaffAccountRole;
    status: StaffAccountStatus;
    passwordHash?: string;
  },
) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(staffId)) return false;

  const result = await UserModel.updateOne(
    {
      _id: new Types.ObjectId(staffId),
      roleKeys: { $in: staffDirectoryRoles },
      status: { $ne: "archived" },
    },
    {
      $set: {
        email: normalizeEmail(input.email),
        firstName: input.firstName,
        lastName: input.lastName,
        roleKeys: [input.role],
        status: input.status,
        ...(input.passwordHash ? { passwordHash: input.passwordHash } : {}),
      },
    },
  ).exec();

  return result.matchedCount > 0;
}

export async function listArchivedUsersForAdmin() {
  return listUsersForAdminDirectory({
    $or: [{ status: "archived" }, { archivedAt: { $ne: null } }],
  });
}

export async function createUserWithPassword(input: CreateUserWithPasswordInput) {
  await connectToDatabase();

  return UserModel.create({
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    firstName: input.firstName ?? "",
    lastName: input.lastName ?? "",
    status: "active",
    roleKeys: input.roleKeys ?? ["client"],
    directPermissions: [],
    clientOrganizationIds: [],
    assignedEngagementIds: [],
    emailVerifiedAt: null,
    lastLoginAt: null,
    archivedAt: null,
  });
}

export async function findUserByEmailForAuth(email: string): Promise<AuthUserRecord | null> {
  await connectToDatabase();

  const user = await UserModel.findOne({
    email: normalizeEmail(email),
    status: { $ne: "archived" },
  })
    .select("+passwordHash")
    .lean()
    .exec();

  return user as AuthUserRecord | null;
}

export async function findUserByEmailForVerification(
  email: string,
): Promise<VerificationUserRecord | null> {
  await connectToDatabase();

  const user = await UserModel.findOne({
    email: normalizeEmail(email),
    status: { $ne: "archived" },
  })
    .lean()
    .exec();

  return user as VerificationUserRecord | null;
}

export async function markUserEmailVerified(userId: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userId)) {
    return null;
  }

  return UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        emailVerifiedAt: new Date(),
        status: "active",
      },
    },
    { new: true },
  ).exec();
}

export async function markUserLogin(userId: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userId)) {
    return null;
  }

  return UserModel.findByIdAndUpdate(
    userId,
    { $set: { lastLoginAt: new Date() } },
    { new: true },
  ).exec();
}

export async function assignRolesToUser(userId: string, roleKeys: AppRole[]) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userId)) {
    return null;
  }

  return UserModel.findByIdAndUpdate(
    userId,
    { $set: { roleKeys } },
    { new: true, runValidators: true },
  ).exec();
}

export async function getPrincipalByUserId(userId: string): Promise<Principal | null> {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(userId)) {
    return null;
  }

  const user = await UserModel.findOne({
    _id: userId,
    status: { $ne: "archived" },
  })
    .lean()
    .exec();

  if (!user) {
    return null;
  }

  const roleKeys = normalizeRoles(user.roleKeys);
  const roleRecords = await RoleModel.find({ key: { $in: roleKeys } }).lean().exec();
  const permissions = new Set<Permission>(normalizePermissions(user.directPermissions));

  for (const role of roleRecords) {
    for (const permission of normalizePermissions(role.permissions)) {
      permissions.add(permission);
    }
  }

  return {
    id: user._id.toString(),
    email: user.email,
    roleKeys,
    permissions: Array.from(permissions),
    clientOrganizationIds: normalizeObjectIds(user.clientOrganizationIds),
    assignedEngagementIds: normalizeObjectIds(user.assignedEngagementIds),
    readOnly: roleKeys.includes("auditor"),
  };
}
