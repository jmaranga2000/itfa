import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileWarning,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  approveFiscalInvoiceAction,
  rejectFiscalInvoiceAction,
  returnFiscalInvoiceAction,
  saveAndSubmitFiscalInvoiceAction,
  retryFinanceDeliveryAction,
  retryEtimsTransactionAction,
  reconcileEtimsTransactionAction,
} from "@/features/etims/actions";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AdjustmentNoteRecord } from "@/repositories/adjustment-note-repository";
import type { EtimsOperationRecord } from "@/repositories/etims-operations-repository";
import type { FiscalInvoiceRecord } from "@/repositories/fiscal-invoice-repository";
import { fiscalMoney, fiscalStatus, fiscalTone } from "@/components/dashboard/finance/fiscal-invoice-register";

function dateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "Not recorded";
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-border py-3 last:border-0"><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium text-foreground">{value || "Not recorded"}</dd></div>;
}

export function FiscalInvoiceDetail({
  invoice,
  notes,
  operation,
  canApprove,
  canAdjust,
  canEdit = false,
  query,
  portal = "admin",
}: {
  invoice: FiscalInvoiceRecord;
  notes: AdjustmentNoteRecord[];
  operation: EtimsOperationRecord | null;
  canApprove: boolean;
  canAdjust: boolean;
  canEdit?: boolean;
  query: { saved?: string; error?: string };
  portal?: "admin" | "staff";
}) {
  const admin = portal === "admin";
  const backHref = admin ? "/admin/invoices" : "/staff/invoices";
  const engagementHref = admin ? `/admin/active-engagements/${invoice.workflowId}?tab=finance` : `/staff/engagements/${invoice.workflowId}?tab=finance`;
  const pendingApproval = invoice.status === "PENDING_ADMIN_APPROVAL";
  const editable = canEdit && ["DRAFT", "RETURNED_FOR_CORRECTION"].includes(invoice.status);
  const canCreateAdjustment = canAdjust
    && invoice.etims.status === "ACCEPTED"
    && invoice.adjustmentStatus === "NONE";
  return (
    <div className="grid min-w-0 gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Link className={buttonClassName({ variant: "secondary", size: "sm", className: "w-fit" })} href={backHref}>
          <ArrowLeft className="h-4 w-4" />Back to invoices
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={engagementHref}>
            <ExternalLink className="h-4 w-4" />Open engagement
          </Link>
          {invoice.finalPdfAvailable ? (
            <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/finance/invoices/${invoice.id}/pdf`}>
              <Download className="h-4 w-4" />Download PDF
            </Link>
          ) : null}
          {canCreateAdjustment ? (
            <Link className={buttonClassName({ size: "sm" })} href={`/admin/invoices/${invoice.id}/adjustments/new`}>
              Create credit or debit note
            </Link>
          ) : null}
        </div>
      </div>

      {query.saved ? <p className="rounded-md border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">The fiscal record was updated successfully.</p> : null}
      {query.error ? <p className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">The action could not be completed. Review the invoice status, eTIMS setup, service mapping, and your approval role.</p> : null}

      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 border-b border-border md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="teal">{invoice.invoiceNumber}</Badge>
              <Badge tone={fiscalTone(invoice.status)}>{fiscalStatus(invoice.status)}</Badge>
            </div>
            <CardTitle className="mt-3">{invoice.clientName}</CardTitle>
            <CardDescription>{invoice.serviceName} · {invoice.engagementReference}</CardDescription>
          </div>
          <p className="text-2xl font-bold text-foreground">{fiscalMoney(invoice.totalAmount, invoice.currency)}</p>
        </CardHeader>
        <CardContent className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <dl className="grid min-w-0 gap-x-6 sm:grid-cols-2">
            <Detail label="Client email" value={invoice.clientEmail} />
            <Detail label="Client KRA PIN" value={invoice.clientKraPin} />
            <Detail label="Invoice date" value={dateTime(invoice.issueDate)} />
            <Detail label="Due date" value={dateTime(invoice.dueDate)} />
            <Detail label="Prepared by" value={invoice.createdByName} />
            <Detail label="Approved by" value={invoice.approvedByName} />
          </dl>
          <div className="rounded-md border border-border bg-muted/20 p-4">
            <p className="text-sm font-semibold text-foreground">Current step</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {invoice.etims.status === "ACCEPTED"
                ? "KRA accepted this fiscal document. Portal and email delivery are tracked separately."
                : pendingApproval
                  ? "Admin must review this invoice. Approval locks it permanently and queues it for KRA."
                  : fiscalStatus(invoice.status)}
            </p>
            <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
              <p>KRA request attempts: {invoice.etims.attemptCount}</p>
              <p>Portal published: {dateTime(invoice.portalPublishedAt)}</p>
              <p>Email: {invoice.emailDeliveryStatus.toLowerCase().replaceAll("_", " ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Invoice lines</CardTitle><CardDescription>Amounts and tax values locked into the fiscal document after approval.</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:hidden">
            {invoice.lines.map((line) => (
              <div className="rounded-md border border-border p-4" key={line.lineId}>
                <p className="font-semibold text-foreground">{line.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <p>Quantity: {line.quantity} {line.quantityUnitCode}</p>
                  <p>Tax: {line.taxRate}%</p>
                  <p>Before tax: {fiscalMoney(line.taxableAmount, invoice.currency)}</p>
                  <p className="font-semibold">Total: {fiscalMoney(line.totalAmount, invoice.currency)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden min-w-0 overflow-x-auto md:block">
            <Table className="min-w-[760px]">
              <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Quantity</TableHead><TableHead>Unit price</TableHead><TableHead>Tax</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>{invoice.lines.map((line) => <TableRow key={line.lineId}><TableCell className="font-medium text-foreground">{line.description}</TableCell><TableCell>{line.quantity} {line.quantityUnitCode}</TableCell><TableCell>{fiscalMoney(line.unitPrice, invoice.currency)}</TableCell><TableCell>{line.taxTypeCode || "Not mapped"} · {line.taxRate}%</TableCell><TableCell className="text-right font-semibold">{fiscalMoney(line.totalAmount, invoice.currency)}</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
          <dl className="ml-auto mt-5 grid max-w-sm gap-2 text-sm">
            <div className="flex justify-between gap-4"><dt>Subtotal</dt><dd>{fiscalMoney(invoice.subtotal, invoice.currency)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Tax</dt><dd>{fiscalMoney(invoice.taxAmount, invoice.currency)}</dd></div>
            <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-bold"><dt>Total</dt><dd>{fiscalMoney(invoice.totalAmount, invoice.currency)}</dd></div>
            {invoice.netAmount !== invoice.totalAmount ? <div className="flex justify-between gap-4 text-primary"><dt>After adjustment</dt><dd>{fiscalMoney(invoice.netAmount, invoice.currency)}</dd></div> : null}
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>KRA eTIMS response</CardTitle><CardDescription>Sanitized fiscal response. Credentials are never shown here.</CardDescription></CardHeader>
          <CardContent><dl><Detail label="Fiscal status" value={invoice.etims.status} /><Detail label="KRA invoice reference" value={invoice.etims.kraInvoiceNumber} /><Detail label="Receipt number" value={invoice.etims.receiptNumber} /><Detail label="Control unit" value={invoice.etims.controlUnitId} /><Detail label="Response" value={[invoice.etims.responseCode, invoice.etims.responseMessage].filter(Boolean).join(" · ")} /><Detail label="Accepted" value={dateTime(invoice.etims.acceptedAt)} /></dl></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Client delivery</CardTitle><CardDescription>Delivery retries never send the invoice to KRA again.</CardDescription></CardHeader>
          <CardContent><dl><Detail label="Portal" value={invoice.portalPublishedAt ? `Published ${dateTime(invoice.portalPublishedAt)}` : "Not published"} /><Detail label="Email" value={invoice.emailDeliveryStatus} /><Detail label="Recipient" value={invoice.emailedTo} /><Detail label="Delivery note" value={invoice.emailDeliveryError || "No delivery problem recorded"} /></dl></CardContent>
        </Card>
      </div>

      {editable ? (
        <Card>
          <CardHeader><CardTitle>Correct and resubmit invoice</CardTitle><CardDescription>Update quantities, prices, due date, and notes. Totals and tax are recalculated on the server from the approved service mapping.</CardDescription></CardHeader>
          <CardContent>
            {invoice.returnReason ? <p className="mb-4 rounded-md border border-warning/30 bg-warning-soft p-4 text-sm text-foreground"><strong>Admin requested:</strong> {invoice.returnReason}</p> : null}
            <form action={saveAndSubmitFiscalInvoiceAction} className="grid gap-5">
              <input name="invoiceId" type="hidden" value={invoice.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="finance-due-date">Due date</Label><Input className="mt-2" defaultValue={invoice.dueDate.slice(0, 10)} id="finance-due-date" name="dueDate" required type="date" /></div>
                <div><Label htmlFor="finance-payment-terms">Payment terms</Label><Input className="mt-2" defaultValue={invoice.paymentTerms} id="finance-payment-terms" name="paymentTerms" placeholder="For example: Due within 14 days" /></div>
              </div>
              <div className="grid gap-3">{invoice.lines.map((line) => <div className="grid gap-3 rounded-md border border-border p-4 md:grid-cols-[minmax(0,1fr)_140px_180px]" key={line.lineId}><div><p className="font-semibold text-foreground">{line.description}</p><p className="mt-1 text-xs text-muted-foreground">Tax and codes come from the service mapping.</p><input name="lineId" type="hidden" value={line.lineId} /><input name="description" type="hidden" value={line.description} /></div><div><Label htmlFor={`edit-quantity-${line.lineId}`}>Quantity</Label><Input className="mt-2" defaultValue={line.quantity} id={`edit-quantity-${line.lineId}`} min="0.01" name="quantity" step="0.01" type="number" required /></div><div><Label htmlFor={`edit-price-${line.lineId}`}>Unit price</Label><Input className="mt-2" defaultValue={line.unitPrice} id={`edit-price-${line.lineId}`} min="0" name="unitPrice" step="0.01" type="number" required /></div></div>)}</div>
              <div><Label htmlFor="finance-internal-notes">Internal notes</Label><Textarea className="mt-2" defaultValue={invoice.internalNotes} id="finance-internal-notes" name="internalNotes" /></div>
              <SubmitButton className="w-full sm:w-fit" pendingText="Saving and submitting...">Save and submit for Admin approval</SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}
      {pendingApproval && canApprove ? (
        <Card>
          <CardHeader><CardTitle>Admin decision</CardTitle><CardDescription>Approval locks the amounts and queues the invoice. It does not make the invoice visible to the client yet.</CardDescription></CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-3">
            <form action={approveFiscalInvoiceAction} className="rounded-md border border-success/30 p-4">
              <input name="invoiceId" type="hidden" value={invoice.id} />
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="mt-3 font-semibold">Approve and queue</p>
              <p className="mt-1 text-sm text-muted-foreground">Apply the server-signed stamp and send this to the eTIMS queue.</p>
              <SubmitButton className="mt-4 w-full" pendingText="Queuing...">Approve invoice</SubmitButton>
            </form>
            <form action={returnFiscalInvoiceAction} className="rounded-md border border-border p-4">
              <input name="invoiceId" type="hidden" value={invoice.id} />
              <RotateCcw className="h-5 w-5 text-primary" />
              <Label className="mt-3 block" htmlFor="return-reason">Return for correction</Label>
              <Textarea className="mt-2" id="return-reason" name="reason" placeholder="Explain what Finance must correct" required />
              <SubmitButton className="mt-3 w-full" pendingText="Returning..." variant="secondary">Return invoice</SubmitButton>
            </form>
            <form action={rejectFiscalInvoiceAction} className="rounded-md border border-danger/30 p-4">
              <input name="invoiceId" type="hidden" value={invoice.id} />
              <FileWarning className="h-5 w-5 text-danger" />
              <Label className="mt-3 block" htmlFor="reject-reason">Reject internally</Label>
              <Textarea className="mt-2" id="reject-reason" name="reason" placeholder="Record the rejection reason" required />
              <SubmitButton className="mt-3 w-full" pendingText="Rejecting..." variant="destructive">Reject invoice</SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {operation && ["RETRY_REQUIRED", "DEAD_LETTER", "RECONCILIATION_REQUIRED"].includes(operation.status) ? (
        <Card>
          <CardHeader><CardTitle>Recovery action</CardTitle><CardDescription>Use reconciliation for uncertain submissions. Retry only confirmed technical failures.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {operation.status === "RECONCILIATION_REQUIRED" ? (
              <form action={reconcileEtimsTransactionAction}>
                <input name="eventId" type="hidden" value={operation.eventId} />
                <SubmitButton className="w-full" pendingText="Checking KRA..."><ShieldCheck className="h-4 w-4" />Check KRA status</SubmitButton>
              </form>
            ) : (
              <form action={retryEtimsTransactionAction} className="grid gap-2">
                <input name="eventId" type="hidden" value={operation.eventId} />
                <Input name="reason" placeholder="Reason for manual retry" required />
                <SubmitButton pendingText="Scheduling retry..."><RotateCcw className="h-4 w-4" />Retry fiscal submission</SubmitButton>
              </form>
            )}
            {operation.delivery && ["PARTIALLY_DELIVERED", "RETRY_REQUIRED", "DEAD_LETTER"].includes(operation.delivery.status) ? (
              <form action={retryFinanceDeliveryAction} className="grid gap-2">
                <input name="jobId" type="hidden" value={operation.delivery.jobId} />
                <Input name="reason" placeholder="Reason for delivery retry" required />
                <SubmitButton pendingText="Scheduling delivery..."><RotateCcw className="h-4 w-4" />Retry client delivery</SubmitButton>
              </form>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Credit and debit notes</CardTitle><CardDescription>Only one accepted adjustment note is allowed for this invoice.</CardDescription></CardHeader>
        <CardContent className="grid gap-3">
          {notes.length ? notes.map((note) => (
            <Link className="flex flex-col justify-between gap-3 rounded-md border border-border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center" href={`/admin/finance/etims/adjustments/${note.id}`} key={note.id}>
              <div><p className="font-semibold text-foreground">{note.noteNumber}</p><p className="mt-1 text-sm text-muted-foreground">{note.reasonDescription}</p></div>
              <div className="flex items-center gap-3"><Badge tone={fiscalTone(note.status)}>{fiscalStatus(note.status)}</Badge><span className="font-semibold">{fiscalMoney(note.totalAmount, note.currency)}</span></div>
            </Link>
          )) : <p className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">No credit or debit note has been created for this invoice.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
