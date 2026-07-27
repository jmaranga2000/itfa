import {
  Filter,
  Search,
  BarChart3,
  Settings,
  Activity,
  Info,
} from "lucide-react";
import Link from "next/link";
import { ArchiveTable } from "@/components/dashboard/archive/archive-table";
import { buttonClassName } from "@/components/ui/button";
import {
  ARCHIVE_CATEGORIES,
  ARCHIVE_RECORD_TYPES,
  ARCHIVE_STATUSES,
  getArchiveRecordTypeLabel,
  getArchiveStatusLabel,
  type ArchiveCategory,
} from "@/features/archive/types";
import type {
  ArchiveDashboardData,
  ArchiveFilters,
} from "@/repositories/archive-repository";

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function categoryLabel(category: ArchiveCategory) {
  return category
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ArchiveDashboard({
  data,
  filters,
}: {
  data: ArchiveDashboardData;
  filters: ArchiveFilters;
}) {
  return (
    <div className="grid gap-5">
      {/* Header with navigation */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-foreground">
            Archive Records
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage archived records with filtering, retention, and restore controls.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className={buttonClassName({ variant: "secondary", size: "sm" })}
            href="/admin/archive/overview"
          >
            <Info className="h-4 w-4" />
            Overview
          </Link>
          <Link
            className={buttonClassName({ variant: "secondary", size: "sm" })}
            href="/admin/archive/management"
          >
            <Settings className="h-4 w-4" />
            Management
          </Link>
          <Link
            className={buttonClassName({ variant: "secondary", size: "sm" })}
            href="/admin/archive/analytics"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Link>
          <Link
            className={buttonClassName({ variant: "secondary", size: "sm" })}
            href="/admin/archive/activity"
          >
            <Activity className="h-4 w-4" />
            Activity
          </Link>
        </div>
      </div>

      {/* Filter panel */}
      <form className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-[minmax(0,1.3fr)_repeat(5,minmax(135px,1fr))_auto_auto]">
        <label className="relative">
          <span className="sr-only">Search archive</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground"
            defaultValue={filters.search ?? ""}
            name="search"
            placeholder="Search client, record, reference..."
            type="search"
          />
        </label>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={filters.category ?? ""}
          name="category"
        >
          <option value="">All categories</option>
          {ARCHIVE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={filters.recordType ?? ""}
          name="recordType"
        >
          <option value="">All record types</option>
          {ARCHIVE_RECORD_TYPES.map((recordType) => (
            <option key={recordType} value={recordType}>
              {getArchiveRecordTypeLabel(recordType)}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={filters.status ?? ""}
          name="status"
        >
          <option value="">All statuses</option>
          {ARCHIVE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {getArchiveStatusLabel(status)}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={filters.legalHold ?? ""}
          name="legalHold"
        >
          <option value="">Legal hold</option>
          <option value="active">Active hold</option>
          <option value="none">No hold</option>
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={filters.retention ?? ""}
          name="retention"
        >
          <option value="">Retention</option>
          <option value="near_expiry">Near expiry</option>
          <option value="expired">Expired</option>
        </select>
        <button className={buttonClassName({ variant: "secondary" })} type="submit">
          <Filter aria-hidden="true" className="h-4 w-4" />
          Apply
        </button>
        <Link className={buttonClassName({ variant: "ghost" })} href="/admin/archive">
          Reset
        </Link>
      </form>

      {/* Archive table */}
      <ArchiveTable records={data.records} />
    </div>
  );
}
