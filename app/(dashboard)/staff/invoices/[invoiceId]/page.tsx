import { redirect } from "next/navigation";
import { FiscalInvoiceDetail } from "@/components/dashboard/finance/fiscal-invoice-detail";
import { hasPermission } from "@/features/authorization/access-control";
import { requireStaffRoute } from "@/features/staff/server";
import { listAdjustmentNotes } from "@/repositories/adjustment-note-repository";
import { getFiscalInvoice } from "@/repositories/fiscal-invoice-repository";

export default async function StaffFiscalInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ principal }, { invoiceId }, query] = await Promise.all([
    requireStaffRoute("invoices"),
    params,
    searchParams,
  ]);
  const invoice = await getFiscalInvoice(principal, invoiceId);
  if (!invoice) redirect("/access-blocked");
  return (
    <FiscalInvoiceDetail
      canAdjust={false}
      canApprove={false}
      canEdit={hasPermission(principal, "invoice.edit")}
      invoice={invoice}
      notes={await listAdjustmentNotes(principal, invoice.id)}
      operation={null}
      portal="staff"
      query={query}
    />
  );
}
