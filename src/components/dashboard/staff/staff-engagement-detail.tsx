import Link from "next/link";
import { ArrowLeft, CheckSquare2, FileText, ListTodo, UsersRound } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { EngagementWorkspace } from "@/components/dashboard/engagements/engagement-workspace";
import { staffDate, staffStatusLabel } from "@/components/dashboard/staff/staff-work-ui";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EngagementDocumentRecord } from "@/repositories/engagement-workspace-repository";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

export function StaffEngagementDetail({
  documents,
  error,
  notice,
  workflow,
}: {
  documents: EngagementDocumentRecord[];
  error?: string;
  notice?: string;
  workflow: WorkflowInstanceRecord;
}) {
  const openTasks = workflow.tasks.filter((task) => !["completed", "cancelled"].includes(task.status)).length;

  return (
    <div className="grid min-w-0 gap-5">
      <AdminPageSurface
        actions={(
          <>
            <Link className={buttonClassName({ variant: "secondary" })} href="/staff/engagements"><ArrowLeft className="h-4 w-4" />Back to engagements</Link>
            <Link className={buttonClassName({ variant: "secondary" })} href={`/staff/tasks?returnTo=${encodeURIComponent(`/staff/engagements/${workflow.id}`)}`}><ListTodo className="h-4 w-4" />Open task queue</Link>
          </>
        )}
        description={`${workflow.clientName} / ${workflow.serviceName}`}
        icon={CheckSquare2}
        summary={[
          { label: "Progress", value: `${workflow.progress.overall}%`, helper: workflow.currentStageName, icon: CheckSquare2 },
          { label: "Open tasks", value: openTasks, helper: "Still need attention", icon: ListTodo },
          { label: "Documents", value: documents.length, helper: "Exchanged files", icon: FileText },
          { label: "Team", value: workflow.team.length, helper: "People involved", icon: UsersRound },
        ]}
        title={workflow.reference}
      >
        <dl className="grid divide-y divide-border p-5 sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
          {[
            ["Status", staffStatusLabel(workflow.status)],
            ["Current stage", workflow.currentStageName],
            ["Responsible person", workflow.responsibleUserName || "Not assigned"],
            ["Next action", workflow.nextAction || "No next action recorded"],
            ["Due date", staffDate(workflow.dueDate)],
            ["Risk", `${staffStatusLabel(workflow.riskLevel)}${workflow.riskReason ? ` - ${workflow.riskReason}` : ""}`],
          ].map(([label, value]) => <div className="grid gap-1 border-b border-border py-3 sm:grid-cols-[150px_1fr]" key={label}><dt className="text-sm font-medium text-muted-foreground">{label}</dt><dd className="text-sm font-semibold text-foreground">{value}</dd></div>)}
        </dl>
      </AdminPageSurface>

      <EngagementWorkspace documents={documents} error={error} notice={notice} portal="staff" workflow={workflow} />

      <Card>
        <CardHeader><CardTitle>Engagement team</CardTitle></CardHeader>
        <CardContent className="grid gap-px overflow-hidden rounded-md border border-border bg-border p-0 sm:grid-cols-2 lg:grid-cols-3">
          {workflow.team.length ? workflow.team.map((member) => <div className="bg-card p-4" key={`${member.userId}-${member.role}`}><p className="font-semibold text-foreground">{member.name || "Staff member"}</p><p className="mt-1 text-sm text-muted-foreground">{staffStatusLabel(member.role)} / {member.department}</p></div>) : <p className="bg-card p-5 text-sm text-muted-foreground">No team members have been assigned.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
