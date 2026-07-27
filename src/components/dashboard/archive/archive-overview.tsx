import { Download } from "lucide-react";
import Link from "next/link";
import { ArchiveCategoryIcon } from "@/components/dashboard/archive/archive-category-icon";
import { buttonClassName } from "@/components/ui/button";
import type { ArchiveDashboardData, ArchiveRecordSummary } from "@/repositories/archive-repository";

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

function csvHref(records: ArchiveRecordSummary[]) {
  const rows = [
    "Archive Reference,Record,Record Type,Client,Engagement,Status,Archived At,Retention Expiry,Legal Hold",
    ...records.map((record) =>
      [
        record.archiveReference,
        record.recordName,
        record.recordTypeLabel,
        record.clientName,
        record.engagementReference,
        record.archiveStatusLabel,
        record.archivedAt ?? "",
        record.retentionExpiryDate ?? "",
        record.legalHoldStatus ?? "",
      ]
        .map((value) => JSON.stringify(value))
        .join(","),
    ),
  ];

  return `data:text/csv;charset=utf-8,${encodeURIComponent(rows.join("\n"))}`;
}

export function ArchiveOverview({ data }: { data: ArchiveDashboardData }) {
  return (
    <div className="grid gap-5">
      {/* Header */}
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Archive Overview
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
              High-level summary and statistics of archived records by category.
            </p>
            <p className="mt-3 text-xs font-semibold text-muted-foreground">
              Data current as of {formatDate(data.dataFreshness)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className={buttonClassName({ variant: "secondary" })}
              download="ifta-archive-summary.csv"
              href={csvHref(data.records)}
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Export Summary
            </a>
            <Link
              className={buttonClassName({ variant: "ghost" })}
              href="/admin/archive"
            >
              Back to records
            </Link>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {data.summary.map((item) => (
          <Link
            className="bg-card p-4 transition-colors hover:bg-muted/40"
            href={item.href}
            key={item.label}
          >
            <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.helper}</p>
          </Link>
        ))}
      </section>

      {/* Category cards */}
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
        {data.categories.map((category) => (
          <Link
            className="rounded-md border border-border bg-card p-4 shadow-sm hover:border-accent"
            href={category.href}
            key={category.key}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground">
                <ArchiveCategoryIcon icon={category.icon} />
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {category.count} records
              </span>
            </div>
            <h2 className="mt-4 text-sm font-bold text-foreground">{category.label}</h2>
            <p className="mt-2 min-h-14 text-xs leading-5 text-muted-foreground">
              {category.description}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
