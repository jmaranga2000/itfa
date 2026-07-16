import { TemplateManagementDashboard } from "@/components/dashboard/templates/template-management-dashboard";
import { requireUser } from "@/features/auth/server";
import { getTemplateManagementData } from "@/repositories/template-repository";

export default async function AdminInvoiceTemplatesPage() {
  const principal = await requireUser();
  const filters = { category: "invoice" as const };
  const data = await getTemplateManagementData(principal, filters);

  return <TemplateManagementDashboard data={data} filters={filters} />;
}
