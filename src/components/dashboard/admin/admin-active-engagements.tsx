import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CalendarCheck2, UsersRound } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

function dateLabel(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-KE", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function memberName(workflow: WorkflowInstanceRecord, role: string) {
  return workflow.team.find((member) => member.role === role)?.name ?? "Not assigned";
}

function hasCompleteTeam(workflow: WorkflowInstanceRecord) {
  return ["consultant", "reviewer", "finance_officer"].every((role) =>
    workflow.team.some((member) => member.role === role && member.userId),
  );
}

function startOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay() || 7;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - day + 1);
  return start.getTime();
}

export function AdminActiveEngagements({
  activatedWorkflowId,
  workflows,
}: {
  activatedWorkflowId?: string;
  workflows: WorkflowInstanceRecord[];
}) {
  const activeEngagements = workflows.filter((workflow) => workflow.status === "active");
  const awaitingTeam = activeEngagements.filter((workflow) => !hasCompleteTeam(workflow));
  const weekStart = startOfCurrentWeek();
  const assignedThisWeek = activeEngagements.filter((workflow) =>
    workflow.teamAssignedAt ? new Date(workflow.teamAssignedAt).getTime() >= weekStart : false,
  );

  return (
    <AdminPageSurface
      actions={
        <Link className={buttonClassName({ variant: "secondary" })} href="/admin/requests">
          View requests
        </Link>
      }
      description="Open active client work, complete team assignment and follow delivery progress."
      icon={BriefcaseBusiness}
      summary={[
        { label: "Active engagements", value: activeEngagements.length, helper: "Client work underway", icon: BriefcaseBusiness },
        { label: "Awaiting team", value: awaitingTeam.length, helper: "Needs staff assignment", icon: UsersRound },
        { label: "Assigned this week", value: assignedThisWeek.length, helper: "Teams confirmed since Monday", icon: CalendarCheck2 },
      ]}
      title="Active engagements"
    >
      {activatedWorkflowId ? (
        <div className="border-b border-success/30 bg-success-soft px-5 py-3 text-sm font-semibold text-success">
          The signed engagement is active. Assign its delivery team to begin work.
        </div>
      ) : null}

      <div className="grid gap-3 p-4 md:hidden">
        {activeEngagements.map((workflow) => (
          <article className="rounded-md border border-border bg-card p-4" key={workflow.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold text-primary">{workflow.reference}</p>
                <h2 className="mt-1 text-base font-semibold text-foreground">{workflow.clientName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{workflow.serviceName}</p>
              </div>
              <Badge tone={hasCompleteTeam(workflow) ? "green" : "gold"}>
                {hasCompleteTeam(workflow) ? "Active" : "Assign team"}
              </Badge>
            </div>
            <dl className="mt-4 grid gap-3 border-y border-border py-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Consultant</dt><dd className="text-right font-medium">{memberName(workflow, "consultant")}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Reviewer</dt><dd className="text-right font-medium">{memberName(workflow, "reviewer")}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Finance officer</dt><dd className="text-right font-medium">{memberName(workflow, "finance_officer")}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Activated</dt><dd className="text-right font-medium">{dateLabel(workflow.activatedAt ?? workflow.startDate)}</dd></div>
            </dl>
            <Link className={buttonClassName({ className: "mt-4 w-full", size: "sm" })} href={`/admin/active-engagements/${workflow.id}`}>
              Open engagement
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Engagement reference</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Lead consultant</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Finance officer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date activated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeEngagements.map((workflow) => (
              <TableRow className={workflow.id === activatedWorkflowId ? "bg-brand-soft/40" : ""} key={workflow.id}>
                <TableCell className="font-mono text-xs font-semibold text-primary">{workflow.reference}</TableCell>
                <TableCell className="font-semibold text-foreground">{workflow.clientName}</TableCell>
                <TableCell><span className="block max-w-52 truncate">{workflow.serviceName}</span></TableCell>
                <TableCell>{memberName(workflow, "consultant")}</TableCell>
                <TableCell>{memberName(workflow, "reviewer")}</TableCell>
                <TableCell>{memberName(workflow, "finance_officer")}</TableCell>
                <TableCell>
                  <Badge tone={hasCompleteTeam(workflow) ? "green" : "gold"}>
                    {hasCompleteTeam(workflow) ? "Active" : "Awaiting team"}
                  </Badge>
                </TableCell>
                <TableCell>{dateLabel(workflow.activatedAt ?? workflow.startDate)}</TableCell>
                <TableCell className="text-right">
                  <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/admin/active-engagements/${workflow.id}`}>
                    Open engagement
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {activeEngagements.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-sm text-muted-foreground" colSpan={9}>
                  Active engagements will appear here automatically after a client signs the engagement letter.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}
