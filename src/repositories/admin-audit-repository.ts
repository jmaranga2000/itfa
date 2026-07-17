import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuditLogModel } from "@/models/audit-log";

export type AdminAuditRecord = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  actorEmail: string | null;
  actorRoles: string[];
  reason: string | null;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  previousValues: unknown;
  newValues: unknown;
  metadata: unknown;
  createdAt: string | null;
};

type RawAudit = {
  _id: Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  actorEmail?: string | null;
  actorRoleSnapshot?: string[];
  reason?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  previousValues?: unknown;
  newValues?: unknown;
  metadata?: unknown;
  createdAt?: Date | null;
};

function serializableValue(value: unknown) {
  if (value === undefined || value === null) return null;
  return JSON.parse(JSON.stringify(value)) as unknown;
}

function serialize(record: RawAudit): AdminAuditRecord {
  return {
    id: record._id.toString(),
    action: record.action,
    resourceType: record.resourceType,
    resourceId: record.resourceId ?? null,
    actorEmail: record.actorEmail ?? null,
    actorRoles: record.actorRoleSnapshot ?? [],
    reason: record.reason ?? null,
    requestId: record.requestId ?? null,
    ipAddress: record.ipAddress ?? null,
    userAgent: record.userAgent ?? null,
    previousValues: serializableValue(record.previousValues),
    newValues: serializableValue(record.newValues),
    metadata: serializableValue(record.metadata),
    createdAt: record.createdAt?.toISOString() ?? null,
  };
}

function safePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listAdminAuditRecords(filters: {
  query?: string;
  resourceType?: string;
  actor?: string;
}) {
  await connectToDatabase();
  const filter: Record<string, unknown> = {};
  const query = filters.query?.trim();
  if (query) {
    const pattern = new RegExp(safePattern(query), "i");
    filter.$or = [
      { action: pattern },
      { resourceType: pattern },
      { resourceId: pattern },
      { actorEmail: pattern },
      { reason: pattern },
    ];
  }
  if (filters.resourceType) filter.resourceType = filters.resourceType;
  if (filters.actor) filter.actorEmail = filters.actor;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [records, total, today, resourceTypes, actors] = await Promise.all([
    AuditLogModel.find(filter).sort({ createdAt: -1 }).limit(150).lean().exec(),
    AuditLogModel.countDocuments({}).exec(),
    AuditLogModel.countDocuments({ createdAt: { $gte: startOfDay } }).exec(),
    AuditLogModel.distinct("resourceType").exec(),
    AuditLogModel.distinct("actorEmail", { actorEmail: { $ne: null } }).exec(),
  ]);
  return {
    records: (records as RawAudit[]).map(serialize),
    summary: {
      total,
      today,
      actors: actors.length,
      resources: resourceTypes.length,
    },
    filters: {
      resourceTypes: (resourceTypes as string[]).sort(),
      actors: (actors as string[]).sort(),
    },
  };
}

export async function getAdminAuditRecord(auditId: string) {
  if (!Types.ObjectId.isValid(auditId)) return null;
  await connectToDatabase();
  const record = await AuditLogModel.findById(auditId).lean().exec();
  return record ? serialize(record as RawAudit) : null;
}
