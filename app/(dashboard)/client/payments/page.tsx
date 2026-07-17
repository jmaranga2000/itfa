import { ClientPayments } from "@/components/dashboard/client/client-payments";
import { requireUser } from "@/features/auth/server";
import { getClientPayments } from "@/repositories/client-portal-repository";

export default async function ClientPaymentsPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const principal = await requireUser();
  const [query, data] = await Promise.all([searchParams, getClientPayments(principal)]);
  return <ClientPayments invoices={data.invoices} payments={data.payments} notice={query.submitted ? "Your payment was submitted to finance for verification." : undefined} />;
}
