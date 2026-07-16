import {
  Download,
  Filter,
  Lock,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { ArchiveCategoryIcon } from "@/components/dashboard/archive/archive-category-icon";
import {
  ArchiveStatusBadge,
  LegalHoldBadge,
} from "@/components/dashboard/archive/archive-status-badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  applyArchiveLegalHoldAction,
  requestArchiveDeletionAction,
  requestArchiveRestoreAction,
} from "@/features/archive/actions";
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
  ArchiveRecordSummary,
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

function hiddenArchiveId(recordId: string) {
  return <input name="archiveRecordId" type="hidden" value={recordId} />;
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
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Archive
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
              Find completed or inactive records and manage retention, restore and deletion requests.
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
              Export Archive Summary
            </a>
          </div>
        </div>
      </section>

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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Archive register</CardTitle>
            <CardDescription>
              Server-side archive records with retention, legal hold and restore state.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.records.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Record</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Original</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Archived</TableHead>
                      <TableHead>Retention Expiry</TableHead>
                      <TableHead>Legal Hold</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="min-w-64">
                          <Link
                            className="font-semibold text-foreground hover:text-accent"
                            href={record.href}
                          >
                            {record.recordName}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {record.archiveReference} · {record.recordReference}
                          </p>
                        </TableCell>
                        <TableCell>{record.recordTypeLabel}</TableCell>
                        <TableCell>{record.clientName || "Not linked"}</TableCell>
                        <TableCell>{record.originalStatus}</TableCell>
                        <TableCell>
                          <ArchiveStatusBadge status={record.archiveStatus} />
                        </TableCell>
                        <TableCell>{formatDate(record.archivedAt)}</TableCell>
                        <TableCell>
                          {formatDate(record.retentionExpiryDate)}
                          {record.daysUntilExpiry !== null ? (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {record.daysUntilExpiry} days
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <LegalHoldBadge status={record.legalHoldStatus} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              className={buttonClassName({ variant: "secondary", size: "sm" })}
                              href={record.href}
                            >
                              View
                            </Link>
                            <form action={requestArchiveRestoreAction}>
                              {hiddenArchiveId(record.id)}
                              <input
                                name="restoreReason"
                                type="hidden"
                                value="Restore requested from archive register."
                              />
                              <input name="restoreType" type="hidden" value="restore_for_viewing" />
                              <button
                                className={buttonClassName({ variant: "secondary", size: "sm" })}
                                disabled={!record.restoreEligible}
                                type="submit"
                              >
                                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                                Restore
                              </button>
                            </form>
                            <form action={applyArchiveLegalHoldAction}>
                              {hiddenArchiveId(record.id)}
                              <input
                                name="reason"
                                type="hidden"
                                value="Legal hold applied from archive register."
                              />
                              <button
                                className={buttonClassName({ variant: "secondary", size: "sm" })}
                                disabled={Boolean(record.legalHoldStatus && record.legalHoldStatus !== "released")}
                                type="submit"
                              >
                                <Lock aria-hidden="true" className="h-4 w-4" />
                                Hold
                              </button>
                            </form>
                            <form action={requestArchiveDeletionAction}>
                              {hiddenArchiveId(record.id)}
                              <input
                                name="deletionReason"
                                type="hidden"
                                value="Deletion review requested from archive register."
                              />
                              <button
                                className={buttonClassName({ variant: "ghost", size: "sm" })}
                                disabled={!record.deleteEligible || Boolean(record.legalHoldStatus)}
                                type="submit"
                              >
                                <Trash2 aria-hidden="true" className="h-4 w-4" />
                                Delete
                              </button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-8 text-center">
                <p className="font-semibold text-foreground">No archived records</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  No archived records were found.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid content-start gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Records requiring attention</CardTitle>
              <CardDescription>Retention, restore, legal hold and deletion items.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.attention.length > 0 ? (
                data.attention.slice(0, 6).map((record) => (
                  <Link
                    className="rounded-md border border-border px-3 py-3 hover:border-accent"
                    href={record.href}
                    key={record.id}
                  >
                    <p className="text-sm font-semibold text-foreground">{record.recordName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {record.archiveStatusLabel} · expires {formatDate(record.retentionExpiryDate)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No records are approaching retention expiry.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Archive distribution</CardTitle>
              <CardDescription>Records by type.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.distribution.map((item) => (
                <div className="grid gap-1" key={item.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{item.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-sm bg-muted">
                    <div
                      className="h-2 rounded-sm bg-accent"
                      style={{ width: `${Math.max(8, item.value * 12)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Retention policies</CardTitle>
            <CardDescription>Configurable retention rules.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.retentionPolicies.slice(0, 6).map((policy) => (
              <div className="rounded-md border border-border px-3 py-3" key={policy.id}>
                <p className="text-sm font-semibold text-foreground">{policy.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {policy.retentionPeriodMonths} months · {policy.activeRecordsCovered} records
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legal holds</CardTitle>
            <CardDescription>Active and review holds.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.legalHolds.length > 0 ? (
              data.legalHolds.map((hold) => (
                <div className="rounded-md border border-border px-3 py-3" key={hold.id}>
                  <p className="text-sm font-semibold text-foreground">{hold.holdReference}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {hold.reason} · review {formatDate(hold.reviewDate)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                There are no active legal holds.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restore requests</CardTitle>
            <CardDescription>Awaiting approval.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.restoreRequests.length > 0 ? (
              data.restoreRequests.map((request) => (
                <div className="rounded-md border border-border px-3 py-3" key={request.id}>
                  <p className="text-sm font-semibold text-foreground">{request.requestReference}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.recordReference} · {request.approvalStatus}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                There are no restore requests awaiting review.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending deletion</CardTitle>
            <CardDescription>Restricted approval queue.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.deletionRequests.length > 0 ? (
              data.deletionRequests.map((request) => (
                <div className="rounded-md border border-border px-3 py-3" key={request.id}>
                  <p className="text-sm font-semibold text-foreground">{request.requestReference}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.recordReference} · {request.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                No records are pending deletion approval.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Archive activity</CardTitle>
          <CardDescription>Recent archive audit actions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.activity.length > 0 ? (
            data.activity.map((activity) => (
              <div className="rounded-md border border-border px-3 py-3" key={activity.id}>
                <p className="text-sm font-semibold text-foreground">{activity.action}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.actorEmail ?? "System"} · {formatDate(activity.createdAt)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
              Archive activity will appear here when records are archived, restored, held or exported.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
