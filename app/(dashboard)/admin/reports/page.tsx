import { ReportsLanding } from "@/components/dashboard/reports/reports-landing";
import { requireUser } from "@/features/auth/server";
import {
  REPORT_DATE_RANGES,
  type ReportDateRangeKey,
} from "@/features/reports/types";
import {
  getReportsLandingData,
  type ReportFilters,
} from "@/repositories/report-repository";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(params: Record<string, string | string[] | undefined>): ReportFilters {
  const dateRange = firstParam(params.dateRange);

  return {
    dateRange: REPORT_DATE_RANGES.includes(dateRange as ReportDateRangeKey)
      ? (dateRange as ReportDateRangeKey)
      : undefined,
    service: firstParam(params.service) || undefined,
    status: firstParam(params.status) || undefined,
    stage: firstParam(params.stage) || undefined,
    riskLevel: firstParam(params.riskLevel) || undefined,
    currency: firstParam(params.currency) || undefined,
    invoiceStatus: firstParam(params.invoiceStatus) || undefined,
    paymentStatus: firstParam(params.paymentStatus) || undefined,
    archivedStatus: firstParam(params.archivedStatus) || undefined,
  };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, principal] = await Promise.all([searchParams, requireUser()]);
  const filters = parseFilters(params);
  const data = await getReportsLandingData(principal, filters);

  return <ReportsLanding data={data} filters={filters} />;
}
