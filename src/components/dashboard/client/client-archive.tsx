import Link from "next/link";
import { Archive, FileText, FolderArchive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

function dateLabel(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(value))
    : "Not scheduled";
}

export function ClientArchive({ workflows }: { workflows: WorkflowInstanceRecord[] }) {
  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <Badge tone="teal">Completed records</Badge>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Archive</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Read-only engagement records retained after work is completed.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Archived engagements</CardTitle>
          <CardDescription>{workflows.length} retained record{workflows.length === 1 ? "" : "s"}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {workflows.length === 0 ? (
            <EmptyState
              description="Completed engagements will move here according to IFTA's retention policy."
              title="No archived engagements"
            />
          ) : workflows.map((workflow) => (
            <article className="flex flex-col justify-between gap-3 border-t border-border py-4 first:border-0 first:pt-0 md:flex-row md:items-center" key={workflow.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{workflow.serviceName}</p>
                  <Badge tone="slate">{workflow.archive.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {workflow.reference} | Archived {dateLabel(workflow.archive.archivedAt)} | Retained until {dateLabel(workflow.archive.retentionUntil)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><FileText className="h-4 w-4" />{workflow.documents.length} files</span>
                <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/client/engagements/${workflow.id}`}>
                  <FolderArchive className="h-4 w-4" />Open record
                </Link>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Archive className="h-4 w-4" />Archived records are read-only. Contact support to request restoration.
      </div>
    </div>
  );
}
