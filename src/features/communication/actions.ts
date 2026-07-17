"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission, requireUser } from "@/features/auth/server";
import { requireStaffRoute } from "@/features/staff/server";
import {
  COMMUNICATION_MODULES,
} from "@/features/communication/types";
import {
  createConversationMessage,
  createDirectClientConversation,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/repositories/communication-repository";
import {
  NOTIFICATION_DESTINATIONS,
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
  destinationKey: z.enum(NOTIFICATION_DESTINATIONS),
  expiresAt: z.string().trim(),
});

const messageSchema = z.object({
  body: z.string().trim().min(1).max(6000),
});

const directMessageSchema = messageSchema.extend({
  clientUserId: z.string().trim().min(1),
  subject: z.string().trim().min(3).max(180),
});

function messageReturnPath(value: FormDataEntryValue | null, conversationId: string) {
  const path = String(value ?? "");
  const allowedBases = ["/admin/messages", "/staff/messages", "/client/messages"];
  const base = allowedBases.find((candidate) => path.startsWith(candidate)) ?? "/admin/messages";
  return `${base.split("?")[0]}?conversation=${encodeURIComponent(conversationId)}`;
}

function adminNotificationInput(formData: FormData) {
  const parsed = adminNotificationSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    audience: formData.get("audience"),
    notificationType: formData.get("notificationType"),
    relatedModule: formData.get("relatedModule"),
    relatedRecordId: formData.get("relatedRecordId") ?? "",
    destinationKey: formData.get("destinationKey"),
    expiresAt: formData.get("expiresAt") ?? "",
  });
  if (!parsed.success) return null;

  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return null;

  return {
    ...parsed.data,
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

export async function sendConversationMessageAction(formData: FormData) {
  const sender = await requireUser();
  const conversationId = String(formData.get("conversationId") ?? "");
  const parsed = messageSchema.safeParse({ body: formData.get("body") });
  const returnPath = messageReturnPath(formData.get("returnPath"), conversationId);
  if (!parsed.success || !conversationId) redirect(`${returnPath}&error=message`);

  await createConversationMessage({
    conversationId,
    sender,
    body: parsed.data.body,
  });
  revalidatePath("/admin/messages");
  revalidatePath("/staff/messages");
  revalidatePath("/client/messages");
  revalidatePath("/client/notifications");
  redirect(`${returnPath}&sent=1`);
}

export async function createClientConversationAction(formData: FormData) {
  const sender = await requirePermission("messages.send");
  const parsed = directMessageSchema.safeParse({
    clientUserId: formData.get("clientUserId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) redirect("/admin/messages/new?error=invalid");

  const conversationId = await createDirectClientConversation({
    ...parsed.data,
    sender,
  });
  revalidatePath("/admin/messages");
  revalidatePath("/client/messages");
  revalidatePath("/client/notifications");
  redirect(`/admin/messages?conversation=${conversationId}&sent=1`);
}

export async function createStaffClientConversationAction(formData: FormData) {
  const { principal: sender } = await requireStaffRoute("messages");
  const parsed = directMessageSchema.safeParse({
    clientUserId: formData.get("clientUserId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) redirect("/staff/messages/new?error=invalid");

  const conversationId = await createDirectClientConversation({ ...parsed.data, sender });
  revalidatePath("/staff/messages");
  revalidatePath("/client/messages");
  revalidatePath("/client/notifications");
  redirect(`/staff/messages?conversation=${conversationId}&sent=1`);
}
