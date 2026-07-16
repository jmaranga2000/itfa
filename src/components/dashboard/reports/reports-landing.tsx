import {
  CalendarDays,
  Download,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { ReportCategoryIcon } from "@/components/dashboard/reports/report-category-icon";
import { ReportKpiCard } from "@/components/dashboard/reports/report-kpi-card";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  REPORT_DATE_RANGES,
  type ReportDateRangeKey,
} from "@/features/reports/types";
import type { ReportFilters, ReportsLandingData } from "@/repositories/report-repository";

function formatDateTime(value: string | Date | null) {
  if (!value) {
    return "Not generated";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function rangeLabel(range: ReportDateRangeKey) {
  return range
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ReportsLanding({
  data,
  filters,
}: {
  data: ReportsLandingData;
  filters: ReportFilters;
}) {
  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Reports
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
              Review client work, finance, compliance and team performance in one place.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1">
                <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                {formatDateTime(data.dateRange.start)} to {formatDateTime(data.dateRange.end)}
              </span>
              <span className="rounded-md border border-border px-2 py-1">
                Data current as of {formatDateTime(data.dataFreshness)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className={buttonClassName({ variant: "secondary" })}
              download="ifta-report-summary.csv"
              href={`data:text/csv;charset=utf-8,${encodeURIComponent("metric,value\n" + data.summary.map((item) => `${item.label},${item.value}`).join("\n"))}`}
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Export summary
            </a>
          </div>
        </div>
      </section>

      <form className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-[repeat(4,minmax(150px,1fr))_auto_auto]">
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={filters.dateRange ?? "last_30_days"}
          name="dateRange"
        >
          {REPORT_DATE_RANGES.map((range) => (
            <option key={range} value={range}>
              {rangeLabel(range)}
            </option>
          ))}
        </select>
        <input
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={filters.service ?? ""}
          name="service"
          placeholder="Service"
        />
        <input
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={filters.status ?? ""}
          name="status"
          placeholder="Status"
        />
        <input
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={filters.riskLevel ?? ""}
          name="riskLevel"
          placeholder="Risk level"
        />
        <button className={buttonClassName({ variant: "secondary" })} type="submit">
          <Filter aria-hidden="true" className="h-4 w-4" />
          Apply
        </button>
        <Link className={buttonClassName({ variant: "ghost" })} href="/admin/reports">
          Reset
        </Link>
      </form>

      <section className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2 2xl:grid-cols-3">
        {data.summary.map((kpi) => (
          <ReportKpiCard compact key={kpi.key} kpi={kpi} />
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
        {data.categories.map((category) => (
          <Link
            className="rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-accent"
            href={category.href}
            key={category.key}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground">
                <ReportCategoryIcon icon={category.icon} />
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {category.reportCount} reports
              </span>
            </div>
            <h2 className="mt-4 text-sm font-bold text-foreground">{category.label}</h2>
            <p className="mt-2 min-h-16 text-xs leading-5 text-muted-foreground">
              {category.description}
            </p>
            <div className="mt-4 rounded-md border border-border px-3 py-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {category.primaryMetricLabel}
              </p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {category.primaryMetricValue}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Report alerts</CardTitle>
              <CardDescription>Rule-based warnings from current report data.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.alerts.map((alert) => (
                <Link
                  className="rounded-md border border-border px-3 py-3 hover:border-accent"
                  href={alert.href}
                  key={alert.title}
                >
                  <Badge tone={alert.tone}>{alert.title}</Badge>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{alert.description}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

        </div>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Recently viewed</CardTitle>
              <CardDescription>Saved report views opened most recently.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.recentlyViewed.length > 0 ? (
                data.recentlyViewed.map((report) => (
                  <Link className="rounded-md border border-border px-3 py-3" href={report.href} key={report.id}>
                    <p className="text-sm font-semibold text-foreground">{report.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.category} opened {formatDateTime(report.lastOpenedAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No recently viewed saved reports yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled reports</CardTitle>
              <CardDescription>Active scheduled report deliveries.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.scheduledReports.length > 0 ? (
                data.scheduledReports.map((report) => (
                  <div className="rounded-md border border-border px-3 py-3" key={report.id}>
                    <p className="text-sm font-semibold text-foreground">{report.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.frequency} delivery, next {formatDateTime(report.nextDeliveryAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No scheduled reports have been configured.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export history</CardTitle>
              <CardDescription>Recent generated report exports.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.exportHistory.length > 0 ? (
                data.exportHistory.map((exportRecord) => (
                  <div className="rounded-md border border-border px-3 py-3" key={exportRecord.id}>
                    <p className="text-sm font-semibold text-foreground">
                      {exportRecord.reportName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {exportRecord.format} by {exportRecord.generatedByName} on{" "}
                      {formatDateTime(exportRecord.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No report exports have been generated yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
