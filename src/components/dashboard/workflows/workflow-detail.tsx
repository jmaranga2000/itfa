import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  MessageSquareText,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { transitionWorkflowStageAction } from "@/features/workflows/actions";
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
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";
import type { WorkflowPriority } from "@/features/workflows/types";
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

function statusTone(status: string) {
  if (["completed", "approved", "paid", "final"].includes(status)) {
    return "green" as const;
  }

  if (["blocked", "overdue", "rejected"].includes(status)) {
    return "red" as const;
  }

  if (["waiting_for_client", "waiting_for_staff", "waiting_for_approval", "awaiting_approval", "pending"].includes(status)) {
    return "gold" as const;
  }

  return "slate" as const;
}

function stageIcon(status: string) {
  if (status === "completed") {
    return CheckCircle2;
  }

  if (status === "blocked") {
    return AlertTriangle;
  }

  return Circle;
}

function StageTracker({ workflow }: { workflow: WorkflowInstanceRecord }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Workflow stages</CardTitle>
        <CardDescription>Client-visible and internal progression through the lifecycle.</CardDescription>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {workflow.stages.map((stage) => {
            const Icon = stageIcon(stage.status);
            const current = stage.key === workflow.currentStageKey;

            return (
              <div
                className={cn(
                  "min-w-0 rounded-md border p-3",
                  current ? "border-accent bg-muted" : "border-border",
                )}
                key={stage.key}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-muted-foreground">
                    {String(stage.order).padStart(2, "0")}
                  </span>
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4",
                      stage.status === "completed"
                        ? "text-emerald-600"
                        : stage.status === "blocked"
                          ? "text-red-600"
                          : current
                            ? "text-accent"
                            : "text-muted-foreground",
                    )}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{stage.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{stage.responsibleRole}</p>
                <div className="mt-3">
                  <Badge tone={statusTone(stage.status)}>{stage.status.replaceAll("_", " ")}</Badge>
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
}

function TransitionPanel({ workflow }: { workflow: WorkflowInstanceRecord }) {
  const currentIndex = workflow.stages.findIndex((stage) => stage.key === workflow.currentStageKey);
  const nextStage = workflow.stages[currentIndex + 1];

  if (!nextStage) {
    return null;
  }

  return (
    <Card className="min-w-0" id="advance-stage">
      <CardHeader>
        <CardTitle>Advance stage</CardTitle>
        <CardDescription>
          Transition validation checks tasks, documents, approvals and blockers before saving.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={transitionWorkflowStageAction} className="grid gap-3">
          <input name="workflowId" type="hidden" value={workflow.id} />
          <input name="nextStageKey" type="hidden" value={nextStage.key} />
          <div className="rounded-md border border-border p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Next stage</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{nextStage.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{nextStage.completionConditions[0]}</p>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-foreground">Reason</span>
            <textarea
              className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              name="reason"
              placeholder="Explain the transition or override reason"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input className="h-4 w-4" name="override" type="checkbox" />
            Use authorized override
          </label>
          <button className={buttonClassName({ className: "w-full" })} type="submit">
            Advance to {nextStage.name}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

export function WorkflowDetail({
  workflow,
  transitionError,
  transitioned = false,
}: {
  workflow: WorkflowInstanceRecord;
  transitionError?: string;
  transitioned?: boolean;
}) {
  const messageHref = workflow.clientUserId
    ? `/admin/messages/new?clientId=${encodeURIComponent(workflow.clientUserId)}`
    : "/admin/messages";

  return (
    <div className="grid w-full min-w-0 max-w-full gap-5 overflow-x-hidden">
      {transitionError ? (
        <section
          aria-labelledby="workflow-transition-error-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
          role="alertdialog"
        >
          <div className="w-full max-w-lg rounded-md border border-red-200 bg-card p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-red-50 text-red-700">
                <AlertTriangle aria-hidden="true" className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground" id="workflow-transition-error-title">
                  Workflow could not advance
                </h2>
                <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                  {transitionError}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Link className={buttonClassName()} href={`/admin/workflows/${workflow.id}`}>
                Back to workflow
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {transitioned ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Workflow advanced successfully.
        </div>
      ) : null}
      <section className="min-w-0 rounded-md border border-border bg-card p-5">
        <div className="grid min-w-0 gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <Badge tone="teal">{workflow.reference}</Badge>
              <Badge tone={statusTone(workflow.riskLevel)}>{workflow.riskLevel} risk</Badge>
              <Badge tone="slate">{workflow.status.replaceAll("_", " ")}</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              {workflow.clientName}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/active-engagements">
                Back to active work
              </Link>
              <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/tasks">
                Open task queue
              </Link>
              <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={messageHref}>
                Message client
              </Link>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {workflow.serviceName} · {workflow.templateName} v{workflow.templateVersion}
            </p>
          </div>
          <div className="grid w-full min-w-0 gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Current stage", workflow.currentStageName],
              ["Progress", `${workflow.progress.overall}%`],
              ["Manager", workflow.responsibleUserName || "Unassigned"],
              ["Due date", dateLabel(workflow.dueDate)],
            ].map(([label, value]) => (
              <div className="rounded-md border border-border px-3 py-2" key={label}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StageTracker workflow={workflow} />

      <section className="grid min-w-0 max-w-full gap-5">
        <div className="grid min-w-0 gap-5">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Current operating state and next required action.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {[
                ["Next required action", workflow.nextAction],
                ["Blockers", workflow.progress.blockedItems ? `${workflow.progress.blockedItems} blocker(s)` : "No blockers"],
                ["Overdue items", workflow.progress.overdueItems ? `${workflow.progress.overdueItems} overdue` : "None"],
                ["Pending approvals", workflow.progress.pendingApprovals ? `${workflow.progress.pendingApprovals} pending` : "None"],
              ].map(([label, value]) => (
                <div className="rounded-md border border-border p-3" key={label}>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Dependencies, assignments, status and deadlines.</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Dependencies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflow.tasks.map((task) => (
                    <TableRow key={task.key}>
                      <TableCell className="font-semibold text-foreground">{task.title}</TableCell>
                      <TableCell>{task.assignedUserName || task.assignedRole}</TableCell>
                      <TableCell>
                        <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge tone={statusTone(task.status)}>{task.status.replaceAll("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>{dateLabel(task.dueDate)}</TableCell>
                      <TableCell>{task.dependencies.length || "None"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <section className="grid min-w-0 gap-5 xl:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Client actions</CardTitle>
                <CardDescription>Requests waiting for client participation.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {workflow.clientActions.map((action) => (
                  <div className="rounded-md border border-border p-3" key={action.key}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{action.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{action.instructions}</p>
                      </div>
                      <Badge tone={statusTone(action.status)}>{action.status.replaceAll("_", " ")}</Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Due {dateLabel(action.dueDate)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Approvals</CardTitle>
                <CardDescription>Controlled gates for review and completion.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {workflow.approvals.map((approval) => (
                  <div className="rounded-md border border-border p-3" key={approval.key}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{approval.title}</p>
                      <Badge tone={statusTone(approval.status)}>{approval.status.replaceAll("_", " ")}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {approval.approverName || "Approver not assigned"} · {dateLabel(approval.approvalDate)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid min-w-0 gap-5 xl:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Review status and version history signals.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {workflow.documents.map((document) => (
                  <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3" key={document.documentId}>
                    <div className="flex gap-3">
                      <FileText aria-hidden="true" className="mt-0.5 h-4 w-4 text-accent" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{document.name}</p>
                        <p className="text-xs text-muted-foreground">v{document.version} · {document.visibility}</p>
                      </div>
                    </div>
                    <Badge tone={statusTone(document.status)}>{document.status.replaceAll("_", " ")}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Finance</CardTitle>
                <CardDescription>Invoice and payment workflow status.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Invoice</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{workflow.financial.invoiceStatus.replaceAll("_", " ")}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Payment</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{workflow.financial.paymentStatus.replaceAll("_", " ")}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Balance</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {workflow.financial.currency} {workflow.financial.balanceDue.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Timeline and audit</CardTitle>
              <CardDescription>Chronological activity, with internal events separated from client-visible updates.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {workflow.activity.map((activity) => (
                <div className="flex gap-3 rounded-md border border-border p-3" key={`${activity.title}-${activity.createdAt}`}>
                  <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 text-accent" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                      {activity.clientVisible ? <Badge tone="teal">Client visible</Badge> : <Badge tone="slate">Internal</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activity.actorName} · {dateLabel(activity.createdAt)}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{activity.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-5">
          <TransitionPanel workflow={workflow} />

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Workflow actions</CardTitle>
              <CardDescription>Open the relevant work area or advance this engagement when checks are complete.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[
                ["Manage tasks", "/admin/tasks", UserPlus, "secondary"],
                ["Assign staff", "/admin/staff", UserPlus, "secondary"],
                ["Request client action", messageHref, AlertTriangle, "secondary"],
                ["Open documents", "/admin/documents", FileText, "secondary"],
                ["Send message", messageHref, MessageSquareText, "secondary"],
                ["Advance workflow", "#advance-stage", ShieldCheck, "primary"],
              ].map(([label, href, Icon, variant]) => (
                <Link
                  className={buttonClassName({ variant: variant as "primary" | "secondary", className: "justify-start" })}
                  href={String(href)}
                  key={String(label)}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {String(label)}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>Assignments and workload warnings.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {workflow.team.map((member) => (
                <div className="rounded-md border border-border p-3" key={`${member.role}-${member.name}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{member.name}</p>
                    <Badge tone={member.workloadLevel === "overloaded" || member.workloadLevel === "high" ? "red" : "green"}>
                      {member.workloadLevel}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {member.role} · {member.department}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Completion checklist</CardTitle>
              <CardDescription>Requirements before closing and archiving.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {workflow.completionChecklist.map((item) => (
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2" key={item.label}>
                  {item.completed ? (
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Link className={buttonClassName({ variant: "secondary" })} href="/admin/workflows">
            Back to workflows
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
