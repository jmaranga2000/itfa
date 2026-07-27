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

export function ArchiveManagement({ data }: { data: ArchiveDashboardData }) {
  return (
    <div className="grid gap-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-normal text-foreground">
          Archive Management
        </h1>
        <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
          Retention policies, legal holds, restore requests, and pending deletions.
        </p>
        <Link
          className={buttonClassName({ variant: "ghost", size: "sm" })}
          href="/admin/archive"
        >
          Back to records
        </Link>
      </div>

      {/* Four column grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {/* Retention policies */}
        <Card>
          <CardHeader>
            <CardTitle>Retention policies</CardTitle>
            <CardDescription>Configurable retention rules.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.retentionPolicies.length > 0 ? (
              <div className="grid gap-3">
                {data.retentionPolicies.map((policy) => (
                  <div className="rounded-md border border-border px-4 py-3" key={policy.id}>
                    <p className="text-sm font-semibold text-foreground">{policy.name}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-mono text-accent">{policy.retentionPeriodMonths}</span>
                      {" "}months
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-mono text-accent">{policy.activeRecordsCovered}</span>
                      {" "}records covered
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No retention policies configured.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legal holds */}
        <Card>
          <CardHeader>
            <CardTitle>Legal holds</CardTitle>
            <CardDescription>Active and review holds.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.legalHolds.length > 0 ? (
              <div className="grid gap-3">
                {data.legalHolds.map((hold) => (
                  <div className="rounded-md border border-border px-4 py-3" key={hold.id}>
                    <p className="text-sm font-semibold text-foreground">{hold.holdReference}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{hold.reason}</p>
                    <p className="mt-1 text-xs font-medium text-warning">
                      Review {formatDate(hold.reviewDate)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No active legal holds.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restore requests */}
        <Card>
          <CardHeader>
            <CardTitle>Restore requests</CardTitle>
            <CardDescription>Awaiting approval.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.restoreRequests.length > 0 ? (
              <div className="grid gap-3">
                {data.restoreRequests.map((request) => (
                  <div className="rounded-md border border-border px-4 py-3" key={request.id}>
                    <p className="text-sm font-semibold text-foreground">{request.requestReference}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{request.recordReference}</p>
                    <p className="mt-1 text-xs font-medium text-accent">
                      {request.approvalStatus}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No restore requests.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending deletion */}
        <Card>
          <CardHeader>
            <CardTitle>Pending deletion</CardTitle>
            <CardDescription>Restricted approval queue.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.deletionRequests.length > 0 ? (
              <div className="grid gap-3">
                {data.deletionRequests.map((request) => (
                  <div className="rounded-md border border-border px-4 py-3" key={request.id}>
                    <p className="text-sm font-semibold text-foreground">{request.requestReference}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{request.recordReference}</p>
                    <p className="mt-1 text-xs font-medium text-destructive">
                      {request.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No pending deletions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
