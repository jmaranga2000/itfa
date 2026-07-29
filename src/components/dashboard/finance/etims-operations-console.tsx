import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Tags,
} from "lucide-react";
import {
  reconcileEtimsTransactionAction,
  retryEtimsTransactionAction,
  retryFinanceDeliveryAction,
} from "@/features/etims/actions";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EtimsOperationRecord } from "@/repositories/etims-operations-repository";

function tone(status: string) {
  if (status === "COMPLETED") return "green" as const;
  if (["DEAD_LETTER", "RECONCILIATION_REQUIRED"].includes(status)) return "red" as const;
  if (["RETRY_REQUIRED", "PROCESSING"].includes(status)) return "gold" as const;
  return "teal" as const;
}

function label(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Waiting",
    PROCESSING: "Processing",
    COMPLETED: "Completed",
    RETRY_REQUIRED: "Retry scheduled",
    RECONCILIATION_REQUIRED: "Check KRA status",
    DEAD_LETTER: "Admin attention",
    PARTIALLY_DELIVERED: "Delivery incomplete",
  };
  return labels[status] ?? status.replaceAll("_", " ").toLowerCase();
}

function recordHref(record: EtimsOperationRecord) {
  return record.aggregateType === "INVOICE"
    ? `/admin/invoices/${record.aggregateId}`
    : `/admin/finance/etims/adjustments/${record.aggregateId}`;
}

function dateTime(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not yet";
}

function Recovery({ record }: { record: EtimsOperationRecord }) {
  if (record.status === "RECONCILIATION_REQUIRED") {
    return <form action={reconcileEtimsTransactionAction}><input name="eventId" type="hidden" value={record.eventId} /><SubmitButton pendingText="Checking..." size="sm"><ShieldCheck className="h-4 w-4" />Check KRA</SubmitButton></form>;
  }
  if (["RETRY_REQUIRED", "DEAD_LETTER"].includes(record.status)) {
    return <form action={retryEtimsTransactionAction} className="flex min-w-72 gap-2"><input name="eventId" type="hidden" value={record.eventId} /><Input aria-label="Retry reason" name="reason" placeholder="Reason for retry" required /><SubmitButton pendingText="Scheduling..." size="sm"><RefreshCcw className="h-4 w-4" />Retry</SubmitButton></form>;
  }
  if (record.delivery && ["PARTIALLY_DELIVERED", "RETRY_REQUIRED", "DEAD_LETTER"].includes(record.delivery.status)) {
    return <form action={retryFinanceDeliveryAction} className="flex min-w-72 gap-2"><input name="jobId" type="hidden" value={record.delivery.jobId} /><Input aria-label="Delivery retry reason" name="reason" placeholder="Reason for delivery retry" required /><SubmitButton pendingText="Scheduling..." size="sm"><RefreshCcw className="h-4 w-4" />Delivery</SubmitButton></form>;
  }
  return <span className="text-xs text-muted-foreground">No action needed</span>;
}

export function EtimsOperationsConsole({
  data,
  query,
}: {
  data: {
    records: EtimsOperationRecord[];
    summary: { total: number; pending: number; reconciliation: number; deadLetter: number; deliveryAttention: number };
  };
  query: { saved?: string; error?: string };
}) {
  return (
    <AdminPageSurface
      actions={(
        <>
          <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/finance/etims/mappings"><Tags className="h-4 w-4" />Service tax mapping</Link>
          <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/finance/etims/configuration"><Settings2 className="h-4 w-4" />Connection setup</Link>
        </>
      )}
      description="Follow fiscal submissions and client delivery. Uncertain KRA requests are checked before any retry is allowed."
      icon={Activity}
      summary={[
        { label: "Transactions", value: data.summary.total, helper: "Latest fiscal records", icon: Activity },
        { label: "In progress", value: data.summary.pending, helper: "Waiting or retrying", icon: RefreshCcw },
        { label: "Check KRA", value: data.summary.reconciliation, helper: "No automatic resend", icon: ShieldCheck },
        { label: "Need attention", value: data.summary.deadLetter + data.summary.deliveryAttention, helper: "Submission or delivery", icon: AlertTriangle },
      ]}
      title="KRA eTIMS activity"
    >
      <div className="grid gap-4">
        {query.saved ? <p className="rounded-md border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">The requested operation was saved.</p> : null}
        {query.error ? <p className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">The operation could not be completed. Refresh the record and review its current status.</p> : null}
        {data.records.length === 0 ? <EmptyState title="No eTIMS activity yet" description="Approved invoices and confirmed adjustment notes will appear here." /> : (
          <>
            <div className="grid gap-3 md:hidden">
              {data.records.map((record) => (
                <Card className="shadow-none" key={record.eventId}><CardContent className="grid gap-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-foreground">{record.reference}</p><p className="mt-1 text-sm text-muted-foreground">{record.clientName}</p></div><Badge tone={tone(record.status)}>{label(record.status)}</Badge></div><div className="grid grid-cols-2 gap-3 text-sm"><p><span className="block text-xs text-muted-foreground">Type</span>{record.aggregateType.replaceAll("_", " ")}</p><p><span className="block text-xs text-muted-foreground">Attempts</span>{record.attemptCount} of {record.maxAttempts}</p><p className="col-span-2"><span className="block text-xs text-muted-foreground">Last update</span>{dateTime(record.lastAttemptAt || record.createdAt)}</p></div>{record.lastErrorMessage ? <p className="rounded-md bg-danger-soft p-3 text-sm text-danger">{record.lastErrorMessage}</p> : null}<Recovery record={record} /><Link className={buttonClassName({ variant: "secondary", size: "sm", className: "w-full" })} href={recordHref(record)}>Open record<ArrowRight className="h-4 w-4" /></Link></CardContent></Card>
              ))}
            </div>
            <div className="hidden min-w-0 overflow-x-auto md:block">
              <Table className="min-w-[1050px]"><TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Client</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Attempts</TableHead><TableHead>Last update</TableHead><TableHead>Delivery</TableHead><TableHead>Recovery</TableHead><TableHead className="text-right">Open</TableHead></TableRow></TableHeader><TableBody>{data.records.map((record) => <TableRow key={record.eventId}><TableCell><p className="font-semibold text-foreground">{record.reference}</p>{record.lastErrorMessage ? <p className="mt-1 max-w-64 truncate text-xs text-danger">{record.lastErrorMessage}</p> : null}</TableCell><TableCell>{record.clientName}</TableCell><TableCell>{record.aggregateType.replaceAll("_", " ")}</TableCell><TableCell><Badge tone={tone(record.status)}>{label(record.status)}</Badge></TableCell><TableCell>{record.attemptCount} / {record.maxAttempts}</TableCell><TableCell>{dateTime(record.lastAttemptAt || record.createdAt)}</TableCell><TableCell>{record.delivery ? <Badge tone={tone(record.delivery.status)}>{label(record.delivery.status)}</Badge> : "Not started"}</TableCell><TableCell><Recovery record={record} /></TableCell><TableCell className="text-right"><Link className={buttonClassName({ variant: "ghost", size: "icon" })} href={recordHref(record)} title="Open fiscal record"><ArrowRight className="h-4 w-4" /></Link></TableCell></TableRow>)}</TableBody></Table>
            </div>
          </>
        )}
      </div>
    </AdminPageSurface>
  );
}
