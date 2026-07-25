"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/features/auth/server";
import { writeAuditLog } from "@/features/audit/audit-service";
import { revokeUserSessions } from "@/features/auth/session";
import {
  setClientAccountStatus,
  anonymiseClientAccount,
  getRegisteredClientForAdmin,
} from "@/repositories/user-repository";
import {
  getAccountClosureRequestById,
  getAccountClosureRequestByClient,
  updateAccountClosureRequestStatus,
} from "@/repositories/account-closure-repository";

const clientStatusSchema = z.object({
  clientId: z.string().min(1),
});

const reviewSchema = z.object({
  requestId: z.string().min(1),
  reviewNotes: z.string().trim().min(1),
});

export async function suspendClientAccountAction(formData: FormData) {
  const actor = await requirePermission("clients.update");
  const parsed = clientStatusSchema.safeParse({ clientId: formData.get("clientId") });
  if (!parsed.success) redirect("/admin/clients");

  const client = await getRegisteredClientForAdmin(parsed.data.clientId);
  if (!client) redirect("/admin/clients");

  const updated = await setClientAccountStatus(parsed.data.clientId, "suspended");
  if (!updated) redirect(`/admin/clients/${parsed.data.clientId}`);

  await revokeUserSessions(parsed.data.clientId);
  await writeAuditLog({
    actor,
    action: "clients.account_suspended",
    resourceType: "User",
    resourceId: parsed.data.clientId,
    previousValues: { status: client.status },
    newValues: { status: "suspended" },
  });

  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  redirect(`/admin/clients/${parsed.data.clientId}?suspended=1`);
}

export async function disableClientAccountAction(formData: FormData) {
  const actor = await requirePermission("clients.update");
  const parsed = clientStatusSchema.safeParse({ clientId: formData.get("clientId") });
  if (!parsed.success) redirect("/admin/clients");

  const client = await getRegisteredClientForAdmin(parsed.data.clientId);
  if (!client) redirect("/admin/clients");

  const updated = await setClientAccountStatus(parsed.data.clientId, "disabled");
  if (!updated) redirect(`/admin/clients/${parsed.data.clientId}`);

  await revokeUserSessions(parsed.data.clientId);
  await writeAuditLog({
    actor,
    action: "clients.account_disabled",
    resourceType: "User",
    resourceId: parsed.data.clientId,
    previousValues: { status: client.status },
    newValues: { status: "disabled" },
  });

  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  redirect(`/admin/clients/${parsed.data.clientId}?disabled=1`);
}

export async function reactivateClientAccountAction(formData: FormData) {
  const actor = await requirePermission("clients.update");
  const parsed = clientStatusSchema.safeParse({ clientId: formData.get("clientId") });
  if (!parsed.success) redirect("/admin/clients");

  const client = await getRegisteredClientForAdmin(parsed.data.clientId);
  if (!client) redirect("/admin/clients");

  const updated = await setClientAccountStatus(parsed.data.clientId, "active");
  if (!updated) redirect(`/admin/clients/${parsed.data.clientId}`);

  await writeAuditLog({
    actor,
    action: "clients.account_reactivated",
    resourceType: "User",
    resourceId: parsed.data.clientId,
    previousValues: { status: client.status },
    newValues: { status: "active" },
  });

  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  redirect(`/admin/clients/${parsed.data.clientId}?reactivated=1`);
}

export async function anonymiseClientAccountAction(formData: FormData) {
  const actor = await requirePermission("clients.update");
  const parsed = clientStatusSchema.safeParse({ clientId: formData.get("clientId") });
  if (!parsed.success) redirect("/admin/clients");

  const client = await getRegisteredClientForAdmin(parsed.data.clientId);
  if (!client) redirect("/admin/clients");

  const updated = await anonymiseClientAccount(parsed.data.clientId);
  if (!updated) redirect(`/admin/clients/${parsed.data.clientId}`);

  await revokeUserSessions(parsed.data.clientId);
  await writeAuditLog({
    actor,
    action: "clients.account_anonymised",
    resourceType: "User",
    resourceId: parsed.data.clientId,
    previousValues: { status: client.status },
    newValues: { status: "anonymised" },
  });

  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  redirect(`/admin/clients/${parsed.data.clientId}?anonymised=1`);
}

export async function approveAccountClosureRequestAction(formData: FormData) {
  const actor = await requirePermission("clients.update");
  const parsed = reviewSchema.safeParse({
    requestId: formData.get("requestId"),
    reviewNotes: formData.get("reviewNotes"),
  });

  if (!parsed.success) redirect("/admin/clients");

  const request = await getAccountClosureRequestById(parsed.data.requestId);
  if (!request) redirect("/admin/clients");

  const updatedRequest = await updateAccountClosureRequestStatus(
    parsed.data.requestId,
    "approved",
    parsed.data.reviewNotes,
    actor.id,
    actor.email,
  );
  if (!updatedRequest) redirect(`/admin/clients/${request.clientUserId}`);

  const statusUpdated = await setClientAccountStatus(request.clientUserId, "disabled");
  if (statusUpdated) await revokeUserSessions(request.clientUserId);

  await writeAuditLog({
    actor,
    action: "clients.account_closure_approved",
    resourceType: "AccountClosureRequest",
    resourceId: parsed.data.requestId,
    previousValues: { requestStatus: request.status, clientStatus: request.clientUserId ? "pending" : undefined },
    newValues: { requestStatus: "approved", clientStatus: "disabled" },
  });

  revalidatePath(`/admin/clients/${request.clientUserId}`);
  redirect(`/admin/clients/${request.clientUserId}?closureApproved=1`);
}

export async function rejectAccountClosureRequestAction(formData: FormData) {
  const actor = await requirePermission("clients.update");
  const parsed = reviewSchema.safeParse({
    requestId: formData.get("requestId"),
    reviewNotes: formData.get("reviewNotes"),
  });

  if (!parsed.success) redirect("/admin/clients");

  const request = await getAccountClosureRequestById(parsed.data.requestId);
  if (!request) redirect("/admin/clients");

  const updatedRequest = await updateAccountClosureRequestStatus(
    parsed.data.requestId,
    "rejected",
    parsed.data.reviewNotes,
    actor.id,
    actor.email,
  );
  if (!updatedRequest) redirect(`/admin/clients/${request.clientUserId}`);

  await writeAuditLog({
    actor,
    action: "clients.account_closure_rejected",
    resourceType: "AccountClosureRequest",
    resourceId: parsed.data.requestId,
    previousValues: { requestStatus: request.status },
    newValues: { requestStatus: "rejected" },
  });

  revalidatePath(`/admin/clients/${request.clientUserId}`);
  redirect(`/admin/clients/${request.clientUserId}?closureRejected=1`);
}

export async function completeAccountClosureRequestAction(formData: FormData) {
  const actor = await requirePermission("clients.update");
  const parsed = reviewSchema.safeParse({
    requestId: formData.get("requestId"),
    reviewNotes: formData.get("reviewNotes"),
  });

  if (!parsed.success) redirect("/admin/clients");

  const request = await getAccountClosureRequestById(parsed.data.requestId);
  if (!request) redirect("/admin/clients");
  if (request.status !== "approved") redirect(`/admin/clients/${request.clientUserId}`);

  const updatedRequest = await updateAccountClosureRequestStatus(
    parsed.data.requestId,
    "completed",
    parsed.data.reviewNotes,
    actor.id,
    actor.email,
  );
  if (!updatedRequest) redirect(`/admin/clients/${request.clientUserId}`);

  const anonymised = await anonymiseClientAccount(request.clientUserId);
  if (anonymised) await revokeUserSessions(request.clientUserId);

  await writeAuditLog({
    actor,
    action: "clients.account_closure_completed",
    resourceType: "AccountClosureRequest",
    resourceId: parsed.data.requestId,
    previousValues: { requestStatus: request.status },
    newValues: { requestStatus: "completed", accountAnonymised: Boolean(anonymised) },
  });

  revalidatePath(`/admin/clients/${request.clientUserId}`);
  redirect(`/admin/clients/${request.clientUserId}?closureCompleted=1`);
}
