import { ClientInvoices } from "@/components/dashboard/client/client-invoices";
import { requireUser } from "@/features/auth/server";
import { getClientInvoices } from "@/repositories/client-portal-repository";

export default async function ClientInvoicesPage() {
  const principal = await requireUser();
  return <ClientInvoices invoices={await getClientInvoices(principal)} />;
}
