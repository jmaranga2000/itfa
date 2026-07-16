import { ArchiveDashboard } from "@/components/dashboard/archive/archive-dashboard";
import { requireUser } from "@/features/auth/server";
import {
  ARCHIVE_CATEGORIES,
  ARCHIVE_RECORD_TYPES,
  ARCHIVE_STATUSES,
  type ArchiveCategory,
  type ArchiveRecordType,
  type ArchiveStatus,
} from "@/features/archive/types";
import {
  getArchiveDashboardData,
  type ArchiveFilters,
} from "@/repositories/archive-repository";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(params: Record<string, string | string[] | undefined>): ArchiveFilters {
  const category = firstParam(params.category);
  const recordType = firstParam(params.recordType);
  const status = firstParam(params.status);
  const legalHold = firstParam(params.legalHold);
  const retention = firstParam(params.retention);

  return {
    search: firstParam(params.search) || undefined,
    category: ARCHIVE_CATEGORIES.includes(category as ArchiveCategory)
      ? (category as ArchiveCategory)
      : undefined,
    recordType: ARCHIVE_RECORD_TYPES.includes(recordType as ArchiveRecordType)
      ? (recordType as ArchiveRecordType)
      : undefined,
    status: ARCHIVE_STATUSES.includes(status as ArchiveStatus)
      ? (status as ArchiveStatus)
      : undefined,
    legalHold: legalHold === "active" || legalHold === "none" ? legalHold : undefined,
    retention:
      retention === "near_expiry" || retention === "expired" ? retention : undefined,
  };
}

export default async function AdminArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, principal] = await Promise.all([searchParams, requireUser()]);
  const filters = parseFilters(params);
  const data = await getArchiveDashboardData(principal, filters);

  return <ArchiveDashboard data={data} filters={filters} />;
}
