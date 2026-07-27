import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";
import type { ArchiveDashboardData } from "@/repositories/archive-repository";

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ArchiveAnalytics({ data }: { data: ArchiveDashboardData }) {
  return (
    <div className="grid gap-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-normal text-foreground">
          Archive Analytics
        </h1>
        <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
          Records requiring attention and distribution statistics.
        </p>
        <Link
          className={buttonClassName({ variant: "ghost", size: "sm" })}
          href="/admin/archive"
        >
          Back to records
        </Link>
      </div>

      {/* Records requiring attention */}
      <Card>
        <CardHeader>
          <CardTitle>Records requiring attention</CardTitle>
          <CardDescription>
            Archives approaching retention expiry or with pending actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.attention.length > 0 ? (
            <div className="grid gap-3">
              {data.attention.map((record) => (
                <Link
                  className="rounded-md border border-border px-4 py-3 hover:border-accent hover:bg-muted/30"
                  href={record.href}
                  key={record.id}
                >
                  <p className="text-sm font-semibold text-foreground">{record.recordName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {record.archiveStatusLabel}
                  </p>
                  <p className="mt-1 text-xs font-medium text-destructive">
                    Expires {formatDate(record.retentionExpiryDate)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-8 text-center">
              <p className="font-semibold text-foreground">No records requiring attention</p>
              <p className="mt-2 text-sm text-muted-foreground">
                All archived records are in good standing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Archive distribution</CardTitle>
          <CardDescription>Records by type with trend analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {data.distribution.map((item) => (
              <div className="grid gap-2" key={item.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-accent">
                      {item.value}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {((item.value / data.records.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-accent transition-all"
                    style={{
                      width: `${Math.max(5, (item.value / Math.max(...data.distribution.map((d) => d.value))) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {data.records.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              archived in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Near expiry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {data.attention.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">With legal hold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              {data.legalHolds.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              active legal holds
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
