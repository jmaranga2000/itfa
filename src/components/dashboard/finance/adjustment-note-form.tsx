import Link from "next/link";
import { ArrowLeft, FileMinus2, ShieldAlert } from "lucide-react";
import { createAdjustmentNoteAction } from "@/features/etims/actions";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { FiscalInvoiceRecord } from "@/repositories/fiscal-invoice-repository";
import { fiscalMoney } from "@/components/dashboard/finance/fiscal-invoice-register";

export function AdjustmentNoteForm({ invoice }: { invoice: FiscalInvoiceRecord }) {
  return (
    <div className="grid max-w-5xl gap-5">
      <Link className={buttonClassName({ variant: "secondary", size: "sm", className: "w-fit" })} href={`/admin/invoices/${invoice.id}`}>
        <ArrowLeft className="h-4 w-4" />Back to invoice
      </Link>
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-primary"><FileMinus2 className="h-5 w-5" /></span>
            <div><CardTitle>Create an adjustment note</CardTitle><CardDescription>Correct or increase an accepted KRA eTIMS invoice. Only one accepted adjustment is allowed.</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 p-5">
          <div className="flex flex-col justify-between gap-3 rounded-md border border-border bg-muted/20 p-4 sm:flex-row sm:items-center">
            <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{invoice.invoiceNumber}</p><Badge tone="green">KRA accepted</Badge></div><p className="mt-1 text-sm text-muted-foreground">{invoice.clientName} · {invoice.engagementReference}</p></div>
            <p className="text-xl font-bold text-foreground">{fiscalMoney(invoice.netAmount, invoice.currency)}</p>
          </div>
          <div className="flex gap-3 rounded-md border border-warning/30 bg-warning-soft p-4 text-sm text-foreground">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <p>After you save the draft, a second confirmation requires your password and the exact confirmation phrase. Debit notes cannot enter production until the approved KRA or integrator mapping is recorded.</p>
          </div>
          <form action={createAdjustmentNoteAction} className="grid gap-6">
            <input name="originalInvoiceId" type="hidden" value={invoice.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label htmlFor="note-type">Adjustment type</Label><Select className="mt-2" defaultValue="CREDIT_NOTE" id="note-type" name="type"><option value="CREDIT_NOTE">Credit note · reduce the invoice</option><option value="DEBIT_NOTE">Debit note · increase the invoice</option></Select></div>
              <div><Label htmlFor="reason-code">Reason</Label><Select className="mt-2" defaultValue="PRICE_CORRECTION" id="reason-code" name="reasonCode"><option value="PRICE_CORRECTION">Price correction</option><option value="SERVICE_CHANGE">Service changed</option><option value="QUANTITY_CORRECTION">Quantity correction</option><option value="CANCELLATION">Service cancelled</option><option value="OTHER">Other documented reason</option></Select></div>
              <div className="md:col-span-2"><Label htmlFor="reason-description">Client-facing explanation</Label><Textarea className="mt-2" id="reason-description" maxLength={500} name="reasonDescription" placeholder="Explain clearly why this adjustment is being made" required /></div>
              <div className="md:col-span-2"><Label htmlFor="internal-explanation">Internal approval note</Label><Textarea className="mt-2" id="internal-explanation" maxLength={1000} name="internalExplanation" placeholder="Record the business evidence and approval context" required /></div>
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Amounts to adjust</h2>
              <p className="mt-1 text-sm text-muted-foreground">Enter the quantity and unit price affected on each line. Leave both as zero for lines that do not change.</p>
              <div className="mt-4 grid gap-3">
                {invoice.lines.map((line) => (
                  <div className="grid gap-3 rounded-md border border-border p-4 md:grid-cols-[minmax(0,1fr)_150px_180px]" key={line.lineId}>
                    <div><p className="font-semibold text-foreground">{line.description}</p><p className="mt-1 text-xs text-muted-foreground">Original: {line.quantity} × {fiscalMoney(line.unitPrice, invoice.currency)} · Tax {line.taxRate}%</p></div>
                    <div><Label htmlFor={`quantity-${line.lineId}`}>Quantity</Label><Input defaultValue="0" id={`quantity-${line.lineId}`} min="0" name="quantity" step="0.01" type="number" /><input name="lineId" type="hidden" value={line.lineId} /></div>
                    <div><Label htmlFor={`price-${line.lineId}`}>Unit price</Label><Input defaultValue={line.unitPrice} id={`price-${line.lineId}`} min="0" name="unitPrice" step="0.01" type="number" /></div>
                  </div>
                ))}
              </div>
            </div>
            <SubmitButton className="w-full sm:w-fit" pendingText="Saving adjustment draft...">Save adjustment draft</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
