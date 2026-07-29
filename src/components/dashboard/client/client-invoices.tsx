import Link from "next/link";
import { ArrowRight, FileText, ReceiptText } from "lucide-react";
import { fiscalMoney, fiscalStatus, fiscalTone } from "@/components/dashboard/finance/fiscal-invoice-register";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { FiscalInvoiceRecord } from "@/repositories/fiscal-invoice-repository";

export function ClientInvoices({ invoices }: { invoices: FiscalInvoiceRecord[] }) {
  const due = invoices.reduce((total, invoice) => total + invoice.balanceDue, 0);
  return (
    <div className="grid min-w-0 gap-5">
      <section className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-center"><div><Badge tone="teal">Billing</Badge><h1 className="mt-3 text-2xl font-bold text-foreground">Invoices</h1><p className="mt-2 text-sm text-muted-foreground">KRA-accepted fiscal invoices and adjustments for your engagements.</p></div><div className="text-left md:text-right"><p className="text-xs font-semibold text-muted-foreground">Current balance</p><p className="mt-1 text-2xl font-bold text-foreground">{fiscalMoney(due, invoices[0]?.currency ?? "KES")}</p></div></section>
      <Card><CardHeader><CardTitle>Your fiscal invoices</CardTitle><CardDescription>{invoices.length} accepted invoice{invoices.length === 1 ? "" : "s"}</CardDescription></CardHeader><CardContent className="grid gap-2">{invoices.length === 0 ? <EmptyState title="No invoices yet" description="An invoice appears here only after KRA eTIMS accepts it and your portal copy is ready." /> : invoices.map((invoice) => <div className="flex flex-col justify-between gap-3 border-t border-border py-4 first:border-0 first:pt-0 md:flex-row md:items-center" key={invoice.id}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{invoice.serviceName}</p><Badge tone={fiscalTone(invoice.status)}>{fiscalStatus(invoice.status)}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{invoice.invoiceNumber} · {invoice.engagementReference}</p><p className="mt-1 text-xs text-muted-foreground">KRA reference: {invoice.etims.kraInvoiceNumber}</p></div><div className="flex flex-wrap items-center gap-3"><p className="font-bold text-foreground">{fiscalMoney(invoice.netAmount, invoice.currency)}</p><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/client/invoices/${invoice.workflowId}`}><FileText className="h-4 w-4" />View invoice</Link></div></div>)}</CardContent></Card>
      <div className="flex justify-end"><Link className={buttonClassName()} href="/client/payments"><ReceiptText className="h-4 w-4" />Payment history<ArrowRight className="h-4 w-4" /></Link></div>
    </div>
  );
}

export const money = fiscalMoney;