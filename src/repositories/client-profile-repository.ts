import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserModel } from "@/models/user";

const CLIENT_ROLES = ["client", "client_representative"] as const;

export type ClientProfileRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "client" | "client_representative";
  status: string;
  avatarUpdatedAt: string | null;
};

export async function getClientProfile(input: { userId: string; email: string }): Promise<ClientProfileRecord | null> {
  await connectToDatabase();
  const identities: Record<string, unknown>[] = [];
  if (Types.ObjectId.isValid(input.userId)) identities.push({ _id: new Types.ObjectId(input.userId) });
  if (input.email.trim()) identities.push({ email: input.email.trim().toLowerCase() });
  if (identities.length === 0) return null;

  const user = await UserModel.findOne({
    $or: identities,
    roleKeys: { $in: CLIENT_ROLES },
    status: { $ne: "archived" },
  })
    .select("email firstName lastName roleKeys status avatarUpdatedAt")
    .lean()
    .exec();

  if (!user) return null;
  const role = user.roleKeys?.includes("client_representative")
    ? "client_representative"
    : "client";
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    role,
    status: user.status ?? "active",
    avatarUpdatedAt: user.avatarUpdatedAt?.toISOString() ?? null,
  };
}

export async function updateClientProfileDetails(
  userId: string,
  input: { firstName: string; lastName: string },
) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(userId)) return false;
  const result = await UserModel.updateOne(
    {
      _id: new Types.ObjectId(userId),
      roleKeys: { $in: CLIENT_ROLES },
      status: "active",
    },
    { $set: input },
  ).exec();
  return result.matchedCount > 0;
}

export async function getClientPasswordRecord(userId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(userId)) return null;
  return UserModel.findOne({
    _id: new Types.ObjectId(userId),
    roleKeys: { $in: CLIENT_ROLES },
    status: "active",
  })
    .select("+passwordHash")
    .lean()
    .exec();
}

export async function updateClientPasswordHash(userId: string, passwordHash: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(userId)) return false;
  const result = await UserModel.updateOne(
    {
      _id: new Types.ObjectId(userId),
      roleKeys: { $in: CLIENT_ROLES },
      status: "active",
    },
    { $set: { passwordHash } },
  ).exec();
  return result.matchedCount > 0;
}

export async function updateClientAvatarRecord(
  userId: string,
  input: { avatarKey: string; avatarContentType: string },
) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(userId)) return false;
  const result = await UserModel.updateOne(
    {
      _id: new Types.ObjectId(userId),
      roleKeys: { $in: CLIENT_ROLES },
      status: "active",
    },
    { $set: { ...input, avatarUpdatedAt: new Date() } },
  ).exec();
  return result.matchedCount > 0;
}

export async function getClientAvatarRecord(userId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(userId)) return null;
  return UserModel.findOne({
    _id: new Types.ObjectId(userId),
    roleKeys: { $in: CLIENT_ROLES },
    status: { $ne: "archived" },
    avatarKey: { $ne: null },
  })
    .select("avatarKey avatarContentType avatarUpdatedAt")
    .lean()
    .exec();
}
