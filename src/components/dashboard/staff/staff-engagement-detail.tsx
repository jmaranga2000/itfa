import Link from "next/link";
import { ArrowLeft, CheckSquare2, FileText, UsersRound } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState, staffDate, staffStatusLabel, staffStatusTone } from "@/components/dashboard/staff/staff-work-ui";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

export function StaffEngagementDetail({ workflow }: { workflow: WorkflowInstanceRecord }) {
  const openTasks = workflow.tasks.filter((task) => !["completed", "cancelled"].includes(task.status)).length;

  return (
    <div className="grid gap-5">
      <AdminPageSurface
        actions={(
          <Link className={buttonClassName({ variant: "secondary" })} href="/staff/engagements">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to engagements
          </Link>
        )}
        description={`${workflow.clientName} / ${workflow.serviceName}`}
        icon={CheckSquare2}
        summary={[
          { label: "Progress", value: `${workflow.progress.overall}%`, helper: workflow.currentStageName, icon: CheckSquare2 },
          { label: "Open tasks", value: openTasks, helper: "Still need attention", icon: CheckSquare2 },
          { label: "Documents", value: workflow.documents.length, helper: "Attached to this work", icon: FileText },
          { label: "Team", value: workflow.team.length, helper: "People involved", icon: UsersRound },
        ]}
        title={workflow.reference}
      >
        <dl className="grid gap-0 divide-y divide-border p-5">
          {[
            ["Status", staffStatusLabel(workflow.status)],
            ["Current stage", workflow.currentStageName],
            ["Responsible person", workflow.responsibleUserName || "Not assigned"],
            ["Next action", workflow.nextAction || "No next action recorded"],
            ["Due date", staffDate(workflow.dueDate)],
            ["Risk", `${staffStatusLabel(workflow.riskLevel)}${workflow.riskReason ? ` - ${workflow.riskReason}` : ""}`],
          ].map(([label, value]) => (
            <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[190px_1fr]" key={label}>
              <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
              <dd className="text-sm font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </AdminPageSurface>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Live tasks and deadlines for this engagement.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {workflow.tasks.length === 0 ? (
            <StaffEmptyState description="Tasks will appear when the workflow is prepared." title="No tasks yet" />
          ) : (
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflow.tasks.map((task) => (
                  <TableRow key={task.key}>
                    <TableCell className="font-semibold text-foreground">{task.title}</TableCell>
                    <TableCell>{task.assignedUserName || staffStatusLabel(task.assignedRole)}</TableCell>
                    <TableCell><Badge tone={staffStatusTone(task.priority)}>{task.priority}</Badge></TableCell>
                    <TableCell><Badge tone={staffStatusTone(task.status)}>{staffStatusLabel(task.status)}</Badge></TableCell>
                    <TableCell>{staffDate(task.dueDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {workflow.documents.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No documents have been added.</p>
            ) : workflow.documents.map((document) => (
              <div className="flex items-center justify-between gap-3 p-4" key={document.documentId}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{document.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Version {document.version}</p>
                </div>
                <Badge tone={staffStatusTone(document.status)}>{staffStatusLabel(document.status)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Team</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {workflow.team.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No team members have been assigned.</p>
            ) : workflow.team.map((member) => (
              <div className="p-4" key={`${member.userId}-${member.role}`}>
                <p className="text-sm font-semibold text-foreground">{member.name || "Staff member"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{staffStatusLabel(member.role)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
