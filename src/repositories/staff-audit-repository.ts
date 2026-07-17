import type { Principal } from "@/features/authorization/access-control";
import { assertPermission } from "@/features/authorization/access-control";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuditLogModel } from "@/models/audit-log";

export type StaffAuditRecord = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  actorEmail: string | null;
  reason: string | null;
  createdAt: string | null;
};

export async function listStaffAuditRecords(principal: Principal): Promise<StaffAuditRecord[]> {
  assertPermission(principal, "audit_logs.read");
  await connectToDatabase();
  const records = await AuditLogModel.find({}).sort({ createdAt: -1 }).limit(100).lean().exec();

  return records.map((record) => ({
    id: record._id.toString(),
    action: record.action,
    resourceType: record.resourceType,
    resourceId: record.resourceId ?? null,
    actorEmail: record.actorEmail ?? null,
    reason: record.reason ?? null,
    createdAt: record.createdAt?.toISOString() ?? null,
  }));
}
