import { connectToDatabase } from "@/lib/db/mongoose";
import { AuditLogModel } from "@/models/audit-log";
import type { Principal } from "@/features/authorization/access-control";

export type AuditInput = {
  actor?: Principal | null;
  organizationId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  previousValues?: unknown;
  newValues?: unknown;
  reason?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
};

export async function writeAuditLog(input: AuditInput) {
  await connectToDatabase();

  return AuditLogModel.create({
    actorUserId: input.actor?.id ?? null,
    actorEmail: input.actor?.email ?? null,
    actorRoleSnapshot: input.actor?.roleKeys ?? [],
    organizationId: input.organizationId ?? null,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    previousValues: input.previousValues ?? null,
    newValues: input.newValues ?? null,
    reason: input.reason ?? null,
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: input.metadata ?? null,
  });
}
