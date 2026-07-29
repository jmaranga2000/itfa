import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, ShieldAlert, XCircle } from "lucide-react";
import {
  cancelAdjustmentNoteAction,
  confirmAdjustmentNoteAction,
} from "@/features/etims/actions";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AdjustmentNoteRecord } from "@/repositories/adjustment-note-repository";
import { fiscalMoney, fiscalStatus, fiscalTone } from "@/components/dashboard/finance/fiscal-invoice-register";

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-border py-3 last:border-0"><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium text-foreground">{value || "Not recorded"}</dd></div>;
}

export function AdjustmentNoteDetail({
  note,
  canConfirm,
  query,
}: {
  note: AdjustmentNoteRecord;
  canConfirm: boolean;
  query: { saved?: string; error?: string };
}) {
  const phrase = note.type === "CREDIT_NOTE" ? "ISSUE CREDIT NOTE" : "ISSUE DEBIT NOTE";
  return (
    <div className="grid min-w-0 gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Link className={buttonClassName({ variant: "secondary", size: "sm", className: "w-fit" })} href={`/admin/invoices/${note.originalInvoiceId}`}>
          <ArrowLeft className="h-4 w-4" />Back to invoice
        </Link>
        {note.finalPdfAvailable ? <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/finance/adjustments/${note.id}/pdf`}><Download className="h-4 w-4" />Download PDF</Link> : null}
      </div>
      {query.saved ? <p className="rounded-md border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">Adjustment note updated successfully.</p> : null}
      {query.error ? <p className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">The action could not be completed. Check your password, confirmation phrase, note status, and production mapping.</p> : null}
      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 border-b border-border md:flex-row md:items-start">
          <div><div className="flex flex-wrap gap-2"><Badge tone="teal">{note.type === "CREDIT_NOTE" ? "Credit note" : "Debit note"}</Badge><Badge tone={fiscalTone(note.status)}>{fiscalStatus(note.status)}</Badge></div><CardTitle className="mt-3">{note.noteNumber}</CardTitle><CardDescription>Adjustment to {note.originalInternalInvoiceNumber} for {note.clientName}</CardDescription></div>
          <p className="text-2xl font-bold text-foreground">{fiscalMoney(note.totalAmount, note.currency)}</p>
        </CardHeader>
        <CardContent className="grid gap-6 p-5 lg:grid-cols-2">
          <dl><Detail label="Client" value={`${note.clientName} · ${note.clientEmail}`} /><Detail label="Engagement" value={note.engagementReference} /><Detail label="Reason code" value={note.reasonCode} /><Detail label="Client explanation" value={note.reasonDescription} /><Detail label="Internal explanation" value={note.internalExplanation} /></dl>
          <dl><Detail label="Original KRA reference" value={note.originalEtimsInvoiceNumber} /><Detail label="Created by" value={note.createdByAdminName} /><Detail label="Confirmed by" value={note.confirmedByAdminName} /><Detail label="KRA status" value={note.etimsStatus} /><Detail label="KRA note reference" value={note.kraReference} /><Detail label="KRA response" value={[note.responseCode, note.responseMessage].filter(Boolean).join(" · ")} /></dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Adjusted lines</CardTitle><CardDescription>Values included in this adjustment note.</CardDescription></CardHeader>
        <CardContent>
          <div className="min-w-0 overflow-x-auto">
            <Table className="min-w-[720px]"><TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Quantity</TableHead><TableHead>Unit price</TableHead><TableHead>Tax</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{note.lines.map((line) => <TableRow key={line.lineId}><TableCell className="font-medium text-foreground">{line.description}</TableCell><TableCell>{line.adjustmentQuantity}</TableCell><TableCell>{fiscalMoney(line.adjustmentUnitPrice, note.currency)}</TableCell><TableCell>{line.taxTypeCode} · {line.taxRate}%</TableCell><TableCell className="text-right font-semibold">{fiscalMoney(line.totalAmount, note.currency)}</TableCell></TableRow>)}</TableBody></Table>
          </div>
          <dl className="ml-auto mt-5 grid max-w-sm gap-2 text-sm"><div className="flex justify-between"><dt>Adjustment</dt><dd>{fiscalMoney(note.totalAmount, note.currency)}</dd></div><div className="flex justify-between"><dt>Original invoice</dt><dd>{fiscalMoney(note.originalInvoiceTotal, note.currency)}</dd></div><div className="flex justify-between border-t border-border pt-3 font-bold"><dt>Revised invoice position</dt><dd>{fiscalMoney(note.adjustedInvoiceNetTotal, note.currency)}</dd></div></dl>
        </CardContent>
      </Card>
      {note.status === "DRAFT" && canConfirm ? (
        <Card>
          <CardHeader><CardTitle>Confirm fiscal submission</CardTitle><CardDescription>This is a high-impact Admin action. The note becomes immutable and enters the eTIMS queue.</CardDescription></CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <form action={confirmAdjustmentNoteAction} className="grid gap-4 rounded-md border border-warning/30 p-4">
              <input name="noteId" type="hidden" value={note.id} />
              <ShieldAlert className="h-5 w-5 text-warning" />
              <div><Label htmlFor="adjustment-password">Your current password</Label><PasswordInput autoComplete="current-password" className="mt-2" id="adjustment-password" name="password" required /></div>
              <div><Label htmlFor="confirmation-phrase">Type {phrase}</Label><Input autoComplete="off" className="mt-2" id="confirmation-phrase" name="confirmationPhrase" required /></div>
              <SubmitButton pendingText="Confirming and queuing..."><CheckCircle2 className="h-4 w-4" />Confirm and queue</SubmitButton>
            </form>
            <form action={cancelAdjustmentNoteAction} className="grid content-start gap-4 rounded-md border border-danger/30 p-4">
              <input name="noteId" type="hidden" value={note.id} />
              <XCircle className="h-5 w-5 text-danger" />
              <div><Label htmlFor="cancel-reason">Cancel draft and release invoice</Label><Textarea className="mt-2" id="cancel-reason" name="reason" placeholder="Record why this adjustment is being cancelled" required /></div>
              <SubmitButton pendingText="Cancelling..." variant="destructive">Cancel adjustment draft</SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
