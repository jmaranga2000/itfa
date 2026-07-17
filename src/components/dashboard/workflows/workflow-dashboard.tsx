import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  WorkflowDashboardData,
  WorkflowInstanceRecord,
} from "@/repositories/workflow-repository";
import type { WorkflowPriority, WorkflowRiskLevel } from "@/features/workflows/types";
import { cn } from "@/lib/utils";

function dateLabel(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function priorityTone(priority: WorkflowPriority) {
  if (priority === "critical" || priority === "high") {
    return "red" as const;
  }

  if (priority === "medium") {
    return "gold" as const;
  }

  return "slate" as const;
}

function riskTone(risk: WorkflowRiskLevel) {
  if (risk === "critical" || risk === "high") {
    return "red" as const;
  }

  if (risk === "medium") {
    return "gold" as const;
  }

  return "green" as const;
}

function workloadTone(level: string) {
  if (level === "overloaded" || level === "high") {
    return "red" as const;
  }

  if (level === "balanced") {
    return "gold" as const;
  }

  return "green" as const;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
    </div>
  );
}

function WorkflowCard({ workflow, selected = false }: { workflow: WorkflowInstanceRecord; selected?: boolean }) {
  return (
    <Link
      className={cn(
        "block rounded-md border bg-card p-4 transition-colors hover:border-accent",
        selected ? "border-accent" : "border-border",
      )}
      href={`/admin/workflows/${workflow.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{workflow.clientName}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {workflow.reference} · {workflow.serviceName}
          </p>
        </div>
        <Badge tone={riskTone(workflow.riskLevel)}>{workflow.riskLevel}</Badge>
      </div>
      <div className="mt-4 grid gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">{workflow.currentStageName}</span>
          <span className="text-muted-foreground">{workflow.progress.overall}%</span>
        </div>
        <ProgressBar value={workflow.progress.overall} />
      </div>
      <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Next:</span> {workflow.nextAction}
        </p>
        <p>
          <span className="font-semibold text-foreground">Owner:</span>{" "}
          {workflow.responsibleUserName || "Unassigned"}
        </p>
        <p>
          <span className="font-semibold text-foreground">Due:</span> {dateLabel(workflow.dueDate)}
        </p>
      </div>
    </Link>
  );
}

export function WorkflowDashboard({ data }: { data: WorkflowDashboardData }) {
  return (
    <div className="grid w-full min-w-0 max-w-full gap-5 overflow-x-hidden">
      <section className="min-w-0 rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Workflows
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              See where each client engagement is, what needs attention and who is responsible.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/tasks">
              Tasks
            </Link>
            <Link className={buttonClassName({ size: "sm" })} href="/admin/workflow-templates">
              Workflow templates
            </Link>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2 2xl:grid-cols-3">
        {data.summary.map((metric) => (
          <Link href={metric.href} key={metric.label}>
            <Card className="h-full rounded-none border-0 shadow-none transition-colors hover:bg-muted/40">
              <CardHeader className="p-4 pb-2">
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-2xl font-bold">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs leading-5 text-muted-foreground">{metric.helper}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Workflow pipeline</CardTitle>
            <CardDescription>Stage distribution across the consulting lifecycle.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {data.pipeline.map((stage) => (
              <div className="rounded-md border border-border p-3" key={stage.key}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{stage.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stage.count} workflows</p>
                  </div>
                  {stage.overdue > 0 || stage.risk > 0 ? (
                    <AlertTriangle aria-hidden="true" className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Badge tone={stage.overdue > 0 ? "red" : "green"}>{stage.overdue} overdue</Badge>
                  <Badge tone={stage.risk > 0 ? "gold" : "slate"}>{stage.risk} at risk</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Action required</CardTitle>
            <CardDescription>Specific work that needs review, approval or follow-up.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.actionRequired.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                No client actions or approvals are currently pending.
              </div>
            ) : (
              data.actionRequired.map((item) => (
                <Link className="rounded-md border border-border p-3 hover:border-accent" href={item.href} key={`${item.engagement}-${item.item}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                    <span className="text-sm font-semibold text-foreground">{item.item}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.client} · {item.engagement} · {item.responsibleUser}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-accent">{item.action}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="min-w-0">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Workflow list</CardTitle>
            <CardDescription>Open a workflow to review its stages, tasks and client actions.</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="max-w-full overflow-x-auto">
              <Table className="min-w-[840px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Client work</TableHead>
                    <TableHead>Service and stage</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Responsible person</TableHead>
                    <TableHead>Next action</TableHead>
                    <TableHead>Due and risk</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <Link className="font-semibold text-accent hover:underline" href={`/admin/workflows/${workflow.id}`}>
                          {workflow.clientName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{workflow.reference}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{workflow.serviceName}</p>
                        <p className="text-xs text-muted-foreground">{workflow.currentStageName}</p>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-28">
                          <ProgressBar value={workflow.progress.overall} />
                          <p className="mt-1 text-xs text-muted-foreground">{workflow.progress.overall}%</p>
                        </div>
                      </TableCell>
                      <TableCell>{workflow.responsibleUserName}</TableCell>
                      <TableCell className="max-w-64 truncate">{workflow.nextAction}</TableCell>
                      <TableCell>
                        <p>{dateLabel(workflow.dueDate)}</p>
                        <Badge tone={riskTone(workflow.riskLevel)}>{workflow.riskLevel}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/admin/workflows/${workflow.id}`}>
                          Open
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="hidden">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Kanban preview</CardTitle>
              <CardDescription>Drag actions open validation before any transition is saved.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.pipeline.slice(0, 4).map((stage) => (
                <div className="rounded-md border border-border p-3" key={stage.key}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{stage.label}</p>
                    <Badge tone="slate">{stage.count}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {data.workflows
                      .filter((workflow) => workflow.currentStageKey === stage.key)
                      .slice(0, 2)
                      .map((workflow) => (
                        <WorkflowCard workflow={workflow} key={workflow.id} />
                      ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Recent workflow activity</CardTitle>
              <CardDescription>Chronological operational history.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.recentActivity.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">
                  No workflow activity has been recorded.
                </div>
              ) : (
                data.recentActivity.map((activity) => (
                  <div className="flex gap-3 rounded-md border border-border p-3" key={`${activity.title}-${activity.createdAt}`}>
                    <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {activity.actorName} · {dateLabel(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Overdue work</CardTitle>
            <CardDescription>Tasks past due with escalation context.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.overdueWork.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                All current tasks are within their deadlines.
              </div>
            ) : (
              data.overdueWork.map((item) => (
                <Link className="rounded-md border border-border p-3 hover:border-accent" href={item.href} key={`${item.engagement}-${item.task}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{item.task}</p>
                    <Badge tone={priorityTone(item.priority)}>{item.daysOverdue}d overdue</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.engagement} · {item.assignee} · {item.escalationStatus}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Staff workload</CardTitle>
            <CardDescription>Assignment pressure before confirming new work.</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consultant</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Open tasks</TableHead>
                    <TableHead>Overdue</TableHead>
                    <TableHead>Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.staffWorkload.map((member) => (
                    <TableRow key={member.consultant}>
                      <TableCell className="font-semibold text-foreground">{member.consultant}</TableCell>
                      <TableCell>{member.activeEngagements}</TableCell>
                      <TableCell>{member.openTasks}</TableCell>
                      <TableCell>{member.overdueTasks}</TableCell>
                      <TableCell>
                        <Badge tone={workloadTone(member.workloadLevel)}>
                          {member.workloadLevel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
