"use server";

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/server";
import { writeAuditLog } from "@/features/audit/audit-service";
import {
  createAccountClosureRequest,
  getAccountClosureRequestByClient,
} from "@/repositories/account-closure-repository";

const closureRequestSchema = z.object({
  reason: z.string().trim().min(10).max(1000),
});

export async function submitAccountClosureRequestAction(formData: FormData) {
  const principal = await requireUser();
  const parsed = closureRequestSchema.safeParse({
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    throw new Error("Provide a clear reason for closure request.");
  }

  const existingRequest = await getAccountClosureRequestByClient(principal.id);
  if (existingRequest && existingRequest.status !== "rejected") {
    redirect("/client/profile?closureRequestPending=1");
  }

  const request = await createAccountClosureRequest({
    requestReference: `ACR-${randomUUID()}`,
    clientUserId: principal.id,
    requestedByUserId: principal.id,
    requestedByName: principal.email,
    reason: parsed.data.reason,
  });

  await writeAuditLog({
    actor: principal,
    action: "client.account_closure_requested",
    resourceType: "AccountClosureRequest",
    resourceId: request._id.toString(),
    newValues: { status: request.status, reason: request.reason },
  });

  revalidatePath("/client/profile");
  redirect("/client/profile?closureRequested=1");
}
