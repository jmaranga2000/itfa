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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ArchiveActivity({ data }: { data: ArchiveDashboardData }) {
  return (
    <div className="grid gap-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-normal text-foreground">
          Archive Activity
        </h1>
        <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
          Recent audit log of archive operations and changes.
        </p>
        <Link
          className={buttonClassName({ variant: "ghost", size: "sm" })}
          href="/admin/archive"
        >
          Back to records
        </Link>
      </div>

      {/* Activity log */}
      <Card>
        <CardHeader>
          <CardTitle>Archive audit log</CardTitle>
          <CardDescription>
            Timeline of archive operations, restorations, holds, and exports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.activity.length > 0 ? (
            <div className="space-y-4">
              {data.activity.map((activity, index) => (
                <div
                  className="relative pb-4"
                  key={activity.id}
                >
                  {/* Vertical line */}
                  {index < data.activity.length - 1 && (
                    <div className="absolute left-3 top-8 h-8 w-0.5 bg-border" />
                  )}

                  {/* Timeline dot */}
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-accent" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-0.5">
                      <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">
                          {activity.action}
                        </p>
                        {activity.reason && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {activity.reason}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>
                            by {activity.actorEmail ?? "System"}
                          </span>
                          <span>•</span>
                          <span>{formatDate(activity.createdAt)}</span>
                          {activity.resourceId && (
                            <>
                              <span>•</span>
                              <span className="font-mono">ID: {activity.resourceId}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-8 text-center">
              <p className="font-semibold text-foreground">No activity yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Archive activity will appear here when records are archived, restored, held, or exported.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
