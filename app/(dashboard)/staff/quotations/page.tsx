import { QuotationRequestList } from "@/components/dashboard/quotations/quotation-manager";
import { requireStaffRoute } from "@/features/staff/server";
import { listQuotationRequestsForManager } from "@/repositories/quotation-repository";

export default async function StaffQuotationsPage() {
  const { principal } = await requireStaffRoute("quotations");
  return <QuotationRequestList baseHref="/staff/quotations" requests={await listQuotationRequestsForManager(principal)} />;
}
