import { ArrowRight, CheckCircle2, Circle, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { transitionWorkflowStageAction } from "@/features/workflows/actions";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

function tone(status: string) {
  if (status === "completed") return "green" as const;
  if (["blocked", "overdue"].includes(status)) return "red" as const;
  if (["in_progress", "waiting_for_client", "waiting_for_approval"].includes(status)) return "gold" as const;
  return "slate" as const;
}

function label(status: string) {
  return status.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function EngagementStageProgress({
  canManage,
  returnPath,
  workflow,
}: {
  canManage: boolean;
  returnPath: string;
  workflow: WorkflowInstanceRecord;
}) {
  const currentIndex = workflow.stages.findIndex((stage) => stage.key === workflow.currentStageKey);
  const currentStage = workflow.stages[currentIndex];
  const nextStage = workflow.stages[currentIndex + 1];
  const openTasks = workflow.tasks.filter((task) =>
    task.stageKey === workflow.currentStageKey && !["completed", "cancelled"].includes(task.status),
  );
  const missingDocuments = (currentStage?.requiredDocuments ?? []).filter((requiredName) =>
    !workflow.documents.some((document) =>
      document.name.toLowerCase().includes(requiredName.toLowerCase())
      && ["approved", "final"].includes(document.status),
    ),
  );
  const pendingApprovals = workflow.approvals.filter((approval) =>
    approval.stageKey === workflow.currentStageKey
    && !["approved", "not_submitted"].includes(approval.status),
  );
  const checks = [
    { label: "Current-stage tasks", complete: openTasks.length === 0, detail: openTasks.length ? `${openTasks.length} remaining` : "Complete" },
    { label: "Required documents", complete: missingDocuments.length === 0, detail: missingDocuments.length ? missingDocuments.join(", ") : "Complete" },
    { label: "Approval decisions", complete: pendingApprovals.length === 0, detail: pendingApprovals.length ? `${pendingApprovals.length} remaining` : "Complete" },
    { label: "Blockers", complete: workflow.progress.blockedItems === 0, detail: workflow.progress.blockedItems ? `${workflow.progress.blockedItems} unresolved` : "None" },
  ];
  const ready = checks.every((check) => check.complete);

  return (
    <Card className="min-w-0 overflow-hidden shadow-none">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <CardTitle>Engagement process</CardTitle>
            <CardDescription className="mt-1">The workflow is the process map behind this active engagement. This workspace is where the team completes the work recorded against those stages.</CardDescription>
          </div>
          <Badge tone={ready ? "green" : "gold"}>{ready ? "Stage ready" : "Stage requirements open"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 p-4">
        <div className="flex min-w-0 gap-3 overflow-x-auto pb-1">
          {workflow.stages.map((stage) => {
            const complete = stage.status === "completed";
            const current = stage.key === workflow.currentStageKey;
            return (
              <div className={`min-w-44 flex-1 rounded-md border p-3 ${current ? "border-primary bg-brand-soft/35" : "border-border"}`} key={stage.key}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-muted-foreground">{String(stage.order).padStart(2, "0")}</span>
                  {complete ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className={`h-4 w-4 ${current ? "text-primary" : "text-muted-foreground"}`} />}
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{stage.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Owner: {label(stage.responsibleRole)}</p>
                <Badge className="mt-3" tone={tone(stage.status)}>{current ? `Current: ${label(stage.status)}` : label(stage.status)}</Badge>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <p className="text-sm font-semibold text-foreground">Requirements for {currentStage?.name ?? "the current stage"}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {checks.map((check) => <div className="flex items-start gap-3 rounded-md border border-border p-3" key={check.label}>{check.complete ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />}<div><p className="text-sm font-semibold text-foreground">{check.label}</p><p className="mt-1 text-xs text-muted-foreground">{check.detail}</p></div></div>)}
            </div>
          </div>

          <div className="rounded-md border border-border p-4">
            {nextStage ? (
              <>
                <p className="text-xs font-semibold text-muted-foreground">NEXT PROCESS STAGE</p>
                <p className="mt-1 font-semibold text-foreground">{nextStage.name}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{ready ? "All visible checks are complete. The administrator can advance the engagement." : "Complete the open requirements before advancing."}</p>
                {canManage ? <form action={transitionWorkflowStageAction} className="mt-4 grid gap-3"><input name="workflowId" type="hidden" value={workflow.id} /><input name="nextStageKey" type="hidden" value={nextStage.key} /><input name="returnPath" type="hidden" value={returnPath} /><Textarea className="min-h-20" name="reason" placeholder="Optional transition note" /><label className="flex items-center gap-2 text-xs text-muted-foreground"><input className="h-4 w-4" name="override" type="checkbox" />Use administrator override and record the reason</label><SubmitButton pendingText="Checking requirements...">Advance to {nextStage.name}<ArrowRight className="h-4 w-4" /></SubmitButton></form> : <div className="mt-4 flex items-center gap-2 rounded-md bg-muted/30 p-3 text-sm text-muted-foreground"><LockKeyhole className="h-4 w-4" />Only an administrator can advance the process stage.</div>}
              </>
            ) : <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-success" /><div><p className="font-semibold text-foreground">Final process stage</p><p className="mt-1 text-sm text-muted-foreground">Use the Completion section to confirm closure requirements and archive the engagement.</p></div></div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
