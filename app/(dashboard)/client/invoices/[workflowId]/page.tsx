import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CreditCard, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { money } from "@/components/dashboard/client/client-invoices";
import { requireUser } from "@/features/auth/server";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

export default async function ClientInvoiceDetailPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const [principal, { workflowId }] = await Promise.all([requireUser(), params]);
  const workflow = await getWorkflowForPrincipal(principal, workflowId);
  if (!workflow || workflow.clientUserId !== principal.id) notFound();
  const canPay = workflow.financial.balanceDue > 0 && ["approved", "issued", "partially_paid", "overdue"].includes(workflow.financial.invoiceStatus);

  return <div className="grid max-w-4xl gap-5"><Link className={buttonClassName({ variant: "secondary", size: "sm", className: "w-fit" })} href="/client/invoices"><ArrowLeft className="h-4 w-4" />Invoices</Link><Card><CardHeader className="flex flex-col justify-between gap-4 border-b border-border md:flex-row md:items-start"><div><div className="flex flex-wrap items-center gap-2"><Badge tone="teal">{workflow.reference}</Badge><Badge tone={workflow.financial.invoiceStatus === "paid" ? "green" : "gold"}>{workflow.financial.invoiceStatus.replaceAll("_", " ")}</Badge></div><CardTitle className="mt-3">Invoice for {workflow.serviceName}</CardTitle><CardDescription>Billing record connected to your engagement.</CardDescription></div><FileText className="h-8 w-8 text-primary" /></CardHeader><CardContent className="grid gap-5 p-5"><dl className="grid gap-0 overflow-hidden rounded-md border border-border sm:grid-cols-2"><div className="border-b border-border p-4 sm:border-r"><dt className="text-xs font-semibold text-muted-foreground">Client</dt><dd className="mt-1 font-semibold text-foreground">{workflow.clientName}</dd></div><div className="border-b border-border p-4"><dt className="text-xs font-semibold text-muted-foreground">Engagement</dt><dd className="mt-1 font-semibold text-foreground">{workflow.reference}</dd></div><div className="p-4 sm:border-r"><dt className="text-xs font-semibold text-muted-foreground">Payment status</dt><dd className="mt-1 font-semibold capitalize text-foreground">{workflow.financial.paymentStatus.replaceAll("_", " ")}</dd></div><div className="p-4"><dt className="text-xs font-semibold text-muted-foreground">Balance due</dt><dd className="mt-1 text-xl font-bold text-foreground">{money(workflow.financial.balanceDue, workflow.financial.currency)}</dd></div></dl>{canPay ? <Link className={buttonClassName({ className: "w-fit" })} href="/client/payments/new"><CreditCard className="h-4 w-4" />Submit payment details</Link> : <p className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">{workflow.financial.invoiceStatus === "paid" ? "This invoice is fully paid." : "Finance is preparing this invoice. Payment submission will open once it is issued."}</p>}</CardContent></Card></div>;
}
