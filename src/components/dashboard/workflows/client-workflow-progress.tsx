import Link from "next/link";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";
import { cn } from "@/lib/utils";

function dateLabel(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (["completed", "approved", "final"].includes(status)) {
    return "green" as const;
  }

  if (["pending", "waiting_for_client", "in_progress"].includes(status)) {
    return "gold" as const;
  }

  return "slate" as const;
}

export function ClientWorkflowProgress({
  workflows,
  showHeader = true,
}: {
  workflows: WorkflowInstanceRecord[];
  showHeader?: boolean;
}) {
  return (
    <div className="grid gap-5">
      {showHeader ? <section className="rounded-md border border-border bg-card p-5">
        <Badge tone="teal">Client progress</Badge>
        <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
          Engagement progress
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          View your simplified engagement progress, required actions, shared documents and
          client-visible activity.
        </p>
      </section> : null}

      {workflows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No active workflows</CardTitle>
            <CardDescription>Approved engagements will appear here.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <div>
                <CardTitle>{workflow.serviceName}</CardTitle>
                <CardDescription>
                  {workflow.reference} | {workflow.clientName}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">{workflow.progress.clientVisible}%</p>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Progress</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {workflow.stages.map((stage) => (
                  <div
                    className={cn(
                      "rounded-md border p-3",
                      stage.key === workflow.currentStageKey ? "border-accent bg-muted" : "border-border",
                    )}
                    key={stage.key}
                  >
                    <div className="flex items-center gap-2">
                      {stage.status === "completed" ? (
                        <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Circle aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                      )}
                      <p className="text-sm font-semibold text-foreground">{stage.clientTitle}</p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {stage.status.replaceAll("_", " ")}
                    </p>
                  </div>
                ))}
              </div>

              <section className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-md border border-border p-4">
                  <p className="text-sm font-bold text-foreground">Actions required</p>
                  <div className="mt-3 grid gap-2">
                    {workflow.clientActions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No client actions are currently pending.</p>
                    ) : (
                      workflow.clientActions.map((action) => (
                        <div className="rounded-md border border-border px-3 py-2" key={action.key}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">{action.title}</p>
                            <Badge tone={statusTone(action.status)}>{action.status.replaceAll("_", " ")}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">Due {dateLabel(action.dueDate)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-border p-4">
                  <p className="text-sm font-bold text-foreground">Latest updates</p>
                  <div className="mt-3 grid gap-2">
                    {workflow.activity.slice(0, 4).map((activity) => (
                      <div className="flex gap-2 rounded-md border border-border px-3 py-2" key={`${activity.title}-${activity.createdAt}`}>
                        <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 text-accent" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="flex flex-wrap gap-2">
                <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/client/engagements/${workflow.id}?tab=documents`}>
                  Upload document
                </Link>
                <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/client/engagements/${workflow.id}?tab=messages`}>
                  Message consultant
                </Link>
                <Link className={buttonClassName({ size: "sm" })} href={`/client/engagements/${workflow.id}`}>
                  Open engagement
                </Link>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
