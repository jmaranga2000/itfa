import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BriefcaseBusiness,
  Clock,
  FileCheck2,
  Inbox,
  ListTodo,
  ReceiptText,
  Users,
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
  DashboardAlert,
  OperationsDashboardData,
  StaffWorkload,
} from "@/features/admin/operations-dashboard-data";
import { cn } from "@/lib/utils";

const kpiIcons = {
  "Pending engagement requests": Inbox,
  "Active engagements": BriefcaseBusiness,
  "Pending KYC reviews": FileCheck2,
  "Outstanding invoices": ReceiptText,
  "Overdue tasks": ListTodo,
  "Client actions required": Users,
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function shortDateLabel(value: string) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function alertTone(severity: DashboardAlert["severity"]) {
  if (severity === "critical" || severity === "high") {
    return "red" as const;
  }

  if (severity === "medium") {
    return "gold" as const;
  }

  return "teal" as const;
}

function priorityTone(priority: string) {
  if (priority === "Critical" || priority === "High") {
    return "red" as const;
  }

  if (priority === "Medium") {
    return "gold" as const;
  }

  return "teal" as const;
}

function workloadTone(level: StaffWorkload["utilization"]) {
  if (level === "Overloaded" || level === "High") {
    return "red" as const;
  }

  if (level === "Balanced") {
    return "gold" as const;
  }

  return "green" as const;
}

function workflowTone(status: string) {
  if (status === "Connected") {
    return "green" as const;
  }

  if (status === "Ready") {
    return "teal" as const;
  }

  return "gold" as const;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-sm leading-6 text-muted-foreground">
      {message}
    </div>
  );
}

function PriorityAlerts({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3">
      {alerts.map((alert) => (
        <div
          className={cn(
            "flex flex-col justify-between gap-3 rounded-md border p-4 md:flex-row md:items-center",
            alert.severity === "critical" || alert.severity === "high"
              ? "border-danger/30 bg-danger-soft"
              : alert.severity === "medium"
                ? "border-warning/30 bg-warning-soft"
                : "border-border bg-brand-soft",
          )}
          key={alert.title}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              aria-hidden="true"
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                alert.severity === "critical" || alert.severity === "high"
                  ? "text-danger"
                  : alert.severity === "medium"
                    ? "text-warning"
                    : "text-primary",
              )}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={alertTone(alert.severity)}>{alert.severity}</Badge>
                <p className="font-semibold text-foreground">{alert.title}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {alert.count} affected record{alert.count === 1 ? "" : "s"}.
              </p>
            </div>
          </div>
          <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={alert.href}>
            {alert.action}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      ))}
    </section>
  );
}

export function AdminOperationsDashboard({ data }: { data: OperationsDashboardData }) {
  return (
    <div className="grid min-w-0 gap-4">
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="flex flex-col justify-between gap-4 border-b border-border lg:flex-row lg:items-start">
          <div>
            <CardTitle className="text-2xl">Today’s overview</CardTitle>
            <CardDescription className="mt-1">
              Start with anything urgent, then open the area that needs your attention.
            </CardDescription>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {dateLabel(data.generatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/requests">
              Requests
            </Link>
            <Link className={buttonClassName({ size: "sm" })} href="/admin/tasks">
              Review tasks
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid p-0 sm:grid-cols-2 xl:grid-cols-3">
          {data.kpis.map((kpi, index) => {
            const Icon = kpiIcons[kpi.label as keyof typeof kpiIcons] ?? Activity;

            return (
              <Link
                className={cn(
                  "flex min-w-0 items-center gap-3 border-border px-4 py-4 transition-colors hover:bg-muted/40",
                  index > 0 && "border-t sm:border-t-0",
                  index % 2 === 1 && "sm:border-l",
                  index > 1 && "sm:border-t xl:border-t-0",
                  index % 3 !== 0 && "xl:border-l",
                  index > 2 && "xl:border-t",
                )}
                href={kpi.href}
                key={kpi.label}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-primary">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <strong className="text-xl text-foreground">{kpi.value}</strong>
                    <span className="truncate text-sm font-semibold text-foreground">{kpi.label}</span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{kpi.helper}</span>
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <PriorityAlerts alerts={data.alerts} />

      <Card>
        <CardHeader>
          <CardTitle>Work requiring a decision</CardTitle>
          <CardDescription>Open the record, make the decision and move the work forward.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.actionQueue.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Client and record</TableHead>
                    <TableHead>What is needed</TableHead>
                    <TableHead>Responsible person</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.actionQueue.map((item) => (
                    <TableRow key={`${item.recordType}-${item.reference}`}>
                      <TableCell>
                        <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-foreground">{item.client}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.recordType} · {item.reference}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p>{item.issue}</p>
                        <p className="text-xs text-muted-foreground">Waiting {item.age}</p>
                      </TableCell>
                      <TableCell>{item.assignee}</TableCell>
                      <TableCell>{item.due}</TableCell>
                      <TableCell className="text-right">
                        <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={item.href}>
                          {item.action}
                          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState message="No admin decisions are pending from connected records." />
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client work progress</CardTitle>
            <CardDescription>Where current work is in the delivery process.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {data.pipeline.map((stage) => (
              <Link
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                href="/admin/active-engagements"
                key={stage.label}
              >
                <span>
                  <span className="block text-sm font-semibold text-foreground">{stage.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {stage.delayed} delayed · average {stage.averageTime}
                  </span>
                </span>
                <Badge tone={stage.delayed > 0 ? "gold" : "slate"}>{stage.count}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approvals and checks</CardTitle>
            <CardDescription>Important decisions before work can continue.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {data.workflowGates.map((gate) => (
              <Link className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0" href={gate.href} key={gate.stage}>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{gate.stage}</span>
                  <span className="text-xs text-muted-foreground">{gate.decision}</span>
                </span>
                <Badge tone={workflowTone(gate.status)}>{gate.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Staff capacity</CardTitle>
            <CardDescription>Who has room for more work and who may need help.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.staffWorkload.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned work</TableHead>
                      <TableHead>Capacity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.staffWorkload.map((member) => (
                      <TableRow key={member.name}>
                        <TableCell className="font-semibold text-foreground">
                          {member.name}
                        </TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>{member.activeEngagements} engagements</TableCell>
                        <TableCell>
                          <Badge tone={workloadTone(member.utilization)}>{member.utilization}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState message="No staff accounts are available for workload tracking." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest account and work updates.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {data.activity.length > 0 ? (
              data.activity.map((item) => (
                <Link
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  href={item.href}
                  key={`${item.resource}-${item.timestamp}`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-primary">
                    <Activity aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {item.actor} {item.action}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">{item.resource}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                    {shortDateLabel(item.timestamp)}
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState message="No recent activity records are available yet." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
