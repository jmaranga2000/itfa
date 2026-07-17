import { notFound } from "next/navigation";
import { QuotationRequestStatus } from "@/components/dashboard/quotations/quotation-snapshot";
import { requireUser } from "@/features/auth/server";
import { getClientQuotationRequest } from "@/repositories/quotation-repository";

export default async function ClientQuotationRequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const [principal, { requestId }] = await Promise.all([requireUser(), params]);
  const data = await getClientQuotationRequest(principal.id, requestId);
  if (!data) notFound();
  return <QuotationRequestStatus {...data} />;
}
