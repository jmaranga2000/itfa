import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CirclePause, ClipboardList } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState, staffDate, staffStatusLabel, staffStatusTone } from "@/components/dashboard/staff/staff-work-ui";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { StaffAssignedRequest } from "@/repositories/staff-work-repository";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

export function StaffEngagements({
  workflows,
  requests,
}: {
  workflows: WorkflowInstanceRecord[];
  requests: StaffAssignedRequest[];
}) {
  const active = workflows.filter((workflow) => workflow.status === "active").length;
  const paused = workflows.filter((workflow) => workflow.status === "on_hold").length;

  return (
    <AdminPageSurface
      description="Open your assigned client work, see what comes next and follow deadlines."
      icon={BriefcaseBusiness}
      summary={[
        { label: "Active", value: active, helper: "Work currently moving", icon: BriefcaseBusiness },
        { label: "On hold", value: paused, helper: "Waiting for a resolution", icon: CirclePause },
        { label: "Assigned requests", value: requests.length, helper: "Waiting to become engagements", icon: ClipboardList },
      ]}
      title="My engagements"
    >
      {workflows.length === 0 && requests.length === 0 ? (
        <StaffEmptyState
          description="Assigned requests and engagements will appear here automatically."
          title="No work assigned yet"
        />
      ) : (
        <div className="divide-y divide-border">
          {workflows.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[880px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Current stage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <p className="font-semibold text-foreground">{workflow.reference}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{workflow.serviceName}</p>
                      </TableCell>
                      <TableCell>{workflow.clientName}</TableCell>
                      <TableCell>{workflow.currentStageName}</TableCell>
                      <TableCell><Badge tone={staffStatusTone(workflow.status)}>{staffStatusLabel(workflow.status)}</Badge></TableCell>
                      <TableCell>{staffDate(workflow.dueDate)}</TableCell>
                      <TableCell>{workflow.progress.overall}%</TableCell>
                      <TableCell className="text-right">
                        <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/engagements/${workflow.id}`}>
                          Open
                          <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {requests.length > 0 ? (
            <section className="p-5">
              <h2 className="font-semibold text-foreground">Assigned requests</h2>
              <p className="mt-1 text-sm text-muted-foreground">These have been assigned to you but are not active engagements yet.</p>
              <div className="mt-4 grid gap-3">
                {requests.map((request) => (
                  <div className="flex flex-col justify-between gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center" key={request.id}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{request.clientName}</p>
                        <Badge tone={staffStatusTone(request.status)}>{staffStatusLabel(request.status)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{request.reference} · {request.serviceName}</p>
                      <p className="mt-2 text-sm text-foreground">Next: {request.nextAction}</p>
                    </div>
                    <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/clients/${encodeURIComponent(`request-${request.id}`)}`}>
                      Client details
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </AdminPageSurface>
  );
}
