import Link from "next/link";
import { ArrowRight, FileText, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ClientInvoiceRecord } from "@/repositories/client-portal-repository";

function money(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function tone(status: string) {
  if (status === "paid") return "green" as const;
  if (["overdue", "partially_paid"].includes(status)) return "gold" as const;
  return "teal" as const;
}

export function ClientInvoices({ invoices }: { invoices: ClientInvoiceRecord[] }) {
  const due = invoices.reduce((total, invoice) => total + invoice.balanceDue, 0);
  return (
    <div className="grid min-w-0 gap-5">
      <section className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-center"><div><Badge tone="teal">Billing</Badge><h1 className="mt-3 text-2xl font-bold text-foreground">Invoices</h1><p className="mt-2 text-sm text-muted-foreground">Review invoice status and balances from your active engagements.</p></div><div className="text-left md:text-right"><p className="text-xs font-semibold text-muted-foreground">Total balance</p><p className="mt-1 text-2xl font-bold text-foreground">{money(due, invoices[0]?.currency ?? "KES")}</p></div></section>
      <Card><CardHeader><CardTitle>Engagement invoices</CardTitle><CardDescription>{invoices.length} invoice record{invoices.length === 1 ? "" : "s"}</CardDescription></CardHeader><CardContent className="grid gap-2">{invoices.length === 0 ? <EmptyState title="No invoices yet" description="Invoices will appear here when an engagement reaches billing." /> : invoices.map((invoice) => <div className="flex flex-col justify-between gap-3 border-t border-border py-4 first:border-0 first:pt-0 md:flex-row md:items-center" key={invoice.workflowId}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{invoice.serviceName}</p><Badge tone={tone(invoice.status)}>{invoice.status.replaceAll("_", " ")}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{invoice.reference}{invoice.dueDate ? ` | Due ${new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(invoice.dueDate))}` : ""}</p></div><div className="flex flex-wrap items-center gap-3"><p className="font-bold text-foreground">{money(invoice.balanceDue, invoice.currency)}</p><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/client/invoices/${invoice.workflowId}`}><FileText className="h-4 w-4" />View invoice</Link></div></div>)}</CardContent></Card>
      <div className="flex justify-end"><Link className={buttonClassName()} href="/client/payments"><ReceiptText className="h-4 w-4" />Payment history<ArrowRight className="h-4 w-4" /></Link></div>
    </div>
  );
}

export { money };
