import {
  CalendarDays,
  Download,
  Filter,
  Link2,
  RefreshCcw,
  Save,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { ReportCategoryIcon } from "@/components/dashboard/reports/report-category-icon";
import { ReportChart } from "@/components/dashboard/reports/report-chart";
import { ReportDataTable } from "@/components/dashboard/reports/report-data-table";
import { ReportKpiCard } from "@/components/dashboard/reports/report-kpi-card";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  REPORT_CATEGORY_META,
  REPORT_DATE_RANGES,
  type ReportDateRangeKey,
} from "@/features/reports/types";
import type { ReportDetailData } from "@/repositories/report-repository";

function formatDateTime(value: string | Date | null) {
  if (!value) {
    return "Not recorded";
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

function activeFilterCount(data: ReportDetailData) {
  return Object.values(data.filters).filter((value) =>
    typeof value === "boolean" ? value : Boolean(value),
  ).length;
}

export function ReportDetail({ data }: { data: ReportDetailData }) {
  const category = REPORT_CATEGORY_META[data.definition.category];
  const csvSummary = [
    "metric,value",
    ...data.kpis.map((kpi) => `${JSON.stringify(kpi.label)},${JSON.stringify(kpi.value)}`),
  ].join("\n");

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground">
                <ReportCategoryIcon icon={category.icon} />
              </span>
              <Badge tone="teal">{category.label}</Badge>
              <Badge tone="slate">{data.definition.dataSource}</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              {data.definition.title}
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
              {data.definition.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1">
                <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                {formatDateTime(data.dateRange.start)} to {formatDateTime(data.dateRange.end)}
              </span>
              <span className="rounded-md border border-border px-2 py-1">
                Previous: {formatDateTime(data.previousDateRange.start)} to{" "}
                {formatDateTime(data.previousDateRange.end)}
              </span>
              <span className="rounded-md border border-border px-2 py-1">
                Data current as of {formatDateTime(data.dataFreshness)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonClassName({ variant: "secondary" })} href="/admin/reports">
              Reports
            </Link>
            <button className={buttonClassName({ variant: "secondary" })} type="button">
              <RefreshCcw aria-hidden="true" className="h-4 w-4" />
              Refresh
            </button>
            <button className={buttonClassName({ variant: "secondary" })} type="button">
              <Save aria-hidden="true" className="h-4 w-4" />
              Save
            </button>
            <button className={buttonClassName({ variant: "secondary" })} type="button">
              <Share2 aria-hidden="true" className="h-4 w-4" />
              Share
            </button>
            <a
              className={buttonClassName()}
              download={`${data.definition.key}-summary.csv`}
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvSummary)}`}
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Export
            </a>
          </div>
        </div>
      </section>

      <form className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-[repeat(5,minmax(135px,1fr))_auto_auto]">
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={data.filters.dateRange ?? data.definition.defaultDateRange}
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
          defaultValue={data.filters.service ?? ""}
          name="service"
          placeholder="Service"
        />
        <input
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={data.filters.status ?? ""}
          name="status"
          placeholder="Status"
        />
        <input
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={data.filters.riskLevel ?? ""}
          name="riskLevel"
          placeholder="Risk level"
        />
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          defaultValue={data.filters.archivedStatus ?? "excluded"}
          name="archivedStatus"
        >
          <option value="excluded">Exclude archived</option>
          <option value="included">Include archived</option>
        </select>
        <button className={buttonClassName({ variant: "secondary" })} type="submit">
          <Filter aria-hidden="true" className="h-4 w-4" />
          Apply
        </button>
        <Link className={buttonClassName({ variant: "ghost" })} href={`/admin/reports/${data.definition.key}`}>
          Reset
        </Link>
      </form>

      <div className="flex flex-wrap gap-2">
        <Badge tone="slate">{activeFilterCount(data)} active filters</Badge>
        {data.definition.availableFilters.map((filter) => (
          <Badge key={filter} tone="slate">
            {filter}
          </Badge>
        ))}
      </div>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <ReportKpiCard key={kpi.key} kpi={kpi} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {data.charts.map((chart) => (
          <ReportChart chart={chart} key={chart.title} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ReportDataTable table={data.table} />
        <div className="grid content-start gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Insights</CardTitle>
              <CardDescription>Rule-based observations from report data.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.insights.map((insight) => (
                <div className="rounded-md border border-border px-3 py-3 text-sm leading-6" key={insight}>
                  {insight}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calculation notes</CardTitle>
              <CardDescription>Definitions used by this report.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {data.calculationNotes.map((note) => (
                <div className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground" key={note}>
                  {note}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export history</CardTitle>
              <CardDescription>Recent exports for this report.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.exportHistory.length > 0 ? (
                data.exportHistory.map((record) => (
                  <div className="rounded-md border border-border px-3 py-3" key={record.id}>
                    <p className="text-sm font-semibold text-foreground">{record.reportName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {record.format} by {record.generatedByName} on {formatDateTime(record.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No export history for this report yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Drill-down routes</CardTitle>
              <CardDescription>Related operational records.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {data.definition.drillDownRoutes.map((route) => (
                <Link
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:border-accent"
                  href={route}
                  key={route}
                >
                  <Link2 aria-hidden="true" className="h-4 w-4 text-accent" />
                  {route}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
