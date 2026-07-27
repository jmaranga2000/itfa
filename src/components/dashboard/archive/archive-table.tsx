import {
  Lock,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
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
import type {
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

function hiddenArchiveId(recordId: string) {
  return <input name="archiveRecordId" type="hidden" value={recordId} />;
}

export function ArchiveTable({
  records,
}: {
  records: ArchiveRecordSummary[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Archive register</CardTitle>
        <CardDescription>
          Server-side archive records with retention, legal hold and restore state.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length > 0 ? (
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
                {records.map((record) => (
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
                            value="Restore from archive register."
                          />
                          <input name="restoreType" type="hidden" value="restore_to_active" />
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
                            Request Deletion
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
  );
}
