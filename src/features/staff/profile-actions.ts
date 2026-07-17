"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/features/auth/password";
import { isPasswordPolicySatisfied } from "@/features/auth/password-policy";
import { revokeUserSessions } from "@/features/auth/session";
import { requireStaffRoute } from "@/features/staff/server";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import {
  getStaffPasswordRecord,
  updateStaffAvatarRecord,
  updateStaffPasswordHash,
  updateStaffProfileDetails,
} from "@/repositories/staff-profile-repository";

const profileSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
});
const avatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_SIZE = 3 * 1024 * 1024;

export async function updateStaffProfileAction(formData: FormData) {
  const { principal } = await requireStaffRoute("profile");
  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });
  if (!parsed.success) redirect("/staff/profile?error=profile");

  await updateStaffProfileDetails(principal.id, parsed.data);
  revalidatePath("/staff/profile");
  redirect("/staff/profile?saved=1");
}

export async function uploadStaffAvatarAction(formData: FormData) {
  const { principal } = await requireStaffRoute("profile");
  const avatar = formData.get("avatar");
  if (!(avatar instanceof File) || avatar.size === 0) {
    redirect("/staff/profile?error=avatar-missing");
  }
  if (avatar.size > MAX_AVATAR_SIZE) redirect("/staff/profile?error=avatar-size");
  if (!avatarTypes.has(avatar.type)) redirect("/staff/profile?error=avatar-type");

  const extension = avatar.type === "image/png" ? "png" : avatar.type === "image/webp" ? "webp" : "jpg";
  const key = `avatars/${principal.id}/${randomUUID()}.${extension}`;

  try {
    const configuration = getR2Configuration();
    await getR2Client().send(new PutObjectCommand({
      Bucket: configuration.bucketName,
      Key: key,
      Body: Buffer.from(await avatar.arrayBuffer()),
      ContentType: avatar.type,
      CacheControl: "private, max-age=3600",
    }));
    await updateStaffAvatarRecord(principal.id, {
      avatarKey: key,
      avatarContentType: avatar.type,
    });
  } catch (error) {
    console.error("Unable to upload staff avatar.", error);
    redirect("/staff/profile?error=avatar-upload");
  }

  revalidatePath("/staff/profile");
  redirect("/staff/profile?avatar=1");
}

export async function changeStaffPasswordAction(formData: FormData) {
  const { principal } = await requireStaffRoute("profile");
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (newPassword !== confirmPassword || !isPasswordPolicySatisfied(newPassword)) {
    redirect("/staff/profile?error=password-policy");
  }

  const user = await getStaffPasswordRecord(principal.id);
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    redirect("/staff/profile?error=current-password");
  }
  if (await verifyPassword(newPassword, user.passwordHash)) {
    redirect("/staff/profile?error=password-same");
  }

  await updateStaffPasswordHash(principal.id, await hashPassword(newPassword));
  await revokeUserSessions(principal.id);
  redirect("/sign-in?passwordChanged=1");
}
