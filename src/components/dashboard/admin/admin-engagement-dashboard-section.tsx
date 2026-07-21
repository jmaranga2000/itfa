import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MessageSquareWarning,
  ScanSearch,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getEngagementHealth,
  type EngagementDashboardEnhancements,
} from "@/repositories/engagement-execution-repository";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

function member(workflow: WorkflowInstanceRecord, role: string) {
  return workflow.team.find((item) => item.role === role)?.name ?? "Not assigned";
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function statusTone(value: string) {
  if (["active", "completed", "paid"].includes(value)) return "green" as const;
  if (["waiting_for_approval", "waiting_for_client", "overdue"].includes(value)) return "gold" as const;
  return "teal" as const;
}

export function AdminEngagementDashboardSection({
  enhancements,
  workflows,
}: {
  enhancements: EngagementDashboardEnhancements;
  workflows: WorkflowInstanceRecord[];
}) {
  const active = workflows.filter((workflow) => workflow.status === "active");
  const health = active.map((workflow) => ({ workflow, health: getEngagementHealth(workflow) }));
  const awaitingReview = health.filter((item) => item.health.status === "waiting_for_review").length;
  const awaitingClient = health.filter((item) => item.health.status === "waiting_for_client").length;
  const overdue = health.filter((item) => item.health.status === "overdue").length;
  const recent = [...workflows]
    .filter((workflow) => ["active", "completed"].includes(workflow.status))
    .sort((left, right) =>
      new Date(right.lastActivityAt ?? right.activatedAt ?? right.startDate ?? 0).getTime()
      - new Date(left.lastActivityAt ?? left.activatedAt ?? left.startDate ?? 0).getTime(),
    )
    .slice(0, 8);
  const metrics = [
    { label: "Active engagements", value: active.length, icon: BriefcaseBusiness, href: "/admin/active-engagements" },
    { label: "Deliverables awaiting approval", value: enhancements.deliverablesAwaitingApproval, icon: ScanSearch, href: "/admin/active-engagements?health=waiting_for_review" },
    { label: "Deliverables released today", value: enhancements.deliverablesReleasedToday, icon: CheckCircle2, href: "/admin/documents?kind=final_deliverable&status=released" },
    { label: "Waiting for client", value: awaitingClient, icon: MessageSquareWarning, href: "/admin/active-engagements?health=waiting_for_client" },
    { label: "Waiting for review", value: awaitingReview, icon: Clock3, href: "/admin/active-engagements?health=waiting_for_review" },
    { label: "Overdue engagements", value: overdue, icon: CircleDollarSign, href: "/admin/active-engagements?health=overdue" },
  ];

  return (
    <Card className="min-w-0 overflow-hidden shadow-none">
      <CardHeader className="flex flex-col justify-between gap-3 border-b border-border md:flex-row md:items-start">
        <div>
          <CardTitle>Engagement delivery</CardTitle>
          <CardDescription className="mt-1">Current work, decisions, client actions, and finance status.</CardDescription>
        </div>
        <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/active-engagements">View all engagements</Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid border-b border-border sm:grid-cols-2 xl:grid-cols-6">
          {metrics.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${index > 0 ? "border-t border-border sm:border-l xl:border-t-0" : ""}`} href={item.href} key={item.label}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-soft text-primary"><Icon aria-hidden="true" className="h-4 w-4" /></span>
                <div className="min-w-0"><p className="text-xl font-bold text-foreground">{item.value}</p><p className="text-xs font-medium text-muted-foreground">{item.label}</p></div>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {recent.map((workflow) => (
            <article className="rounded-md border border-border p-4" key={workflow.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="font-mono text-xs font-semibold text-primary">{workflow.reference}</p><p className="mt-1 truncate font-semibold text-foreground">{workflow.clientName}</p><p className="mt-1 text-sm text-muted-foreground">{workflow.serviceName}</p></div>
                <Badge tone={getEngagementHealth(workflow).tone}>{getEngagementHealth(workflow).label}</Badge>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Current stage</dt><dd className="mt-1 font-semibold text-foreground">{workflow.currentStageName}</dd></div><div><dt className="text-muted-foreground">Progress</dt><dd className="mt-1 font-semibold text-foreground">{workflow.progress.overall}%</dd></div></dl>
              <Link className={buttonClassName({ className: "mt-3 w-full", size: "sm" })} href={`/admin/active-engagements/${workflow.id}`}>Open workspace<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Client</TableHead><TableHead>Service</TableHead><TableHead>Consultant</TableHead><TableHead>Reviewer</TableHead><TableHead>Finance officer</TableHead><TableHead>Current stage</TableHead><TableHead>Progress</TableHead><TableHead>Health</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {recent.map((workflow) => <TableRow key={workflow.id}><TableCell className="font-mono text-xs font-semibold text-primary">{workflow.reference}</TableCell><TableCell className="font-semibold text-foreground">{workflow.clientName}</TableCell><TableCell><span className="block max-w-44 truncate">{workflow.serviceName}</span></TableCell><TableCell>{member(workflow, "consultant")}</TableCell><TableCell>{member(workflow, "reviewer")}</TableCell><TableCell>{member(workflow, "finance_officer")}</TableCell><TableCell>{workflow.currentStageName}</TableCell><TableCell>{workflow.progress.overall}%</TableCell><TableCell><Badge tone={getEngagementHealth(workflow).tone}>{getEngagementHealth(workflow).label}</Badge></TableCell><TableCell><Badge tone={statusTone(workflow.status)}>{statusLabel(workflow.status)}</Badge></TableCell><TableCell className="text-right"><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/admin/active-engagements/${workflow.id}`}>Open workspace<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></TableCell></TableRow>)}
              {recent.length === 0 ? <TableRow><TableCell className="py-8 text-center text-sm text-muted-foreground" colSpan={11}>No active or completed engagements yet.</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
