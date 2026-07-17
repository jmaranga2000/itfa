import Link from "next/link";
import { AlertTriangle, ArrowUpRight, BarChart3, Briefcase, CalendarClock } from "lucide-react";
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

function stageTone(stage: string) {
  if (stage === "Engagement Closed" || stage === "Workspace Archived") {
    return "green" as const;
  }

  if (stage === "KYC Review" || stage === "Client Review") {
    return "gold" as const;
  }

  return "teal" as const;
}

function dateLabel(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-KE", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function AdminActiveEngagements({
  activatedWorkflowId,
  workflows,
}: {
  activatedWorkflowId?: string;
  workflows: WorkflowInstanceRecord[];
}) {
  const activeWorkflows = workflows.filter((workflow) => workflow.status === "active");
  const blocked = activeWorkflows.filter((workflow) => workflow.progress.blockedItems > 0);
  const scheduled = activeWorkflows.filter((workflow) => Boolean(workflow.dueDate));
  const averageProgress = activeWorkflows.length
    ? Math.round(activeWorkflows.reduce((total, workflow) => total + workflow.progress.overall, 0) / activeWorkflows.length)
    : 0;

  return (
    <AdminPageSurface
      actions={
        <>
          <Link className={buttonClassName({ variant: "secondary" })} href="/admin/requests">
            Requests
          </Link>
          <Link className={buttonClassName()} href="/admin/tasks">
            Review tasks
          </Link>
        </>
      }
      description="See what is being delivered, who owns it, what is delayed and what is due next."
      icon={Briefcase}
      summary={[
        { label: "In progress", value: activeWorkflows.length, helper: "Current client work", icon: Briefcase },
        { label: "Needs attention", value: blocked.length, helper: "Waiting on an action", icon: AlertTriangle },
        { label: "Scheduled", value: scheduled.length, helper: "Work with a due date", icon: CalendarClock },
        { label: "Progress", value: `${averageProgress}%`, helper: "Average completion", icon: BarChart3 },
      ]}
      title="Active client work"
    >
      {activatedWorkflowId ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">
          The request is now active client work and is ready for the assigned team.
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client work</TableHead>
              <TableHead>Stage and progress</TableHead>
              <TableHead>Responsible person</TableHead>
              <TableHead>Needs attention</TableHead>
              <TableHead>Next due</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeWorkflows.map((workflow) => (
              <TableRow className={workflow.id === activatedWorkflowId ? "bg-brand-soft/40" : ""} key={workflow.id}>
                <TableCell>
                  <div className="min-w-56">
                    <p className="font-semibold text-foreground">{workflow.clientName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{workflow.serviceName}</p>
                    <p className="mt-1 font-mono text-xs text-primary">{workflow.reference}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="grid min-w-44 gap-2">
                    <Badge tone={stageTone(workflow.currentStageName)}>{workflow.currentStageName}</Badge>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-sm bg-muted">
                        <div
                          className="h-2 rounded-sm bg-accent"
                          style={{ width: `${workflow.progress.overall}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{workflow.progress.overall}%</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{workflow.responsibleUserName || "Unassigned"}</TableCell>
                <TableCell>
                  <span className={workflow.progress.blockedItems === 0 ? "text-muted-foreground" : "font-semibold text-foreground"}>
                    {workflow.progress.blockedItems ? `${workflow.progress.blockedItems} blocker(s)` : "None"}
                  </span>
                </TableCell>
                <TableCell>{dateLabel(workflow.dueDate)}</TableCell>
                <TableCell className="text-right">
                  <Link
                    className={buttonClassName({ variant: "secondary", size: "sm" })}
                    href={`/admin/workflows/${workflow.id}`}
                  >
                    Open
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {activeWorkflows.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-sm text-muted-foreground" colSpan={6}>
                  No active client work yet. Approve a request to start the first engagement.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}
