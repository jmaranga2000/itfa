import Link from "next/link";
import { ArrowLeft, ArrowRight, Link2 } from "lucide-react";
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
import type { WorkflowPriority, WorkflowTaskStatus } from "@/features/workflows/types";

type WorkflowTaskListItem = {
  workflowId: string;
  engagement: string;
  client: string;
  service: string;
  href: string;
  key: string;
  title: string;
  assignedUserName: string;
  assignedRole: string;
  priority: WorkflowPriority;
  status: WorkflowTaskStatus;
  dueDate: string | null;
  dependencies: string[];
  clientActionRequired: boolean;
  blockerReason: string | null;
};

function dateLabel(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
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

function statusTone(status: WorkflowTaskStatus) {
  if (status === "completed") {
    return "green" as const;
  }

  if (status === "blocked" || status === "overdue") {
    return "red" as const;
  }

  if (status.startsWith("waiting")) {
    return "gold" as const;
  }

  return "slate" as const;
}

function daysOverdue(value: string | null) {
  if (!value) {
    return 0;
  }

  return Math.max(0, Math.ceil((Date.now() - new Date(value).getTime()) / 86_400_000));
}

export function WorkflowTasks({
  backHref,
  backLabel,
  tasks,
}: {
  backHref: string;
  backLabel: string;
  tasks: WorkflowTaskListItem[];
}) {
  const overdue = tasks.filter((task) => task.status === "overdue");
  const blocked = tasks.filter((task) => task.status === "blocked");
  const waiting = tasks.filter((task) => task.status.startsWith("waiting"));

  return (
    <div className="grid w-full min-w-0 max-w-full gap-5 overflow-x-hidden">
      <section className="flex min-w-0 flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-normal text-foreground">Tasks</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            See what needs doing, who is responsible and which tasks are delayed or blocked.
          </p>
        </div>
        <Link className={buttonClassName({ variant: "secondary", className: "shrink-0" })} href={backHref}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {backLabel}
        </Link>
      </section>

      <section className="grid min-w-0 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Open tasks", tasks.filter((task) => !["completed", "cancelled"].includes(task.status)).length],
          ["Overdue", overdue.length],
          ["Blocked", blocked.length],
          ["Waiting", waiting.length],
        ].map(([label, value]) => (
          <Card className="rounded-none border-0 shadow-none" key={label}>
            <CardHeader className="p-4">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl font-bold">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="min-w-0 max-w-full overflow-hidden">
        <Card className="w-full min-w-0 max-w-full overflow-hidden">
          <CardHeader>
            <CardTitle>Task queue</CardTitle>
            <CardDescription>Your assigned work, due dates and next actions.</CardDescription>
          </CardHeader>
          <CardContent className="w-full min-w-0 max-w-full p-0">
            {tasks.length === 0 ? (
              <div className="border-t border-border p-5 text-sm text-muted-foreground">
                No tasks are assigned to you right now.
              </div>
            ) : (
              <div className="divide-y divide-border md:hidden">
                {tasks.map((task) => (
                  <article className="min-w-0 p-4" key={`${task.workflowId}-${task.key}`}>
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link className="break-words font-semibold text-accent hover:underline" href={task.href}>
                          {task.title}
                        </Link>
                        <p className="mt-1 break-words text-xs text-muted-foreground">
                          {task.client} / {task.engagement}
                        </p>
                      </div>
                      <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                    </div>

                    <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">Status</dt>
                        <dd className="mt-1"><Badge tone={statusTone(task.status)}>{task.status.replaceAll("_", " ")}</Badge></dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">Due</dt>
                        <dd className="mt-1 font-medium text-foreground">{dateLabel(task.dueDate)}</dd>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <dt className="text-xs text-muted-foreground">Responsible person</dt>
                        <dd className="mt-1 break-words font-medium text-foreground">
                          {task.assignedUserName || task.assignedRole.replaceAll("_", " ")}
                        </dd>
                      </div>
                    </dl>

                    {task.dependencies.length > 0 || task.clientActionRequired || task.status === "overdue" ? (
                      <div className="mt-4 flex min-w-0 flex-wrap gap-1.5">
                        {task.dependencies.length > 0 ? <Badge tone="slate"><Link2 aria-hidden="true" className="mr-1 h-3 w-3" />{task.dependencies.length} dependencies</Badge> : null}
                        {task.clientActionRequired ? <Badge tone="teal">Client action</Badge> : null}
                        {task.status === "overdue" ? <Badge tone="red">{daysOverdue(task.dueDate)}d overdue</Badge> : null}
                      </div>
                    ) : null}

                    <Link className={buttonClassName({ variant: "secondary", size: "sm", className: "mt-4 w-full justify-center" })} href={task.href}>
                      Continue work
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </article>
                ))}
              </div>
            )}

            {tasks.length > 0 ? (
              <div className="hidden w-full max-w-full overflow-x-auto overscroll-x-contain md:block [scrollbar-gutter:stable]">
                <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Signals</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={`${task.workflowId}-${task.key}`}>
                    <TableCell>
                      <Link className="font-semibold text-accent hover:underline" href={task.href}>
                        {task.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">{task.client}</p>
                    </TableCell>
                    <TableCell>{task.engagement}</TableCell>
                    <TableCell>{task.assignedUserName || task.assignedRole}</TableCell>
                    <TableCell>
                      <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge tone={statusTone(task.status)}>{task.status.replaceAll("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{dateLabel(task.dueDate)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {task.dependencies.length > 0 ? (
                          <Badge tone="slate">
                            <Link2 aria-hidden="true" className="mr-1 h-3 w-3" />
                            {task.dependencies.length} dependencies
                          </Badge>
                        ) : null}
                        {task.clientActionRequired ? <Badge tone="teal">Client action</Badge> : null}
                        {task.status === "overdue" ? (
                          <Badge tone="red">{daysOverdue(task.dueDate)}d overdue</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={task.href}>
                        Continue work
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
                </Table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
