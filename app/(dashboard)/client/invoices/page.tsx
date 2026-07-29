import { ClientInvoices } from "@/components/dashboard/client/client-invoices";
import { requireUser } from "@/features/auth/server";
import { listFiscalInvoices } from "@/repositories/fiscal-invoice-repository";

export default async function ClientInvoicesPage() {
  const principal = await requireUser();
  return <ClientInvoices invoices={await listFiscalInvoices(principal)} />;
}