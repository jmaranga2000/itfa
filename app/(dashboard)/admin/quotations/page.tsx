import { QuotationRequestList } from "@/components/dashboard/quotations/quotation-manager";
import { requirePermission } from "@/features/auth/server";
import { listQuotationRequestsForManager } from "@/repositories/quotation-repository";

export default async function AdminQuotationsPage() {
  const principal = await requirePermission("engagements.read_all");
  return <QuotationRequestList baseHref="/admin/quotations" requests={await listQuotationRequestsForManager(principal)} />;
}
