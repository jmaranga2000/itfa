import { Types } from "mongoose";
import { STAFF_ACCOUNT_ROLES } from "@/features/staff/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserModel } from "@/models/user";

export type StaffProfileRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  avatarUpdatedAt: string | null;
};

export async function getStaffProfile(userId: string): Promise<StaffProfileRecord | null> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(userId)) return null;

  const user = await UserModel.findOne({
    _id: new Types.ObjectId(userId),
    roleKeys: { $in: STAFF_ACCOUNT_ROLES },
    status: { $ne: "archived" },
  })
    .select("email firstName lastName roleKeys status avatarUpdatedAt")
    .lean()
    .exec();

  if (!user) return null;
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    role: user.roleKeys?.[0] ?? "staff",
    status: user.status ?? "active",
    avatarUpdatedAt: user.avatarUpdatedAt?.toISOString() ?? null,
  };
}

export async function updateStaffProfileDetails(
  userId: string,
  input: { firstName: string; lastName: string },
) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(userId)) return false;
  const result = await UserModel.updateOne(
    { _id: new Types.ObjectId(userId), status: "active" },
    { $set: input },
  ).exec();
  return result.matchedCount > 0;
}

export async function getStaffPasswordRecord(userId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(userId)) return null;
  return UserModel.findOne({ _id: new Types.ObjectId(userId), status: "active" })
    .select("+passwordHash")
    .lean()
    .exec();
}

export async function updateStaffPasswordHash(userId: string, passwordHash: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(userId)) return false;
  const result = await UserModel.updateOne(
    { _id: new Types.ObjectId(userId), status: "active" },
    { $set: { passwordHash } },
  ).exec();
  return result.matchedCount > 0;
}

export async function updateStaffAvatarRecord(
  userId: string,
  input: { avatarKey: string; avatarContentType: string },
) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(userId)) return false;
  const result = await UserModel.updateOne(
    { _id: new Types.ObjectId(userId), status: "active" },
    { $set: { ...input, avatarUpdatedAt: new Date() } },
  ).exec();
  return result.matchedCount > 0;
}

export async function getStaffAvatarRecord(userId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(userId)) return null;
  return UserModel.findOne({
    _id: new Types.ObjectId(userId),
    roleKeys: { $in: STAFF_ACCOUNT_ROLES },
    status: { $ne: "archived" },
    avatarKey: { $ne: null },
  })
    .select("avatarKey avatarContentType avatarUpdatedAt")
    .lean()
    .exec();
}
