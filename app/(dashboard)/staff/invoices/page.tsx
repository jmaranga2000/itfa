import { FiscalInvoiceRegister } from "@/components/dashboard/finance/fiscal-invoice-register";
import { requireStaffRoute } from "@/features/staff/server";
import { listFiscalInvoices } from "@/repositories/fiscal-invoice-repository";

export default async function StaffInvoicesPage() {
  const { principal } = await requireStaffRoute("invoices");
  return <FiscalInvoiceRegister invoices={await listFiscalInvoices(principal)} portal="staff" />;
}