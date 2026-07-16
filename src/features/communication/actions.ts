"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/server";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/repositories/communication-repository";

export async function markNotificationReadAction(formData: FormData) {
  const principal = await requireUser();
  const notificationId = String(formData.get("notificationId") ?? "");

  await markNotificationRead(principal, notificationId);
  revalidatePath("/admin/notifications");
  revalidatePath(`/admin/notifications/${notificationId}`);
  revalidatePath("/client");
  revalidatePath("/staff");
}

export async function markAllNotificationsReadAction() {
  const principal = await requireUser();

  await markAllNotificationsRead(principal);
  revalidatePath("/admin/notifications");
  revalidatePath("/client");
  revalidatePath("/staff");
}
