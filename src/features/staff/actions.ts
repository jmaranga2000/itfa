"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/features/audit/audit-service";
import { requirePermission } from "@/features/auth/server";
import { hashPassword } from "@/features/auth/password";
import { revokeUserSessions } from "@/features/auth/session";
import { isPasswordPolicySatisfied } from "@/features/auth/password-policy";
import {
  STAFF_ACCOUNT_ROLES,
  STAFF_ACCOUNT_STATUSES,
} from "@/features/staff/types";
import { assignStaffToRequest } from "@/repositories/staff-assignment-repository";
import {
  archiveStaffAccount,
  createStaffAccount,
  getStaffForAdmin,
  setStaffAccountStatus,
  staffEmailExists,
  updateStaffAccount,
} from "@/repositories/user-repository";

const staffSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  role: z.enum(STAFF_ACCOUNT_ROLES),
  status: z.enum(STAFF_ACCOUNT_STATUSES),
  password: z.string().max(128),
});

function staffInput(formData: FormData) {
  const parsed = staffSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    role: formData.get("role"),
    status: formData.get("status"),
    password: formData.get("password") ?? "",
  });

  return parsed.success ? parsed.data : null;
}

export async function createStaffAccountAction(formData: FormData) {
  const actor = await requirePermission("staff.manage");
  const input = staffInput(formData);
  if (!input || !isPasswordPolicySatisfied(input.password)) {
    redirect("/admin/staff/new?error=invalid");
  }
  if (await staffEmailExists(input.email)) {
    redirect("/admin/staff/new?error=email");
  }

  const staffId = await createStaffAccount({
    ...input,
    passwordHash: await hashPassword(input.password),
  });
  await writeAuditLog({
    actor,
    action: "staff.account_created",
    resourceType: "User",
    resourceId: staffId,
    newValues: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      status: input.status,
    },
  });
  revalidatePath("/admin/staff");
  redirect(`/admin/staff/${staffId}?created=1`);
}

export async function updateStaffAccountAction(formData: FormData) {
  const actor = await requirePermission("staff.manage");
  const staffId = String(formData.get("staffId") ?? "");
  const input = staffInput(formData);
  if (!input || (input.password && !isPasswordPolicySatisfied(input.password))) {
    redirect(`/admin/staff/${staffId}?error=invalid`);
  }
  if (await staffEmailExists(input.email, staffId)) {
    redirect(`/admin/staff/${staffId}?error=email`);
  }

  const previous = await getStaffForAdmin(staffId);
  if (!previous) redirect("/admin/staff");
  const updated = await updateStaffAccount(staffId, {
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    status: input.status,
    ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
  });
  if (!updated) redirect("/admin/staff");

  await writeAuditLog({
    actor,
    action: "staff.account_updated",
    resourceType: "User",
    resourceId: staffId,
    previousValues: previous,
    newValues: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      status: input.status,
      passwordReset: Boolean(input.password),
    },
  });
  revalidatePath("/admin/staff");
  revalidatePath(`/admin/staff/${staffId}`);
  redirect(`/admin/staff/${staffId}?saved=1`);
}

export async function deactivateStaffAccountAction(formData: FormData) {
  const actor = await requirePermission("staff.manage");
  const staffId = String(formData.get("staffId") ?? "");
  const previous = await getStaffForAdmin(staffId);
  if (!previous) redirect("/admin/staff");

  const updated = await setStaffAccountStatus(staffId, "suspended");
  if (!updated) redirect("/admin/staff");

  await revokeUserSessions(staffId);
  await writeAuditLog({
    actor,
    action: "staff.account_deactivated",
    resourceType: "User",
    resourceId: staffId,
    previousValues: { status: previous.status },
    newValues: { status: "suspended" },
  });
  revalidatePath("/admin/staff");
  revalidatePath(`/admin/staff/${staffId}`);
  redirect(`/admin/staff/${staffId}?deactivated=1`);
}

export async function reactivateStaffAccountAction(formData: FormData) {
  const actor = await requirePermission("staff.manage");
  const staffId = String(formData.get("staffId") ?? "");
  const previous = await getStaffForAdmin(staffId);
  if (!previous) redirect("/admin/staff");

  const updated = await setStaffAccountStatus(staffId, "active");
  if (!updated) redirect("/admin/staff");

  await writeAuditLog({
    actor,
    action: "staff.account_reactivated",
    resourceType: "User",
    resourceId: staffId,
    previousValues: { status: previous.status },
    newValues: { status: "active" },
  });
  revalidatePath("/admin/staff");
  revalidatePath(`/admin/staff/${staffId}`);
  redirect(`/admin/staff/${staffId}?reactivated=1`);
}

export async function deleteStaffAccountAction(formData: FormData) {
  const actor = await requirePermission("staff.manage");
  const staffId = String(formData.get("staffId") ?? "");
  const previous = await getStaffForAdmin(staffId);
  if (!previous) redirect("/admin/staff");

  const archived = await archiveStaffAccount(staffId);
  if (!archived) redirect("/admin/staff");

  await revokeUserSessions(staffId);
  await writeAuditLog({
    actor,
    action: "staff.account_deleted",
    resourceType: "User",
    resourceId: staffId,
    previousValues: previous,
    newValues: { status: "archived", archivedAt: new Date().toISOString() },
  });
  revalidatePath("/admin/staff");
  revalidatePath("/admin/archive");
  redirect("/admin/staff?deleted=1");
}

export async function assignStaffToRequestAction(formData: FormData) {
  const actor = await requirePermission("engagements.assign");
  const requestId = String(formData.get("requestId") ?? "");
  const staffUserId = String(formData.get("staffUserId") ?? "");
  const assigned = await assignStaffToRequest(requestId, staffUserId, actor);
  if (!assigned) redirect(`/admin/staff?assignRequest=${encodeURIComponent(requestId)}&error=assign`);

  revalidatePath("/admin/staff");
  revalidatePath(`/admin/requests/${requestId}`);
  redirect(`/admin/requests/${requestId}?assigned=1`);
}
