import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportChart as ReportChartData } from "@/repositories/report-repository";

export function ReportChart({ chart }: { chart: ReportChartData }) {
  const max = Math.max(...chart.data.map((item) => item.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chart.title}</CardTitle>
        <CardDescription>{chart.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chart.data.length > 0 ? (
          <div className="grid gap-3" role="img" aria-label={`${chart.title}: ${chart.description}`}>
            {chart.data.map((item) => {
              const width = Math.max(4, Math.round((item.value / max) * 100));

              return (
                <div className="grid gap-1" key={item.label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-foreground">{item.label}</span>
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {item.value.toLocaleString("en-KE")}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-sm bg-muted">
                    <div
                      className="h-full rounded-sm bg-accent"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
            No records matched the selected filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
