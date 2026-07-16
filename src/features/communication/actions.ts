"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission, requireUser } from "@/features/auth/server";
import {
  COMMUNICATION_MODULES,
} from "@/features/communication/types";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/repositories/communication-repository";
import {
  archiveAdminNotification,
  createAdminNotification,
  updateAdminNotification,
} from "@/repositories/admin-notification-repository";

const adminNotificationSchema = z.object({
  title: z.string().trim().min(3).max(180),
  body: z.string().trim().min(10).max(4000),
  audience: z.enum(["all_clients", "all_staff", "everyone"]),
  notificationType: z.enum(["announcement", "action_required"]),
  relatedModule: z.enum(COMMUNICATION_MODULES),
  relatedRecordId: z.string().trim().max(160),
  actionUrl: z.string().trim().max(500),
  expiresAt: z.string().trim(),
});

function adminNotificationInput(formData: FormData) {
  const parsed = adminNotificationSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    audience: formData.get("audience"),
    notificationType: formData.get("notificationType"),
    relatedModule: formData.get("relatedModule"),
    relatedRecordId: formData.get("relatedRecordId") ?? "",
    actionUrl: formData.get("actionUrl") ?? "/",
    expiresAt: formData.get("expiresAt") ?? "",
  });
  if (!parsed.success) return null;

  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return null;

  return {
    ...parsed.data,
    actionUrl: parsed.data.actionUrl || "/",
    relatedRecordId: parsed.data.relatedRecordId || null,
    expiresAt,
  };
}

function revalidateNotificationPaths(notificationId?: string) {
  revalidatePath("/admin/notifications");
  revalidatePath("/client/notifications");
  revalidatePath("/staff/notifications");
  revalidatePath("/client");
  revalidatePath("/staff");
  if (notificationId) {
    revalidatePath(`/admin/notifications/${notificationId}`);
  }
}

export async function markNotificationReadAction(formData: FormData) {
  const principal = await requireUser();
  const notificationId = String(formData.get("notificationId") ?? "");

  await markNotificationRead(principal, notificationId);
  revalidatePath("/admin/notifications");
  revalidatePath(`/admin/notifications/${notificationId}`);
  revalidatePath(`/client/notifications/${notificationId}`);
  revalidatePath(`/staff/notifications/${notificationId}`);
  revalidatePath("/client/notifications");
  revalidatePath("/staff/notifications");
  revalidatePath("/client");
  revalidatePath("/staff");
}

export async function markAllNotificationsReadAction() {
  const principal = await requireUser();

  await markAllNotificationsRead(principal);
  revalidatePath("/admin/notifications");
  revalidatePath("/client/notifications");
  revalidatePath("/staff/notifications");
  revalidatePath("/client");
  revalidatePath("/staff");
}

export async function createAdminNotificationAction(formData: FormData) {
  const actor = await requirePermission("settings.manage");
  const input = adminNotificationInput(formData);
  if (!input) redirect("/admin/notifications/new?error=invalid");

  const notificationId = await createAdminNotification(input, actor);
  revalidateNotificationPaths(notificationId);
  redirect(`/admin/notifications/${notificationId}?created=1`);
}

export async function updateAdminNotificationAction(formData: FormData) {
  const actor = await requirePermission("settings.manage");
  const notificationId = String(formData.get("notificationId") ?? "");
  const input = adminNotificationInput(formData);
  if (!input) redirect(`/admin/notifications/${notificationId}?error=invalid`);

  const updated = await updateAdminNotification(notificationId, input, actor);
  if (!updated) redirect("/admin/notifications");

  revalidateNotificationPaths(notificationId);
  redirect(`/admin/notifications/${notificationId}?saved=1`);
}

export async function archiveAdminNotificationAction(formData: FormData) {
  const actor = await requirePermission("settings.manage");
  const notificationId = String(formData.get("notificationId") ?? "");
  await archiveAdminNotification(notificationId, actor);
  revalidateNotificationPaths(notificationId);
  redirect("/admin/notifications?deleted=1");
}
