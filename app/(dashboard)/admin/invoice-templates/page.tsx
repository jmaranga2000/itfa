import { TemplateManagementDashboard } from "@/components/dashboard/templates/template-management-dashboard";
import { requirePermission } from "@/features/auth/server";
import { getTemplateManagementData } from "@/repositories/template-repository";

export default async function AdminInvoiceTemplatesPage() {
  const principal = await requirePermission("templates.read");
  const filters = { category: "invoice" as const };
  const data = await getTemplateManagementData(principal, filters);

  return <TemplateManagementDashboard data={data} filters={filters} />;
}
