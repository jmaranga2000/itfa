import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Link2 } from "lucide-react";
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

export function WorkflowTasks({ tasks }: { tasks: WorkflowTaskListItem[] }) {
  const overdue = tasks.filter((task) => task.status === "overdue");
  const blocked = tasks.filter((task) => task.status === "blocked");
  const waiting = tasks.filter((task) => task.status.startsWith("waiting"));

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
          Tasks
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          See what needs doing, who is responsible and which tasks are delayed or blocked.
        </p>
      </section>

      <section className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
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

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Task queue</CardTitle>
            <CardDescription>Compact table for assignment, dependency and status review.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="hidden">
          <Card>
            <CardHeader>
              <CardTitle>Overdue task cards</CardTitle>
              <CardDescription>Clear warnings for delayed work.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {overdue.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                  All current tasks are within their deadlines.
                </div>
              ) : (
                overdue.map((task) => (
                  <Link className="rounded-md border border-red-200 bg-red-50 p-3 text-red-950" href={task.href} key={task.key}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4" />
                      <div>
                        <p className="text-sm font-semibold">{task.title}</p>
                        <p className="mt-1 text-xs">
                          {task.engagement} · {daysOverdue(task.dueDate)} days overdue
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task actions</CardTitle>
              <CardDescription>Common commands exposed from task records.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[
                ["Start task", Clock],
                ["Request client action", AlertTriangle],
                ["Submit for approval", CheckCircle2],
                ["Complete", CheckCircle2],
              ].map(([label, Icon]) => (
                <button className={buttonClassName({ variant: label === "Complete" ? "primary" : "secondary", className: "justify-start" })} key={String(label)} type="button">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {String(label)}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
