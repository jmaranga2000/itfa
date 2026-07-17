import { notFound } from "next/navigation";
import { QuotationSnapshot } from "@/components/dashboard/quotations/quotation-snapshot";
import { requireUser } from "@/features/auth/server";
import { getClientQuotation } from "@/repositories/quotation-repository";

export default async function ClientQuotationPage({ params, searchParams }: { params: Promise<{ quotationId: string }>; searchParams: Promise<{ accepted?: string }> }) {
  const [principal, { quotationId }, query] = await Promise.all([requireUser(), params, searchParams]);
  const quotation = await getClientQuotation(principal.id, quotationId);
  if (!quotation) notFound();
  return <QuotationSnapshot accepted={Boolean(query.accepted)} quotation={quotation} />;
}
