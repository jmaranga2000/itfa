import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Clock,
  Download,
  FileCheck2,
  Inbox,
  ListTodo,
  MessageSquareText,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  SlidersHorizontalIcon,
  UserCheck,
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
  DashboardKpi,
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

function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const Icon = kpiIcons[kpi.label as keyof typeof kpiIcons] ?? Activity;

  return (
    <Link href={kpi.href}>
      <Card className="h-full transition-colors hover:border-primary">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardDescription>{kpi.label}</CardDescription>
            <CardTitle className="mt-2 text-3xl font-bold">{kpi.value}</CardTitle>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-soft text-brand-deep">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{kpi.helper}</p>
          <p className="mt-3 text-xs font-semibold text-primary">{kpi.trend}</p>
        </CardContent>
      </Card>
    </Link>
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
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
          <div>
            <Badge tone="teal">Admin overview</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              What needs your attention today
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              See requests, client work, reviews, staff tasks and payments from one clear overview.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-md border border-border px-2.5 py-1">
                {dateLabel(data.generatedAt)}
              </span>
              <span className="rounded-md border border-border px-2.5 py-1">
                IFTA Consulting
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={buttonClassName({ variant: "secondary", size: "sm" })} type="button">
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Refresh
            </button>
            <button className={buttonClassName({ variant: "secondary", size: "sm" })} type="button">
              <Download aria-hidden="true" className="h-4 w-4" />
              Download report
            </button>
          </div>
        </div>
      </section>

      <PriorityAlerts alerts={data.alerts} />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      <section className="grid gap-5 2xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <CardTitle>Engagement progress</CardTitle>
              <CardDescription>
                Where current client work sits from request to completion.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 lg:grid-cols-3">
              {data.pipeline.map((stage) => (
                <Link
                  className="rounded-md border border-border p-3 transition-colors hover:border-accent"
                  href="/admin/active-engagements"
                  key={stage.label}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{stage.label}</p>
                    <span className="font-mono text-sm font-bold text-primary">{stage.count}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: stage.count === 0 ? "0%" : `${Math.min(100, stage.count * 12)}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span>Avg {stage.averageTime}</span>
                    <span>{stage.delayed} delayed</span>
                    <span>{stage.conversion}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approvals and checks</CardTitle>
            <CardDescription>Important decisions that may need an administrator.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.workflowGates.map((gate) => (
              <Link
                className="rounded-md border border-border px-3 py-3 transition-colors hover:border-accent"
                href={gate.href}
                key={gate.stage}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={workflowTone(gate.status)}>{gate.status}</Badge>
                      <p className="text-sm font-semibold text-foreground">{gate.stage}</p>
                    </div>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">{gate.owner}</p>
                  </div>
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{gate.evidence}</p>
                <p className="mt-2 text-xs font-semibold text-primary">{gate.decision}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <CardTitle>Action required</CardTitle>
            <CardDescription>
              Prioritized decision queue with module, assignee, age and next actions.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Priority", "Module", "Assignee", "Age"].map((filter) => (
              <button
                className={buttonClassName({ variant: "secondary", size: "sm" })}
                key={filter}
                type="button"
              >
                {filter}
              </button>
            ))}
            <button className={buttonClassName({ variant: "secondary", size: "sm" })} type="button">
              Bulk assign
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {data.actionQueue.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Record</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Primary action</TableHead>
                    <TableHead>Secondary actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.actionQueue.map((item) => (
                    <TableRow key={`${item.recordType}-${item.reference}`}>
                      <TableCell>
                        <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-foreground">{item.recordType}</p>
                        <p className="text-xs text-muted-foreground">{item.reference}</p>
                      </TableCell>
                      <TableCell>{item.client}</TableCell>
                      <TableCell>{item.issue}</TableCell>
                      <TableCell>{item.age}</TableCell>
                      <TableCell>{item.assignee}</TableCell>
                      <TableCell>{item.due}</TableCell>
                      <TableCell>
                        <Link className="text-sm font-semibold text-primary" href={item.href}>
                          {item.action}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-56 flex-wrap gap-1.5">
                          {item.secondaryActions.map((action) => (
                            <span
                              className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-semibold text-foreground"
                              key={action}
                            >
                              {action}
                            </span>
                          ))}
                        </div>
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

      <section className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent engagement requests</CardTitle>
            <CardDescription>Submitted requests awaiting review.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState message="No engagement request records are connected yet." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KYC review queue</CardTitle>
            <CardDescription>Submissions, risk classification and reviewer action.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState message="No KYC submissions are connected yet." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming deadlines</CardTitle>
            <CardDescription>Tasks, milestones, invoices and client response dates.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.deadlines.length > 0 ? (
              <div className="grid gap-3">
                {data.deadlines.map((deadline) => (
                  <Link
                    className="rounded-md border border-border px-3 py-3 transition-colors hover:border-accent"
                    href={deadline.href}
                    key={`${deadline.type}-${deadline.engagement}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={priorityTone(deadline.urgency)}>{deadline.urgency}</Badge>
                          <p className="text-sm font-semibold text-foreground">{deadline.type}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {deadline.engagement} - {deadline.client}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-primary">{deadline.action}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>{deadline.owner}</span>
                      <span>{deadline.due}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState message="No deadline-producing task, invoice or workflow records are connected yet." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Engagement performance</CardTitle>
            <CardDescription>
              Completion rate, cycle time, on-time delivery and risk indicators.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.performance.map((metric) => (
              <div className="rounded-md border border-border px-3 py-3" key={metric.label}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{metric.helper}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard customization</CardTitle>
            <CardDescription>Personal dashboard controls for authorized widgets.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Reorder widgets",
              "Hide nonessential widgets",
              "Save default date range",
              "Restore operations layout",
            ].map((item) => (
              <button
                className="flex min-h-11 items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-foreground hover:bg-muted"
                key={item}
                type="button"
              >
                {item}
                <SlidersHorizontalIcon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 2xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Staff workload</CardTitle>
            <CardDescription>Assignments and capacity indicators from staff records.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.staffWorkload.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Overdue</TableHead>
                      <TableHead>This week</TableHead>
                      <TableHead>Reviews</TableHead>
                      <TableHead>Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.staffWorkload.map((member) => (
                      <TableRow key={member.name}>
                        <TableCell className="font-semibold text-foreground">
                          {member.name}
                        </TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>{member.activeEngagements}</TableCell>
                        <TableCell>{member.overdueTasks}</TableCell>
                        <TableCell>{member.dueThisWeek}</TableCell>
                        <TableCell>{member.pendingReviews}</TableCell>
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

        {data.hasFinanceAccess ? (
          <Card>
            <CardHeader>
              <CardTitle>Finance overview</CardTitle>
              <CardDescription>Invoices, payments and reconciliation summary.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                ["Total invoiced", "0"],
                ["Total received", "0"],
                ["Outstanding amount", "0"],
                ["Overdue amount", "0"],
                ["Unreconciled payments", "0"],
              ].map(([label, value]) => (
                <div
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  key={label}
                >
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="font-mono text-sm font-bold text-muted-foreground">{value}</span>
                </div>
              ))}
              <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CircleDollarSign aria-hidden="true" className="h-4 w-4 text-primary" />
                  Finance data model pending
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Revenue trends, aging buckets and payment breakdowns will populate from invoice
                  and payment records.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>System activity visible to this admin role.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.activity.length > 0 ? (
              <div className="grid gap-3">
                {data.activity.map((item) => (
                  <Link
                    className="flex items-start gap-3 rounded-md border border-border px-3 py-3 transition-colors hover:border-accent"
                    href={item.href}
                    key={`${item.resource}-${item.timestamp}`}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-primary">
                      <Activity aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {item.actor} {item.action}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {item.resource}
                      </span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                        {shortDateLabel(item.timestamp)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState message="No recent activity records are available yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational readiness</CardTitle>
            <CardDescription>Phase 2 dashboard surfaces and data connections.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              {
                icon: UserCheck,
                label: "Client and staff directories",
                value: `${data.clients.length} clients - ${data.staff.length} staff`,
              },
              {
                icon: ShieldCheck,
                label: "Permission-aware finance visibility",
                value: data.hasFinanceAccess ? "Enabled" : "Hidden for this user",
              },
              {
                icon: CalendarDays,
                label: "Deadline widgets",
                value: "Waiting for task and workflow models",
              },
              {
                icon: MessageSquareText,
                label: "Messages and escalations",
                value: "Waiting for communication models",
              },
            ].map((item) => (
              <div className="flex items-start gap-3 rounded-md border border-border px-3 py-3" key={item.label}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-primary">
                  <item.icon aria-hidden="true" className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                  <span className="block text-sm leading-6 text-muted-foreground">{item.value}</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
