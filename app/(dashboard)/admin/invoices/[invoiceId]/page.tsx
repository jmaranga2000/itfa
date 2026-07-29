import { redirect } from "next/navigation";
import { FiscalInvoiceDetail } from "@/components/dashboard/finance/fiscal-invoice-detail";
import { hasPermission } from "@/features/authorization/access-control";
import { requireUser } from "@/features/auth/server";
import { listAdjustmentNotes } from "@/repositories/adjustment-note-repository";
import { getFiscalOperationForAggregate } from "@/repositories/etims-operations-repository";
import { getFiscalInvoice } from "@/repositories/fiscal-invoice-repository";

export default async function AdminFiscalInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [principal, { invoiceId }, query] = await Promise.all([
    requireUser(),
    params,
    searchParams,
  ]);
  const invoice = await getFiscalInvoice(principal, invoiceId);
  if (!invoice) redirect("/access-blocked");
  const [notes, operation] = await Promise.all([
    listAdjustmentNotes(principal, invoice.id),
    hasPermission(principal, "etims.transaction.read")
      ? getFiscalOperationForAggregate(principal, invoice.id)
      : Promise.resolve(null),
  ]);
  return (
    <FiscalInvoiceDetail
      canAdjust={hasPermission(principal, "adjustment_note.create")}
      canApprove={hasPermission(principal, "invoice.approve")}
      invoice={invoice}
      notes={notes}
      operation={operation}
      query={query}
    />
  );
}
