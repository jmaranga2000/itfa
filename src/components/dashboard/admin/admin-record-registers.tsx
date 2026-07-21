import Link from "next/link";
import { CreditCard, Download, ExternalLink, FileCheck2, Files, ReceiptText, WalletCards } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminDocumentRecord, AdminInvoiceRecord, AdminPaymentRecord } from "@/repositories/admin-records-repository";

function dateLabel(value: string | null) {
  if (!value || value === new Date(0).toISOString()) return "Not recorded";
  return new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function money(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fileSize(size: number) {
  if (!size) return "Stored in workflow";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function statusTone(status: string) {
  if (["approved", "final", "verified", "paid"].includes(status)) return "green" as const;
  if (["rejected", "overdue", "cancelled", "replacement_requested"].includes(status)) return "red" as const;
  if (["pending", "pending_review", "issued", "partially_paid"].includes(status)) return "gold" as const;
  return "slate" as const;
}

function EmptyRows({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell className="py-10 text-center text-muted-foreground" colSpan={colSpan}>{label}</TableCell>
    </TableRow>
  );
}

export function AdminDocumentsRegister({ data }: { data: { records: AdminDocumentRecord[]; summary: { total: number; waiting: number; approved: number; clients: number } } }) {
  return (
    <AdminPageSurface
      description="Find client and engagement files, see what needs review, and download uploaded documents."
      icon={Files}
      summary={[
        { label: "Files", value: data.summary.total, helper: "All current records", icon: Files },
        { label: "Need review", value: data.summary.waiting, helper: "Waiting for a decision", icon: FileCheck2 },
        { label: "Approved", value: data.summary.approved, helper: "Approved or final", icon: FileCheck2 },
        { label: "Clients", value: data.summary.clients, helper: "With stored files", icon: WalletCards },
      ]}
      title="Documents"
    >
      <div className="min-w-0 overflow-x-auto">
        <Table className="min-w-[920px]">
          <TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Client</TableHead><TableHead>Engagement</TableHead><TableHead>Status</TableHead><TableHead>Uploaded</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.records.length ? data.records.map((record) => (
              <TableRow key={record.id}>
                <TableCell><p className="max-w-64 truncate font-semibold text-foreground">{record.name}</p><p className="mt-1 text-xs text-muted-foreground">{fileSize(record.size)} / {record.direction === "received" ? "From client" : "Shared with client"}</p></TableCell>
                <TableCell><p className="font-medium text-foreground">{record.clientName}</p><p className="mt-1 text-xs text-muted-foreground">{record.clientEmail}</p></TableCell>
                <TableCell>{record.engagementReference}</TableCell>
                <TableCell><Badge tone={statusTone(record.status)}>{record.status.replaceAll("_", " ")}</Badge></TableCell>
                <TableCell>{dateLabel(record.uploadedAt)}</TableCell>
                <TableCell><div className="flex justify-end gap-2">{record.downloadHref ? <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={record.downloadHref}><Download aria-hidden="true" className="h-4 w-4" />Download</Link> : null}{record.workflowId ? <Link className={buttonClassName({ variant: "ghost", size: "icon" })} href={`/admin/active-engagements/${record.workflowId}?tab=overview`} title="Open engagement"><ExternalLink aria-hidden="true" className="h-4 w-4" /></Link> : null}</div></TableCell>
              </TableRow>
            )) : <EmptyRows colSpan={6} label="No documents have been uploaded yet." />}
          </TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}

export function AdminInvoicesRegister({ data }: { data: { records: AdminInvoiceRecord[]; summary: { total: number; issued: number; unpaid: number; outstanding: number } } }) {
  const currency = data.records[0]?.currency ?? "KES";
  return (
    <AdminPageSurface
      description="A simple view of every engagement invoice, payment position, and balance still due."
      icon={ReceiptText}
      summary={[
        { label: "Engagements", value: data.summary.total, helper: "With billing records", icon: ReceiptText },
        { label: "Issued", value: data.summary.issued, helper: "Sent beyond draft", icon: FileCheck2 },
        { label: "Unpaid", value: data.summary.unpaid, helper: "With a balance due", icon: CreditCard },
        { label: "Outstanding", value: money(data.summary.outstanding, currency), helper: "Total balance due", icon: WalletCards },
      ]}
      title="Invoices"
    >
      <div className="min-w-0 overflow-x-auto">
        <Table className="min-w-[960px]">
          <TableHeader><TableRow><TableHead>Engagement</TableHead><TableHead>Client</TableHead><TableHead>Service</TableHead><TableHead>Invoice</TableHead><TableHead>Payment</TableHead><TableHead>Balance due</TableHead><TableHead>Due</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>{data.records.length ? data.records.map((record) => (
            <TableRow key={record.workflowId}>
              <TableCell className="font-semibold text-foreground">{record.reference}</TableCell>
              <TableCell><p className="font-medium text-foreground">{record.clientName}</p><p className="mt-1 text-xs text-muted-foreground">{record.clientEmail}</p></TableCell>
              <TableCell><p className="max-w-56 truncate">{record.serviceName}</p></TableCell>
              <TableCell><Badge tone={statusTone(record.invoiceStatus)}>{record.invoiceStatus.replaceAll("_", " ")}</Badge></TableCell>
              <TableCell><Badge tone={statusTone(record.paymentStatus)}>{record.paymentStatus.replaceAll("_", " ")}</Badge></TableCell>
              <TableCell className="font-semibold text-foreground">{money(record.balanceDue, record.currency)}</TableCell>
              <TableCell>{dateLabel(record.dueDate)}</TableCell>
              <TableCell className="text-right"><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/admin/active-engagements/${record.workflowId}?tab=overview`}><ExternalLink aria-hidden="true" className="h-4 w-4" />Open</Link></TableCell>
            </TableRow>
          )) : <EmptyRows colSpan={8} label="No invoice records are available yet." />}</TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}

export function AdminPaymentsRegister({ data }: { data: { records: AdminPaymentRecord[]; summary: { total: number; pending: number; verified: number; received: number } } }) {
  const currency = data.records[0]?.currency ?? "KES";
  return (
    <AdminPageSurface
      description="Review payment submissions, transaction references, and the engagement each payment belongs to."
      icon={CreditCard}
      summary={[
        { label: "Payments", value: data.summary.total, helper: "Submitted records", icon: CreditCard },
        { label: "Need review", value: data.summary.pending, helper: "Waiting for verification", icon: WalletCards },
        { label: "Verified", value: data.summary.verified, helper: "Confirmed payments", icon: FileCheck2 },
        { label: "Received", value: money(data.summary.received, currency), helper: "Excluding rejected records", icon: ReceiptText },
      ]}
      title="Payments"
    >
      <div className="min-w-0 overflow-x-auto">
        <Table className="min-w-[920px]">
          <TableHeader><TableRow><TableHead>Transaction</TableHead><TableHead>Client</TableHead><TableHead>Engagement</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>{data.records.length ? data.records.map((record) => (
            <TableRow key={record.id}>
              <TableCell><p className="font-semibold text-foreground">{record.transactionReference}</p>{record.reviewNote ? <p className="mt-1 max-w-56 truncate text-xs text-muted-foreground">{record.reviewNote}</p> : null}</TableCell>
              <TableCell><p className="font-medium text-foreground">{record.clientName}</p><p className="mt-1 text-xs text-muted-foreground">{record.clientEmail}</p></TableCell>
              <TableCell>{record.engagementReference}</TableCell>
              <TableCell className="font-semibold text-foreground">{money(record.amount, record.currency)}</TableCell>
              <TableCell className="capitalize">{record.method.replaceAll("_", " ")}</TableCell>
              <TableCell><Badge tone={statusTone(record.status)}>{record.status}</Badge></TableCell>
              <TableCell>{dateLabel(record.submittedAt)}</TableCell>
              <TableCell className="text-right"><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/admin/active-engagements/${record.workflowId}?tab=overview`}><ExternalLink aria-hidden="true" className="h-4 w-4" />Open</Link></TableCell>
            </TableRow>
          )) : <EmptyRows colSpan={8} label="No client payments have been submitted yet." />}</TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}
