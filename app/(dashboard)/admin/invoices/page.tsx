import { FiscalInvoiceRegister } from "@/components/dashboard/finance/fiscal-invoice-register";
import { requireUser } from "@/features/auth/server";
import { listFiscalInvoices } from "@/repositories/fiscal-invoice-repository";

export default async function AdminInvoicesPage() {
  const principal = await requireUser();
  return <FiscalInvoiceRegister invoices={await listFiscalInvoices(principal)} />;
}