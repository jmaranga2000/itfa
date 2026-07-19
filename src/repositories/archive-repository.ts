import { Types } from "mongoose";
import {
  hasAnyPermission,
  hasPermission,
  type Principal,
} from "@/features/authorization/access-control";
import type { Permission } from "@/features/authorization/permissions";
import { writeAuditLog } from "@/features/audit/audit-service";
import {
  canRestoreArchiveRecord,
  daysUntilRetentionExpiry,
  isArchiveReadOnly,
  isRetentionNearExpiry,
  validatePermanentDeletion,
} from "@/features/archive/lifecycle";
import {
  ARCHIVE_CATEGORY_META,
  ARCHIVE_PERMISSION_MATRIX,
  getArchiveRecordTypeLabel,
  getArchiveStatusLabel,
  type ArchiveCategory,
  type ArchiveRecordType,
  type ArchiveStatus,
  type DeletionStatus,
  type LegalHoldStatus,
  type RestoreType,
} from "@/features/archive/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuthorizationError } from "@/lib/errors";
import { ArchiveDeletionRequestModel } from "@/models/archive-deletion-request";
import { ArchiveRecordModel } from "@/models/archive-record";
import { ArchiveRestoreRequestModel } from "@/models/archive-restore-request";
import { ArchiveRetentionPolicyModel } from "@/models/archive-retention-policy";
import { AuditLogModel } from "@/models/audit-log";
import { LegalHoldModel } from "@/models/legal-hold";

export type ArchiveFilters = {
  search?: string;
  category?: ArchiveCategory;
  recordType?: ArchiveRecordType;
  status?: ArchiveStatus;
  legalHold?: "active" | "none";
  retention?: "near_expiry" | "expired";
};

export type ArchiveRecordSummary = {
  id: string;
  archiveReference: string;
  recordId: string;
  recordType: ArchiveRecordType;
  recordTypeLabel: string;
  recordReference: string;
  recordName: string;
  clientName: string;
  engagementReference: string;
  serviceName: string;
  originalStatus: string;
  archiveStatus: ArchiveStatus;
  archiveStatusLabel: string;
  archiveReason: string;
  archivedByName: string;
  archivedAt: string | null;
  retentionPolicyName: string;
  retentionExpiryDate: string | null;
  daysUntilExpiry: number | null;
  legalHoldStatus: LegalHoldStatus | null;
  legalHoldReason: string;
  restoreEligible: boolean;
  deleteEligible: boolean;
  deletionStatus: DeletionStatus;
  readOnly: boolean;
  clientVisible: boolean;
  href: string;
};

export type ArchiveRetentionPolicyRecord = {
  id: string;
  name: string;
  recordType: ArchiveRecordType;
  recordTypeLabel: string;
  version: number;
  retentionPeriodMonths: number;
  warningDays: number[];
  activeRecordsCovered: number;
  recordsNearingExpiry: number;
  recordsUnderHold: number;
  updatedAt: string | null;
  updatedByName: string;
  active: boolean;
};

export type LegalHoldRecord = {
  id: string;
  holdReference: string;
  archiveRecordId: string;
  recordType: ArchiveRecordType;
  recordId: string;
  reason: string;
  appliedByName: string;
  appliedAt: string | null;
  reviewDate: string | null;
  expiryDate: string | null;
  status: LegalHoldStatus;
};

export type RestoreRequestRecord = {
  id: string;
  requestReference: string;
  archiveRecordId: string;
  recordType: ArchiveRecordType;
  recordReference: string;
  requestedByName: string;
  requestedAt: string | null;
  restoreReason: string;
  restoreType: RestoreType;
  approvalStatus: string;
  assignedApproverName: string;
  decision: string;
  decisionAt: string | null;
  decisionReason: string;
};

export type DeletionRequestRecord = {
  id: string;
  requestReference: string;
  archiveRecordId: string;
  recordType: ArchiveRecordType;
  recordReference: string;
  retentionExpiryDate: string | null;
  legalHoldStatus: string;
  requestedByName: string;
  requestedAt: string | null;
  deletionReason: string;
  approvedByName: string;
  scheduledDeletionDate: string | null;
  status: DeletionStatus;
};

export type ArchiveActivityRecord = {
  id: string;
  action: string;
  actorEmail: string | null;
  resourceId: string | null;
  reason: string | null;
  createdAt: string | null;
};

export type ArchiveDashboardData = {
  dataFreshness: string;
  summary: Array<{ label: string; value: string; helper: string; href: string }>;
  categories: Array<{
    key: ArchiveCategory;
    label: string;
    description: string;
    icon: string;
    count: number;
    href: string;
  }>;
  records: ArchiveRecordSummary[];
  attention: ArchiveRecordSummary[];
  distribution: Array<{ label: string; value: number }>;
  activity: ArchiveActivityRecord[];
  retentionPolicies: ArchiveRetentionPolicyRecord[];
  legalHolds: LegalHoldRecord[];
  restoreRequests: RestoreRequestRecord[];
  deletionRequests: DeletionRequestRecord[];
  permissions: typeof ARCHIVE_PERMISSION_MATRIX;
  filters: ArchiveFilters;
};

export type ArchiveDetailData = {
  record: ArchiveRecordSummary & {
    previousLocation: string;
    archiveNotes: string;
    snapshot: Record<string, unknown>;
    restoredAt: string | null;
    restoreReason: string;
    permanentlyDeletedAt: string | null;
    deletionEvidence: string;
  };
  lifecycle: Array<{ label: string; value: string }>;
  workflowHistory: Array<Record<string, string | number>>;
  documents: Array<Record<string, string | number>>;
  messages: Array<Record<string, string | number>>;
  finance: Array<Record<string, string | number>>;
  timeline: Array<Record<string, string>>;
  audit: ArchiveActivityRecord[];
  legalHolds: LegalHoldRecord[];
  restoreRequests: RestoreRequestRecord[];
  deletionRequests: DeletionRequestRecord[];
};

type RawArchiveRecord = {
  _id: Types.ObjectId;
  archiveReference: string;
  recordId: string;
  recordType: ArchiveRecordType;
  recordReference: string;
  recordName: string;
  clientName?: string;
  engagementReference?: string;
  serviceName?: string;
  originalStatus: string;
  archiveStatus: ArchiveStatus;
  archiveReason: string;
  archivedByName?: string;
  archivedAt?: Date | null;
  retentionPolicyName: string;
  retentionExpiryDate?: Date | null;
  legalHoldStatus?: LegalHoldStatus | null;
  legalHoldReason?: string;
  restoreEligible?: boolean;
  deleteEligible?: boolean;
  deletionStatus?: DeletionStatus;
  readOnly?: boolean;
  clientVisible?: boolean;
  previousLocation?: string;
  archiveNotes?: string;
  snapshot?: Record<string, unknown>;
  restoredAt?: Date | null;
  restoreReason?: string;
  permanentlyDeletedAt?: Date | null;
  deletionEvidence?: string;
};

type RawPolicy = {
  _id: Types.ObjectId;
  name: string;
  recordType: ArchiveRecordType;
  version?: number;
  retentionPeriodMonths?: number;
  warningDays?: number[];
  updatedAt?: Date | null;
  updatedByName?: string;
  active?: boolean;
};

type RawHold = {
  _id: Types.ObjectId;
  holdReference: string;
  archiveRecordId: Types.ObjectId;
  recordType: ArchiveRecordType;
  recordId: string;
  reason: string;
  appliedByName?: string;
  appliedAt?: Date | null;
  reviewDate?: Date | null;
  expiryDate?: Date | null;
  status: LegalHoldStatus;
};

type RawRestore = {
  _id: Types.ObjectId;
  requestReference: string;
  archiveRecordId: Types.ObjectId;
  recordType: ArchiveRecordType;
  recordReference: string;
  requestedByName?: string;
  requestedAt?: Date | null;
  restoreReason: string;
  restoreType: RestoreType;
  approvalStatus: string;
  assignedApproverName?: string;
  decision?: string;
  decisionAt?: Date | null;
  decisionReason?: string;
};

type RawDeletion = {
  _id: Types.ObjectId;
  requestReference: string;
  archiveRecordId: Types.ObjectId;
  recordType: ArchiveRecordType;
  recordReference: string;
  retentionExpiryDate?: Date | null;
  legalHoldStatus?: string;
  requestedByName?: string;
  requestedAt?: Date | null;
  deletionReason: string;
  approvedByName?: string;
  scheduledDeletionDate?: Date | null;
  status: DeletionStatus;
};

type RawAudit = {
  _id: Types.ObjectId;
  action: string;
  actorEmail?: string | null;
  resourceId?: string | null;
  reason?: string | null;
  createdAt?: Date | null;
};

const ARCHIVE_VIEW_PERMISSIONS = [
  "archive.read",
  "archive.view_overview",
  "permissions.manage",
] as const satisfies ReadonlyArray<Permission>;

function assertArchiveAccess(principal: Principal, permission: Permission) {
  if (!hasPermission(principal, permission) && !hasAnyPermission(principal, ARCHIVE_VIEW_PERMISSIONS)) {
    throw new AuthorizationError(`Missing archive permission: ${permission}`);
  }
}

function assertAnyArchivePermission(principal: Principal, permissions: readonly Permission[]) {
  if (!hasAnyPermission(principal, permissions) && !hasPermission(principal, "permissions.manage")) {
    throw new AuthorizationError();
  }
}

function canViewCategory(principal: Principal, category: ArchiveCategory) {
  return (
    hasPermission(principal, ARCHIVE_CATEGORY_META[category].requiredPermission) ||
    hasAnyPermission(principal, ARCHIVE_VIEW_PERMISSIONS)
  );
}

function objectId(value: string | null | undefined) {
  if (!value || !Types.ObjectId.isValid(value)) {
    return null;
  }

  return new Types.ObjectId(value);
}

function actorId(actor: Principal) {
  return objectId(actor.id);
}

function actorName(actor: Principal) {
  return actor.email;
}

function serializeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.toISOString();
}

function formatReference(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function serializeRecord(record: RawArchiveRecord): ArchiveRecordSummary {
  return {
    id: record._id.toString(),
    archiveReference: record.archiveReference,
    recordId: record.recordId,
    recordType: record.recordType,
    recordTypeLabel: getArchiveRecordTypeLabel(record.recordType),
    recordReference: record.recordReference,
    recordName: record.recordName,
    clientName: record.clientName ?? "",
    engagementReference: record.engagementReference ?? "",
    serviceName: record.serviceName ?? "",
    originalStatus: record.originalStatus,
    archiveStatus: record.archiveStatus,
    archiveStatusLabel: getArchiveStatusLabel(record.archiveStatus),
    archiveReason: record.archiveReason,
    archivedByName: record.archivedByName ?? "System",
    archivedAt: serializeDate(record.archivedAt),
    retentionPolicyName: record.retentionPolicyName,
    retentionExpiryDate: serializeDate(record.retentionExpiryDate),
    daysUntilExpiry: daysUntilRetentionExpiry(record.retentionExpiryDate),
    legalHoldStatus: record.legalHoldStatus ?? null,
    legalHoldReason: record.legalHoldReason ?? "",
    restoreEligible: Boolean(record.restoreEligible) && canRestoreArchiveRecord(record.archiveStatus),
    deleteEligible: Boolean(record.deleteEligible),
    deletionStatus: record.deletionStatus ?? "not_eligible",
    readOnly: record.readOnly ?? isArchiveReadOnly(record.archiveStatus),
    clientVisible: Boolean(record.clientVisible),
    href: `/admin/archive/${record._id.toString()}`,
  };
}

function serializeHold(hold: RawHold): LegalHoldRecord {
  return {
    id: hold._id.toString(),
    holdReference: hold.holdReference,
    archiveRecordId: hold.archiveRecordId.toString(),
    recordType: hold.recordType,
    recordId: hold.recordId,
    reason: hold.reason,
    appliedByName: hold.appliedByName ?? "System",
    appliedAt: serializeDate(hold.appliedAt),
    reviewDate: serializeDate(hold.reviewDate),
    expiryDate: serializeDate(hold.expiryDate),
    status: hold.status,
  };
}

function serializeRestore(request: RawRestore): RestoreRequestRecord {
  return {
    id: request._id.toString(),
    requestReference: request.requestReference,
    archiveRecordId: request.archiveRecordId.toString(),
    recordType: request.recordType,
    recordReference: request.recordReference,
    requestedByName: request.requestedByName ?? "System",
    requestedAt: serializeDate(request.requestedAt),
    restoreReason: request.restoreReason,
    restoreType: request.restoreType,
    approvalStatus: request.approvalStatus,
    assignedApproverName: request.assignedApproverName ?? "",
    decision: request.decision ?? "",
    decisionAt: serializeDate(request.decisionAt),
    decisionReason: request.decisionReason ?? "",
  };
}

function serializeDeletion(request: RawDeletion): DeletionRequestRecord {
  return {
    id: request._id.toString(),
    requestReference: request.requestReference,
    archiveRecordId: request.archiveRecordId.toString(),
    recordType: request.recordType,
    recordReference: request.recordReference,
    retentionExpiryDate: serializeDate(request.retentionExpiryDate),
    legalHoldStatus: request.legalHoldStatus ?? "",
    requestedByName: request.requestedByName ?? "System",
    requestedAt: serializeDate(request.requestedAt),
    deletionReason: request.deletionReason,
    approvedByName: request.approvedByName ?? "",
    scheduledDeletionDate: serializeDate(request.scheduledDeletionDate),
    status: request.status,
  };
}

function archiveQuery(filters: ArchiveFilters, principal: Principal) {
  const query: Record<string, unknown> = {};

  if (filters.category && filters.category !== "overview") {
    query.recordType = { $in: ARCHIVE_CATEGORY_META[filters.category].recordTypes };
  }

  if (filters.recordType) {
    query.recordType = filters.recordType;
  }

  if (filters.status) {
    query.archiveStatus = filters.status;
  }

  if (filters.legalHold === "active") {
    query.legalHoldStatus = { $in: ["active", "under_review", "extended"] };
  }

  if (filters.legalHold === "none") {
    query.$or = [{ legalHoldStatus: null }, { legalHoldStatus: "released" }];
  }

  if (filters.retention === "expired") {
    query.retentionExpiryDate = { $lte: new Date() };
  }

  if (filters.search) {
    const expression = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { archiveReference: expression },
      { recordReference: expression },
      { recordName: expression },
      { clientName: expression },
      { engagementReference: expression },
      { serviceName: expression },
    ];
  }

  if (!hasAnyPermission(principal, ARCHIVE_VIEW_PERMISSIONS)) {
    query.recordType = {
      $in: Object.values(ARCHIVE_CATEGORY_META)
        .filter((category) => canViewCategory(principal, category.key))
        .flatMap((category) => category.recordTypes),
    };
  }

  return query;
}

export async function getArchiveDashboardData(
  principal: Principal,
  filters: ArchiveFilters = {},
): Promise<ArchiveDashboardData> {
  await connectToDatabase();
  assertArchiveAccess(principal, "archive.view_overview");

  if (filters.category && !canViewCategory(principal, filters.category)) {
    throw new AuthorizationError();
  }

  const [recordsRaw, allRecordsRaw, policiesRaw, holdsRaw, restoreRaw, deletionRaw, auditRaw] =
    await Promise.all([
      ArchiveRecordModel.find(archiveQuery(filters, principal)).sort({ archivedAt: -1 }).limit(100).lean().exec(),
      ArchiveRecordModel.find(archiveQuery({}, principal)).select("recordType archiveStatus retentionExpiryDate legalHoldStatus archivedAt").lean().exec(),
      ArchiveRetentionPolicyModel.find({}).sort({ recordType: 1, name: 1 }).lean().exec(),
      LegalHoldModel.find({ status: { $in: ["active", "under_review", "extended"] } }).sort({ appliedAt: -1 }).limit(20).lean().exec(),
      ArchiveRestoreRequestModel.find({ approvalStatus: "pending" }).sort({ requestedAt: -1 }).limit(20).lean().exec(),
      ArchiveDeletionRequestModel.find({ status: { $in: ["deletion_requested", "pending_approval", "approved", "scheduled"] } }).sort({ requestedAt: -1 }).limit(20).lean().exec(),
      AuditLogModel.find({ resourceType: "ArchiveRecord" }).sort({ createdAt: -1 }).limit(20).lean().exec(),
    ]);
  const records = (recordsRaw as unknown as RawArchiveRecord[]).map(serializeRecord);
  const allRecords = allRecordsRaw as unknown as RawArchiveRecord[];
  const policies = policiesRaw as unknown as RawPolicy[];
  const activeHolds = holdsRaw as unknown as RawHold[];
  const restoreRequests = (restoreRaw as unknown as RawRestore[]).map(serializeRestore);
  const deletionRequests = (deletionRaw as unknown as RawDeletion[]).map(serializeDeletion);
  const now = new Date();
  const nearExpiry = allRecords.filter((record) =>
    isRetentionNearExpiry(record.retentionExpiryDate, [90, 30, 7, 0], now),
  );
  const legalHoldCount = allRecords.filter((record) =>
    ["active", "under_review", "extended"].includes(record.legalHoldStatus ?? ""),
  ).length;
  const pendingDeletionCount = allRecords.filter((record) =>
    ["pending_deletion", "permanently_deleted"].includes(record.archiveStatus),
  ).length;

  return {
    dataFreshness: new Date().toISOString(),
    summary: [
      {
        label: "Archived Clients",
        value: String(allRecords.filter((record) => ["client", "client_organization"].includes(record.recordType)).length),
        helper: "Client records removed from active operations.",
        href: "/admin/archive?category=clients",
      },
      {
        label: "Archived Engagements",
        value: String(allRecords.filter((record) => record.recordType === "engagement").length),
        helper: "Read-only workspaces retained for history.",
        href: "/admin/archive?category=engagements",
      },
      {
        label: "Archived Documents",
        value: String(allRecords.filter((record) => record.recordType === "document").length),
        helper: "Retained document and version records.",
        href: "/admin/archive?category=documents",
      },
      {
        label: "Legal Holds",
        value: String(legalHoldCount),
        helper: "Records protected from deletion.",
        href: "/admin/archive?category=legal_holds",
      },
      {
        label: "Retention Expiring",
        value: String(nearExpiry.length),
        helper: "Records inside a retention warning window.",
        href: "/admin/archive?retention=near_expiry",
      },
      {
        label: "Restore Requests",
        value: String(restoreRequests.length),
        helper: "Requests awaiting approval.",
        href: "/admin/archive?category=restore_requests",
      },
      {
        label: "Pending Deletion",
        value: String(pendingDeletionCount + deletionRequests.length),
        helper: "Restricted deletion queue.",
        href: "/admin/archive?category=pending_deletion",
      },
      {
        label: "Recently Archived",
        value: String(allRecords.filter((record) => record.archivedAt && Date.now() - new Date(record.archivedAt).getTime() <= 30 * 86_400_000).length),
        helper: "Records archived in the last 30 days.",
        href: "/admin/archive",
      },
    ],
    categories: Object.values(ARCHIVE_CATEGORY_META).map((category) => ({
      key: category.key,
      label: category.label,
      description: category.description,
      icon: category.icon,
      count: allRecords.filter((record) => category.recordTypes.includes(record.recordType)).length,
      href: category.key === "overview" ? "/admin/archive" : `/admin/archive?category=${category.key}`,
    })),
    records,
    attention: records.filter(
      (record) =>
        record.legalHoldStatus ||
        record.archiveStatus === "restore_requested" ||
        record.archiveStatus === "pending_deletion" ||
        (record.daysUntilExpiry !== null && record.daysUntilExpiry <= 90),
    ),
    distribution: Object.entries(
      allRecords.reduce<Record<string, number>>((counts, record) => {
        counts[getArchiveRecordTypeLabel(record.recordType)] =
          (counts[getArchiveRecordTypeLabel(record.recordType)] ?? 0) + 1;
        return counts;
      }, {}),
    ).map(([label, value]) => ({ label, value })),
    activity: (auditRaw as unknown as RawAudit[]).map((activity) => ({
      id: activity._id.toString(),
      action: activity.action,
      actorEmail: activity.actorEmail ?? null,
      resourceId: activity.resourceId ?? null,
      reason: activity.reason ?? null,
      createdAt: serializeDate(activity.createdAt),
    })),
    retentionPolicies: policies.map((policy) => {
      const covered = allRecords.filter((record) => record.recordType === policy.recordType);
      return {
        id: policy._id.toString(),
        name: policy.name,
        recordType: policy.recordType,
        recordTypeLabel: getArchiveRecordTypeLabel(policy.recordType),
        version: policy.version ?? 1,
        retentionPeriodMonths: policy.retentionPeriodMonths ?? 0,
        warningDays: policy.warningDays ?? [90, 30, 7, 0],
        activeRecordsCovered: covered.length,
        recordsNearingExpiry: covered.filter((record) =>
          isRetentionNearExpiry(record.retentionExpiryDate, policy.warningDays ?? [90, 30, 7, 0], now),
        ).length,
        recordsUnderHold: covered.filter((record) => record.legalHoldStatus).length,
        updatedAt: serializeDate(policy.updatedAt),
        updatedByName: policy.updatedByName ?? "System",
        active: Boolean(policy.active),
      };
    }),
    legalHolds: activeHolds.map(serializeHold),
    restoreRequests,
    deletionRequests,
    permissions: ARCHIVE_PERMISSION_MATRIX,
    filters,
  };
}

export async function getArchiveDetailData(
  principal: Principal,
  archiveId: string,
): Promise<ArchiveDetailData | null> {
  await connectToDatabase();
  assertArchiveAccess(principal, "archive.view_overview");

  const id = objectId(archiveId);

  if (!id) {
    return null;
  }

  const [recordRaw, holdsRaw, restoreRaw, deletionRaw, auditRaw] = await Promise.all([
    ArchiveRecordModel.findById(id).lean().exec(),
    LegalHoldModel.find({ archiveRecordId: id }).sort({ appliedAt: -1 }).lean().exec(),
    ArchiveRestoreRequestModel.find({ archiveRecordId: id }).sort({ requestedAt: -1 }).lean().exec(),
    ArchiveDeletionRequestModel.find({ archiveRecordId: id }).sort({ requestedAt: -1 }).lean().exec(),
    AuditLogModel.find({ resourceType: "ArchiveRecord", resourceId: archiveId }).sort({ createdAt: -1 }).limit(50).lean().exec(),
  ]);
  const raw = recordRaw as unknown as RawArchiveRecord | null;

  if (!raw) {
    return null;
  }

  const base = serializeRecord(raw);
  const snapshot = raw.snapshot ?? {};

  return {
    record: {
      ...base,
      previousLocation: raw.previousLocation ?? "",
      archiveNotes: raw.archiveNotes ?? "",
      snapshot,
      restoredAt: serializeDate(raw.restoredAt),
      restoreReason: raw.restoreReason ?? "",
      permanentlyDeletedAt: serializeDate(raw.permanentlyDeletedAt),
      deletionEvidence: raw.deletionEvidence ?? "",
    },
    lifecycle: [
      { label: "Original Status", value: raw.originalStatus },
      { label: "Archive Status", value: getArchiveStatusLabel(raw.archiveStatus) },
      { label: "Read Only", value: base.readOnly ? "Yes" : "No" },
      { label: "Restore Eligibility", value: base.restoreEligible ? "Eligible" : "Restricted" },
      { label: "Delete Eligibility", value: base.deleteEligible ? "Eligible after approval" : "Not eligible" },
      { label: "Retention Expiry", value: base.retentionExpiryDate ?? "Not recorded" },
    ],
    workflowHistory: asRecordArray(snapshot.workflowHistory),
    documents: asRecordArray(snapshot.documents),
    messages: asRecordArray(snapshot.messages),
    finance: asRecordArray(snapshot.finance),
    timeline: asRecordArray(snapshot.timeline).map((item) => ({
      title: String(item.title ?? item.action ?? "Archive event"),
      date: String(item.date ?? item.createdAt ?? ""),
      description: String(item.description ?? ""),
    })),
    audit: [
      ...asRecordArray(snapshot.auditRecords).map((activity, index) => ({
        id: String(activity._id ?? `workflow-audit-${index}`),
        action: String(activity.action ?? "Engagement activity"),
        actorEmail: activity.actorEmail ? String(activity.actorEmail) : null,
        resourceId: activity.resourceId ? String(activity.resourceId) : raw.recordId,
        reason: activity.reason ? String(activity.reason) : null,
        createdAt: activity.createdAt ? String(activity.createdAt) : null,
      })),
      ...(auditRaw as unknown as RawAudit[]).map((activity) => ({
        id: activity._id.toString(),
        action: activity.action,
        actorEmail: activity.actorEmail ?? null,
        resourceId: activity.resourceId ?? null,
        reason: activity.reason ?? null,
        createdAt: serializeDate(activity.createdAt),
      })),
    ],
    legalHolds: (holdsRaw as unknown as RawHold[]).map(serializeHold),
    restoreRequests: (restoreRaw as unknown as RawRestore[]).map(serializeRestore),
    deletionRequests: (deletionRaw as unknown as RawDeletion[]).map(serializeDeletion),
  };
}

export async function requestArchiveRestore(input: {
  actor: Principal;
  archiveRecordId: string;
  restoreReason: string;
  restoreType: RestoreType;
}) {
  await connectToDatabase();
  assertAnyArchivePermission(input.actor, ["archive.request_restore", "archive.restore_records", "archive.restore"]);

  const id = objectId(input.archiveRecordId);
  const record = id ? await ArchiveRecordModel.findById(id).lean().exec() : null;
  const raw = record as unknown as RawArchiveRecord | null;

  if (!id || !raw) {
    throw new Error("Archive record not found.");
  }

  if (!canRestoreArchiveRecord(raw.archiveStatus)) {
    throw new Error("This archive status cannot be restored.");
  }

  const request = await ArchiveRestoreRequestModel.create({
    requestReference: formatReference("RESTORE"),
    archiveRecordId: id,
    recordType: raw.recordType,
    recordReference: raw.recordReference,
    requestedByUserId: actorId(input.actor),
    requestedByName: actorName(input.actor),
    restoreReason: input.restoreReason,
    restoreType: input.restoreType,
    approvalStatus: "pending",
  });

  await ArchiveRecordModel.updateOne(
    { _id: id },
    { $set: { archiveStatus: "restore_requested" } },
  ).exec();

  await writeAuditLog({
    actor: input.actor,
    action: "archive.restore_requested",
    resourceType: "ArchiveRecord",
    resourceId: input.archiveRecordId,
    reason: input.restoreReason,
    newValues: { requestReference: request.requestReference, restoreType: input.restoreType },
  });
}

export async function approveArchiveRestore(input: {
  actor: Principal;
  requestId: string;
  decisionReason: string;
}) {
  await connectToDatabase();
  assertAnyArchivePermission(input.actor, ["archive.approve_restore", "archive.restore_records", "archive.restore"]);

  const id = objectId(input.requestId);
  const request = id ? await ArchiveRestoreRequestModel.findById(id).lean().exec() : null;
  const raw = request as unknown as RawRestore | null;

  if (!id || !raw) {
    throw new Error("Restore request not found.");
  }

  await Promise.all([
    ArchiveRestoreRequestModel.updateOne(
      { _id: id },
      {
        $set: {
          approvalStatus: "approved",
          decision: "approved",
          decisionAt: new Date(),
          decisionReason: input.decisionReason,
          assignedApproverUserId: actorId(input.actor),
          assignedApproverName: actorName(input.actor),
        },
      },
    ).exec(),
    ArchiveRecordModel.updateOne(
      { _id: raw.archiveRecordId },
      {
        $set: {
          archiveStatus: "restored",
          restoredAt: new Date(),
          restoredByUserId: actorId(input.actor),
          restoreReason: input.decisionReason,
        },
      },
    ).exec(),
  ]);

  await writeAuditLog({
    actor: input.actor,
    action: "archive.restore_approved",
    resourceType: "ArchiveRecord",
    resourceId: raw.archiveRecordId.toString(),
    reason: input.decisionReason,
    newValues: { requestReference: raw.requestReference },
  });
}

export async function applyArchiveLegalHold(input: {
  actor: Principal;
  archiveRecordId: string;
  reason: string;
  reviewDate?: Date | null;
}) {
  await connectToDatabase();
  assertAnyArchivePermission(input.actor, ["archive.apply_legal_hold"]);

  const id = objectId(input.archiveRecordId);
  const record = id ? await ArchiveRecordModel.findById(id).lean().exec() : null;
  const raw = record as unknown as RawArchiveRecord | null;

  if (!id || !raw) {
    throw new Error("Archive record not found.");
  }

  const hold = await LegalHoldModel.create({
    holdReference: formatReference("HOLD"),
    archiveRecordId: id,
    recordType: raw.recordType,
    recordId: raw.recordId,
    reason: input.reason,
    appliedByUserId: actorId(input.actor),
    appliedByName: actorName(input.actor),
    reviewDate: input.reviewDate ?? null,
    status: "active",
  });

  await ArchiveRecordModel.updateOne(
    { _id: id },
    {
      $set: {
        archiveStatus: "legal_hold",
        legalHoldStatus: "active",
        legalHoldReason: input.reason,
        deleteEligible: false,
        deletionStatus: "not_eligible",
      },
    },
  ).exec();

  await writeAuditLog({
    actor: input.actor,
    action: "archive.legal_hold_applied",
    resourceType: "ArchiveRecord",
    resourceId: input.archiveRecordId,
    reason: input.reason,
    newValues: { holdReference: hold.holdReference },
  });
}

export async function releaseArchiveLegalHold(input: {
  actor: Principal;
  holdId: string;
  removalReason: string;
}) {
  await connectToDatabase();
  assertAnyArchivePermission(input.actor, ["archive.remove_legal_hold"]);

  const id = objectId(input.holdId);
  const hold = id ? await LegalHoldModel.findById(id).lean().exec() : null;
  const raw = hold as unknown as RawHold | null;

  if (!id || !raw) {
    throw new Error("Legal hold not found.");
  }

  await Promise.all([
    LegalHoldModel.updateOne(
      { _id: id },
      {
        $set: {
          status: "released",
          removedByUserId: actorId(input.actor),
          removedByName: actorName(input.actor),
          removedAt: new Date(),
          removalReason: input.removalReason,
        },
      },
    ).exec(),
    ArchiveRecordModel.updateOne(
      { _id: raw.archiveRecordId },
      {
        $set: {
          archiveStatus: "archived",
          legalHoldStatus: "released",
          legalHoldReason: "",
        },
      },
    ).exec(),
  ]);

  await writeAuditLog({
    actor: input.actor,
    action: "archive.legal_hold_removed",
    resourceType: "ArchiveRecord",
    resourceId: raw.archiveRecordId.toString(),
    reason: input.removalReason,
    previousValues: { holdReference: raw.holdReference },
  });
}

export async function extendArchiveRetention(input: {
  actor: Principal;
  archiveRecordId: string;
  months: number;
  reason: string;
}) {
  await connectToDatabase();
  assertAnyArchivePermission(input.actor, ["archive.extend_retention", "archive.manage_retention"]);

  const id = objectId(input.archiveRecordId);
  const record = id ? await ArchiveRecordModel.findById(id).lean().exec() : null;
  const raw = record as unknown as RawArchiveRecord | null;

  if (!id || !raw) {
    throw new Error("Archive record not found.");
  }

  const baseDate = raw.retentionExpiryDate ? new Date(raw.retentionExpiryDate) : new Date();
  const nextDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth() + Math.max(1, input.months),
    baseDate.getDate(),
  );

  await ArchiveRecordModel.updateOne(
    { _id: id },
    {
      $set: {
        retentionExpiryDate: nextDate,
        archiveStatus: raw.legalHoldStatus ? raw.archiveStatus : "archived",
        deletionStatus: "not_eligible",
      },
    },
  ).exec();

  await writeAuditLog({
    actor: input.actor,
    action: "archive.retention_extended",
    resourceType: "ArchiveRecord",
    resourceId: input.archiveRecordId,
    reason: input.reason,
    previousValues: { retentionExpiryDate: raw.retentionExpiryDate },
    newValues: { retentionExpiryDate: nextDate, months: input.months },
  });
}

export async function requestArchiveDeletion(input: {
  actor: Principal;
  archiveRecordId: string;
  deletionReason: string;
}) {
  await connectToDatabase();
  assertAnyArchivePermission(input.actor, ["archive.request_deletion"]);

  const id = objectId(input.archiveRecordId);
  const record = id ? await ArchiveRecordModel.findById(id).lean().exec() : null;
  const raw = record as unknown as RawArchiveRecord | null;

  if (!id || !raw) {
    throw new Error("Archive record not found.");
  }

  const validation = validatePermanentDeletion({
    archiveStatus: raw.archiveStatus,
    retentionExpiryDate: raw.retentionExpiryDate,
    legalHoldStatus: raw.legalHoldStatus,
    hasActiveEngagementDependency: false,
    hasUnresolvedFinancialDependency: raw.recordType === "invoice" && raw.originalStatus !== "paid",
    approvalRecorded: false,
    deletionReasonProvided: Boolean(input.deletionReason),
  });

  if (validation.blockers.some((blocker) => blocker.includes("legal hold"))) {
    throw new Error("Deletion is blocked by legal hold.");
  }

  const request = await ArchiveDeletionRequestModel.create({
    requestReference: formatReference("DELETE"),
    archiveRecordId: id,
    recordType: raw.recordType,
    recordReference: raw.recordReference,
    retentionExpiryDate: raw.retentionExpiryDate ?? null,
    legalHoldStatus: raw.legalHoldStatus ?? "",
    requestedByUserId: actorId(input.actor),
    requestedByName: actorName(input.actor),
    deletionReason: input.deletionReason,
    status: "pending_approval",
  });

  await ArchiveRecordModel.updateOne(
    { _id: id },
    { $set: { archiveStatus: "pending_deletion", deletionStatus: "pending_approval" } },
  ).exec();

  await writeAuditLog({
    actor: input.actor,
    action: "archive.deletion_requested",
    resourceType: "ArchiveRecord",
    resourceId: input.archiveRecordId,
    reason: input.deletionReason,
    newValues: { requestReference: request.requestReference, eligibilityWarnings: validation.blockers },
  });
}

function asRecordArray(value: unknown): Array<Record<string, string | number>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, string | number> => typeof item === "object" && item !== null)
    : [];
}
