import { redirect } from "next/navigation";
import { QuotationEditor } from "@/components/dashboard/quotations/quotation-manager";
import { requireStaffRoute } from "@/features/staff/server";
import { getQuotationEditorData } from "@/repositories/quotation-repository";

export default async function StaffQuotationEditorPage({ params, searchParams }: { params: Promise<{ requestId: string }>; searchParams: Promise<{ sent?: string }> }) {
  const [{ principal }, { requestId }, query] = await Promise.all([requireStaffRoute("quotations"), params, searchParams]);
  const data = await getQuotationEditorData(principal, requestId);
  if (!data) redirect("/access-blocked");
  return <QuotationEditor baseHref="/staff/quotations" {...data} sent={Boolean(query.sent)} />;
}
