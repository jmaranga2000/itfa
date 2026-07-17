import { StaffTemplates } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { getTemplateManagementData } from "@/repositories/template-repository";

export default async function StaffTemplatesPage() {
  const { principal } = await requireStaffRoute("templates");
  const data = await getTemplateManagementData(principal);
  return <StaffTemplates templates={data.templates} />;
}
