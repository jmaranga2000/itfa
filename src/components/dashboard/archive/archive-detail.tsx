import {
  Download,
  Lock,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  ArchiveStatusBadge,
  LegalHoldBadge,
} from "@/components/dashboard/archive/archive-status-badge";
import { Badge } from "@/components/ui/badge";
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
  approveArchiveRestoreAction,
  extendArchiveRetentionAction,
  releaseArchiveLegalHoldAction,
  requestArchiveDeletionAction,
  requestArchiveRestoreAction,
} from "@/features/archive/actions";
import type { ArchiveDetailData } from "@/repositories/archive-repository";

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

function hiddenArchiveId(recordId: string) {
  return <input name="archiveRecordId" type="hidden" value={recordId} />;
}

function DataTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: Array<Record<string, string | number>>;
}) {
  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column}>{row[column]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
            No records were found in this archived section.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ArchiveDetail({ data }: { data: ArchiveDetailData }) {
  const activeHold = data.legalHolds.find((hold) => hold.status !== "released");
  const pendingRestore = data.restoreRequests.find((request) => request.approvalStatus === "pending");
  const record = data.record;
  const exportHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data.record, null, 2))}`;

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="teal">{record.recordTypeLabel}</Badge>
              <ArchiveStatusBadge status={record.archiveStatus} />
              <LegalHoldBadge status={record.legalHoldStatus} />
              {record.readOnly ? <Badge tone="slate">Read-only</Badge> : null}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              {record.recordName}
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
              {record.archiveReason}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-md border border-border px-2 py-1">
                {record.archiveReference}
              </span>
              <span className="rounded-md border border-border px-2 py-1">
                Archived {formatDate(record.archivedAt)}
              </span>
              <span className="rounded-md border border-border px-2 py-1">
                Retention expires {formatDate(record.retentionExpiryDate)}
              </span>
              <span className="rounded-md border border-border px-2 py-1">
                Archived by {record.archivedByName}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonClassName({ variant: "secondary" })} href="/admin/archive">
              Archive
            </Link>
            <a
              className={buttonClassName({ variant: "secondary" })}
              download={`${record.archiveReference}.json`}
              href={exportHref}
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Export Summary
            </a>
            <form action={requestArchiveRestoreAction}>
              {hiddenArchiveId(record.id)}
              <input
                name="restoreReason"
                type="hidden"
                value="Restore requested from archive detail page."
              />
              <input name="restoreType" type="hidden" value="restore_for_viewing" />
              <button
                className={buttonClassName()}
                disabled={!record.restoreEligible}
                type="submit"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Request Restore
              </button>
            </form>
          </div>
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-md border border-border bg-card p-2 text-sm font-semibold">
        {["Summary", "Workflow History", "Documents", "Messages", "Finance", "Timeline", "Audit"].map(
          (item) => (
            <a
              className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
              key={item}
            >
              {item}
            </a>
          ),
        )}
      </nav>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" id="summary">
        <Card>
          <CardHeader>
            <CardTitle>Archive summary</CardTitle>
            <CardDescription>Original record state, retention and restore eligibility.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              ["Record reference", record.recordReference],
              ["Client", record.clientName || "Not linked"],
              ["Engagement", record.engagementReference || "Not linked"],
              ["Service", record.serviceName || "Not linked"],
              ["Original status", record.originalStatus],
              ["Archive status", record.archiveStatusLabel],
              ["Policy", record.retentionPolicyName],
              ["Previous location", record.previousLocation],
              ["Restore", record.restoreEligible ? "Eligible" : "Restricted"],
              ["Deletion", record.deleteEligible ? record.deletionStatus : "Not eligible"],
            ].map(([label, value]) => (
              <div className="rounded-md border border-border px-3 py-3" key={label}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controlled actions</CardTitle>
            <CardDescription>Actions require reasons and audit history.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form action={extendArchiveRetentionAction} className="grid gap-2 rounded-md border border-border p-3">
              {hiddenArchiveId(record.id)}
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-foreground">Extend retention</span>
                <input
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  defaultValue="12"
                  min="1"
                  name="months"
                  type="number"
                />
              </label>
              <input name="reason" type="hidden" value="Retention extended from archive detail page." />
              <button className={buttonClassName({ variant: "secondary", size: "sm" })} type="submit">
                Extend Retention
              </button>
            </form>

            {activeHold ? (
              <form action={releaseArchiveLegalHoldAction} className="grid gap-2 rounded-md border border-border p-3">
                {hiddenArchiveId(record.id)}
                <input name="holdId" type="hidden" value={activeHold.id} />
                <input
                  name="removalReason"
                  type="hidden"
                  value="Legal hold released from archive detail page."
                />
                <button className={buttonClassName({ variant: "secondary", size: "sm" })} type="submit">
                  Remove Legal Hold
                </button>
              </form>
            ) : (
              <form action={applyArchiveLegalHoldAction} className="grid gap-2 rounded-md border border-border p-3">
                {hiddenArchiveId(record.id)}
                <input name="reason" type="hidden" value="Legal hold applied from archive detail page." />
                <button className={buttonClassName({ variant: "secondary", size: "sm" })} type="submit">
                  <Lock aria-hidden="true" className="h-4 w-4" />
                  Apply Legal Hold
                </button>
              </form>
            )}

            {pendingRestore ? (
              <form action={approveArchiveRestoreAction} className="grid gap-2 rounded-md border border-border p-3">
                {hiddenArchiveId(record.id)}
                <input name="requestId" type="hidden" value={pendingRestore.id} />
                <input
                  name="decisionReason"
                  type="hidden"
                  value="Restore approved from archive detail page."
                />
                <button className={buttonClassName({ variant: "secondary", size: "sm" })} type="submit">
                  Approve Restore
                </button>
              </form>
            ) : null}

            <form action={requestArchiveDeletionAction} className="grid gap-2 rounded-md border border-border p-3">
              {hiddenArchiveId(record.id)}
              <input
                name="deletionReason"
                type="hidden"
                value="Deletion approval requested from archive detail page."
              />
              <button
                className={buttonClassName({ variant: "ghost", size: "sm" })}
                disabled={!record.deleteEligible || Boolean(record.legalHoldStatus)}
                type="submit"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Request Deletion
              </button>
            </form>
          </CardContent>
        </Card>
      </section>

      <DataTable
        description="Completed stages, milestones, blockers and approvals preserved from the workspace."
        rows={data.workflowHistory}
        title="Workflow History"
      />
      <DataTable
        description="Archived document metadata and preserved versions."
        rows={data.documents}
        title="Documents"
      />
      <DataTable
        description="Permitted archived communication. Internal notes remain protected."
        rows={data.messages}
        title="Messages"
      />
      <DataTable
        description="Archived invoices, payments, balances and receipt evidence."
        rows={data.finance}
        title="Finance"
      />

      <section className="grid gap-5 xl:grid-cols-2" id="timeline">
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Historical archive and workspace activity.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.timeline.length > 0 ? (
              data.timeline.map((item) => (
                <div className="rounded-md border border-border px-3 py-3" key={`${item.title}-${item.date}`}>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.date}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                No timeline entries are available.
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="audit">
          <CardHeader>
            <CardTitle>Audit</CardTitle>
            <CardDescription>Protected archive audit history.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.audit.length > 0 ? (
              data.audit.map((item) => (
                <div className="rounded-md border border-border px-3 py-3" key={item.id}>
                  <p className="text-sm font-semibold text-foreground">{item.action}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.actorEmail ?? "System"} · {formatDate(item.createdAt)}
                  </p>
                  {item.reason ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reason}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                Audit activity will appear here after archive actions occur.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
