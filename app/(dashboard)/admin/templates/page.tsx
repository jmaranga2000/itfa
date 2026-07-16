import { TemplateManagementDashboard } from "@/components/dashboard/templates/template-management-dashboard";
import { requireUser } from "@/features/auth/server";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_STATUSES,
  type TemplateCategory,
  type TemplateStatus,
} from "@/features/templates/types";
import {
  getTemplateManagementData,
  type TemplateListFilters,
} from "@/repositories/template-repository";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(params: Record<string, string | string[] | undefined>): TemplateListFilters {
  const category = firstParam(params.category);
  const status = firstParam(params.status);

  return {
    search: firstParam(params.search) || undefined,
    category: TEMPLATE_CATEGORIES.includes(category as TemplateCategory)
      ? (category as TemplateCategory)
      : undefined,
    status: TEMPLATE_STATUSES.includes(status as TemplateStatus)
      ? (status as TemplateStatus)
      : undefined,
    service: firstParam(params.service) || undefined,
    clientType: firstParam(params.clientType) || undefined,
  };
}

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, principal] = await Promise.all([searchParams, requireUser()]);
  const filters = parseFilters(params);
  const data = await getTemplateManagementData(principal, filters);

  return <TemplateManagementDashboard data={data} filters={filters} />;
}
