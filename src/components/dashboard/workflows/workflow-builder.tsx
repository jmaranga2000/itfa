import { CheckCircle2, ChevronDown, Clock3, ListChecks, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WorkflowTemplateRecord } from "@/repositories/workflow-repository";

function statusTone(status: string) {
  if (status === "published") return "green" as const;
  if (status === "review") return "gold" as const;
  return "slate" as const;
}

function statusLabel(status: string) {
  if (status === "published") return "Ready to use";
  if (status === "review") return "Awaiting approval";
  return "Draft";
}

function roleLabel(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function WorkflowBuilder({ templates }: { templates: WorkflowTemplateRecord[] }) {
  return (
    <div className="grid min-w-0 gap-5">
      <section className="flex min-w-0 flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><Badge tone="teal">Work processes</Badge><Badge tone="slate">{templates.length} templates</Badge></div>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Work process templates</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Standard stages and responsibilities applied when a new client engagement begins.
          </p>
        </div>
        <Workflow aria-hidden="true" className="h-8 w-8 shrink-0 text-primary" />
      </section>

      <div className="grid min-w-0 gap-4">
        {templates.map((template, templateIndex) => (
          <details className="group min-w-0 overflow-hidden rounded-md border border-border bg-card" key={template.id} open={templateIndex === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><Badge tone={statusTone(template.status)}>{statusLabel(template.status)}</Badge><span className="text-xs font-semibold text-muted-foreground">Revision {template.version}</span></div>
                <h2 className="mt-3 break-words text-lg font-bold text-foreground">{template.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{template.stages.length} stages from setup to completion</p>
              </div>
              <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>

            <ol className="grid min-w-0 gap-3 border-t border-border p-4 sm:p-5">
              {template.stages.map((stage, index) => (
                <li className="grid min-w-0 gap-4 rounded-md border border-border p-4 lg:grid-cols-[3rem_minmax(0,1fr)_minmax(15rem,0.55fr)]" key={stage.key}>
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-soft font-mono text-sm font-bold text-brand-deep">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-bold text-foreground">{stage.name}</h3>{stage.approvalRequired ? <Badge tone="gold">Approval needed</Badge> : null}</div>
                    <p className="mt-1 break-words text-sm text-muted-foreground">Client sees: {stage.clientTitle}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Target: {stage.expectedDurationDays} days</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Responsible: {roleLabel(stage.responsibleRole)}</span></div>
                  </div>
                  <div className="min-w-0 rounded-md bg-muted/35 p-3">
                    <p className="flex items-center gap-2 text-xs font-bold text-foreground"><ListChecks className="h-4 w-4 text-primary" />Work in this stage</p>
                    <ul className="mt-2 grid gap-2">
                      {stage.tasks.map((task) => <li className="break-words text-sm text-muted-foreground" key={task.key}>{task.title}</li>)}
                      {stage.tasks.length === 0 ? <li className="text-sm text-muted-foreground">No standard tasks</li> : null}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        ))}

        {templates.length === 0 ? (
          <section className="rounded-md border border-dashed border-border bg-card p-10 text-center">
            <p className="font-semibold text-foreground">No work process templates</p>
            <p className="mt-2 text-sm text-muted-foreground">Published processes will appear here.</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
