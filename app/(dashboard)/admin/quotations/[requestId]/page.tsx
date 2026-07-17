import { notFound } from "next/navigation";
import { QuotationEditor } from "@/components/dashboard/quotations/quotation-manager";
import { requirePermission } from "@/features/auth/server";
import { getQuotationEditorData } from "@/repositories/quotation-repository";

export default async function AdminQuotationEditorPage({ params, searchParams }: { params: Promise<{ requestId: string }>; searchParams: Promise<{ sent?: string }> }) {
  const [principal, { requestId }, query] = await Promise.all([requirePermission("engagements.read_all"), params, searchParams]);
  const data = await getQuotationEditorData(principal, requestId);
  if (!data) notFound();
  return <QuotationEditor baseHref="/admin/quotations" {...data} sent={Boolean(query.sent)} />;
}
