import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportKpi } from "@/repositories/report-repository";
import { cn } from "@/lib/utils";

function TrendIcon({ direction }: { direction: ReportKpi["comparison"]["direction"] }) {
  if (direction === "up") {
    return <ArrowUpRight aria-hidden="true" className="h-4 w-4" />;
  }

  if (direction === "down") {
    return <ArrowDownRight aria-hidden="true" className="h-4 w-4" />;
  }

  return <ArrowRight aria-hidden="true" className="h-4 w-4" />;
}

export function ReportKpiCard({ kpi }: { kpi: ReportKpi }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm">{kpi.label}</CardTitle>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold",
              kpi.comparison.interpretation === "positive" &&
                "ifta-badge-success",
              kpi.comparison.interpretation === "negative" &&
                "ifta-badge-danger",
              kpi.comparison.interpretation === "neutral" &&
                "ifta-badge-neutral",
            )}
          >
            <TrendIcon direction={kpi.comparison.direction} />
            {kpi.comparison.label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
        <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{kpi.explanation}</p>
        <Link
          className="mt-3 inline-flex text-sm font-semibold text-primary hover:text-foreground"
          href={kpi.drillDownHref}
        >
          Drill down
        </Link>
      </CardContent>
    </Card>
  );
}
