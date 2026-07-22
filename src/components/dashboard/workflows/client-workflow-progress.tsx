import Link from "next/link";
import { ArrowRight, CheckCircle2, FileUp, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

function statusMeta(status: WorkflowInstanceRecord["status"]) {
  if (status === "completed") return { label: "Completed", tone: "green" as const };
  if (status === "read_only" || status === "archived") return { label: "Closed", tone: "slate" as const };
  if (status === "active") return { label: "In progress", tone: "teal" as const };
  return { label: "Being prepared", tone: "gold" as const };
}

function nextClientAction(workflow: WorkflowInstanceRecord) {
  return workflow.clientActions.find((action) =>
    !["approved", "completed"].includes(action.status),
  );
}

export function ClientWorkflowProgress({
  workflows,
  showHeader = true,
}: {
  workflows: WorkflowInstanceRecord[];
  showHeader?: boolean;
}) {
  return (
    <div className="grid min-w-0 max-w-full gap-4 overflow-hidden">
      {showHeader ? (
        <section className="min-w-0 rounded-md border border-border bg-card p-5">
          <Badge tone="teal">My engagements</Badge>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Work in progress</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Open an engagement to view updates, send documents, or contact your consulting team.
          </p>
        </section>
      ) : null}

      {workflows.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="grid justify-items-center gap-3 px-5 py-12 text-center">
            <CheckCircle2 aria-hidden="true" className="h-9 w-9 text-primary" />
            <p className="font-semibold text-foreground">No engagements yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Your engagement will appear here after IFTA approves your request and completes setup.
            </p>
            <Link className={buttonClassName({ size: "sm" })} href="/client/services">
              Browse services
            </Link>
          </CardContent>
        </Card>
      ) : (
        workflows.map((workflow) => {
          const action = nextClientAction(workflow);
          const status = statusMeta(workflow.status);
          const actionTab = action?.requiredDocumentType ? "documents" : "overview";
          const latestUpdate = workflow.activity.at(-1);
          return (
            <article className="min-w-0 overflow-hidden rounded-md border border-border bg-card" key={workflow.id}>
              <div className="grid min-w-0 gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <span className="break-all font-mono text-xs font-semibold text-muted-foreground">
                      {workflow.reference}
                    </span>
                  </div>
                  <h2 className="mt-3 break-words text-lg font-bold text-foreground">{workflow.serviceName}</h2>
                  <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 rounded-md bg-muted/45 px-3 py-2.5">
                      <p className="text-xs font-semibold text-muted-foreground">Current step</p>
                      <p className="mt-1 break-words text-sm font-semibold text-foreground">{workflow.currentStageName}</p>
                    </div>
                    <div className="min-w-0 rounded-md bg-muted/45 px-3 py-2.5">
                      <p className="text-xs font-semibold text-muted-foreground">What happens next</p>
                      <p className="mt-1 break-words text-sm font-semibold text-foreground">
                        {action?.title ?? workflow.nextAction ?? "Your team will share the next update here."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-semibold">
                      <span className="text-muted-foreground">Overall progress</span>
                      <span className="text-foreground">{workflow.progress.clientVisible}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-sm bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${workflow.progress.clientVisible}%` }} />
                    </div>
                  </div>
                  {latestUpdate ? (
                    <p className="mt-3 break-words text-xs leading-5 text-muted-foreground">
                      Latest update: {latestUpdate.title}
                    </p>
                  ) : null}
                </div>

                <div className="grid w-full min-w-0 gap-2 lg:w-48">
                  {action ? (
                    <Link className={buttonClassName({ className: "w-full justify-center", size: "sm" })} href={`/client/engagements/${workflow.id}?tab=${actionTab}`}>
                      {action.requiredDocumentType ? <FileUp aria-hidden="true" className="h-4 w-4" /> : <ArrowRight aria-hidden="true" className="h-4 w-4" />}
                      {action.requiredDocumentType ? "Upload document" : "View required action"}
                    </Link>
                  ) : (
                    <Link className={buttonClassName({ className: "w-full justify-center", size: "sm" })} href={`/client/engagements/${workflow.id}`}>
                      Open engagement
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  )}
                  {workflow.status === "active" ? (
                    <Link className={buttonClassName({ className: "w-full justify-center", size: "sm", variant: "secondary" })} href={`/client/engagements/${workflow.id}?tab=messages`}>
                      <MessageSquareText aria-hidden="true" className="h-4 w-4" />
                      Message team
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
