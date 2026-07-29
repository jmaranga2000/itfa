import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileClock,
  ReceiptText,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FiscalInvoiceRecord } from "@/repositories/fiscal-invoice-repository";

export function fiscalMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fiscalStatus(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_ADMIN_APPROVAL: "Needs Admin approval",
    RETURNED_FOR_CORRECTION: "Needs correction",
    ADMIN_REJECTED: "Rejected internally",
    ETIMS_QUEUED: "Queued for KRA",
    ETIMS_SUBMITTING: "Sending to KRA",
    ETIMS_ACCEPTED: "Accepted by KRA",
    ETIMS_REJECTED: "Rejected by KRA",
    ETIMS_RETRY_REQUIRED: "Retry required",
    ETIMS_RECONCILIATION_REQUIRED: "Check KRA status",
    DELIVERY_QUEUED: "Preparing client copy",
    PARTIALLY_DELIVERED: "Delivery needs attention",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return labels[status] ?? status.replaceAll("_", " ").toLowerCase();
}

export function fiscalTone(status: string) {
  if (["DELIVERED", "ETIMS_ACCEPTED"].includes(status)) return "green" as const;
  if (["ETIMS_REJECTED", "ADMIN_REJECTED", "CANCELLED"].includes(status)) return "red" as const;
  if (["ETIMS_RETRY_REQUIRED", "ETIMS_RECONCILIATION_REQUIRED", "PARTIALLY_DELIVERED", "RETURNED_FOR_CORRECTION"].includes(status)) {
    return "gold" as const;
  }
  return "teal" as const;
}

function dateLabel(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
    : "Not recorded";
}

export function FiscalInvoiceRegister({ invoices, portal = "admin" }: { invoices: FiscalInvoiceRecord[]; portal?: "admin" | "staff" }) {
  const admin = portal === "admin";
  const detailBase = admin ? "/admin/invoices" : "/staff/invoices";
  const accepted = invoices.filter((invoice) => invoice.etims.status === "ACCEPTED").length;
  const approval = invoices.filter((invoice) => invoice.status === "PENDING_ADMIN_APPROVAL").length;
  const attention = invoices.filter((invoice) =>
    ["ETIMS_REJECTED", "ETIMS_RETRY_REQUIRED", "ETIMS_RECONCILIATION_REQUIRED", "PARTIALLY_DELIVERED"].includes(invoice.status)).length;
  const gross = invoices.reduce((total, invoice) => total + invoice.totalAmount, 0);
  const currency = invoices[0]?.currency ?? "KES";

  return (
    <AdminPageSurface
      actions={admin ? (
        <>
          <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/finance/etims">
            <ShieldCheck className="h-4 w-4" />eTIMS activity
          </Link>
          <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/finance/etims/configuration">
            <Settings2 className="h-4 w-4" />Setup
          </Link>
        </>
      ) : undefined}
      description={admin ? "Approve invoices, follow KRA acceptance, and see whether each accepted document reached the client." : "Prepare assigned invoices and follow Admin approval, KRA acceptance, and client delivery."}
      icon={ReceiptText}
      summary={[
        { label: "All invoices", value: invoices.length, helper: fiscalMoney(gross, currency), icon: ReceiptText },
        { label: "Need approval", value: approval, helper: "Waiting for Admin", icon: FileClock },
        { label: "KRA accepted", value: accepted, helper: "Fiscal documents", icon: CheckCircle2 },
        { label: "Need attention", value: attention, helper: "Review or retry", icon: AlertTriangle },
      ]}
      title="Fiscal invoices"
    >
      {invoices.length === 0 ? (
        <EmptyState
          description="Invoices created by Finance will appear here for approval."
          title="No fiscal invoices yet"
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {invoices.map((invoice) => (
              <Card className="shadow-none" key={invoice.id}>
                <CardContent className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{invoice.invoiceNumber}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{invoice.clientName}</p>
                    </div>
                    <Badge tone={fiscalTone(invoice.status)}>{fiscalStatus(invoice.status)}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Engagement</p><p className="mt-1 font-medium">{invoice.engagementReference}</p></div>
                    <div><p className="text-xs text-muted-foreground">Total</p><p className="mt-1 font-semibold">{fiscalMoney(invoice.totalAmount, invoice.currency)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Due</p><p className="mt-1">{dateLabel(invoice.dueDate)}</p></div>
                    <div><p className="text-xs text-muted-foreground">KRA reference</p><p className="mt-1 truncate">{invoice.etims.kraInvoiceNumber || "Not assigned"}</p></div>
                  </div>
                  <Link className={buttonClassName({ variant: "secondary", size: "sm", className: "w-full" })} href={`${detailBase}/${invoice.id}`}>
                    Open invoice<ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="hidden min-w-0 overflow-x-auto md:block">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>KRA reference</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell><p className="font-semibold text-foreground">{invoice.invoiceNumber}</p><p className="mt-1 text-xs text-muted-foreground">{invoice.serviceName}</p></TableCell>
                    <TableCell><p className="font-medium text-foreground">{invoice.clientName}</p><p className="mt-1 text-xs text-muted-foreground">{invoice.clientEmail}</p></TableCell>
                    <TableCell>{invoice.engagementReference}</TableCell>
                    <TableCell><Badge tone={fiscalTone(invoice.status)}>{fiscalStatus(invoice.status)}</Badge></TableCell>
                    <TableCell>{invoice.etims.kraInvoiceNumber || "Not assigned"}</TableCell>
                    <TableCell className="font-semibold text-foreground">{fiscalMoney(invoice.totalAmount, invoice.currency)}</TableCell>
                    <TableCell>{dateLabel(invoice.dueDate)}</TableCell>
                    <TableCell className="text-right">
                      <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`${detailBase}/${invoice.id}`}>
                        Open<ArrowRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </AdminPageSurface>
  );
}
