import { CheckCircle2, Circle, GripVertical, Plus, ShieldCheck, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkflowTemplateRecord } from "@/repositories/workflow-repository";

function statusTone(status: string) {
  if (status === "published") {
    return "green" as const;
  }

  if (status === "review") {
    return "gold" as const;
  }

  return "slate" as const;
}

export function WorkflowBuilder({ templates }: { templates: WorkflowTemplateRecord[] }) {
  const selectedTemplate = templates[0] ?? null;
  const selectedStage = selectedTemplate?.stages[0] ?? null;

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <Badge tone="red">Workflow builder</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Workflow Template Builder
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Configure stages, tasks, dependencies, approval gates, notifications, escalation
              rules and client-visible labels before publishing workflow versions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={buttonClassName({ variant: "secondary" })} type="button">
              Save draft
            </button>
            <button className={buttonClassName()} type="button">
              Publish version
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Workflow structure</CardTitle>
            <CardDescription>Stages, tasks and order.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {templates.map((template) => (
              <div className="rounded-md border border-border p-3" key={template.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{template.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">v{template.version}</p>
                  </div>
                  <Badge tone={statusTone(template.status)}>{template.status}</Badge>
                </div>
              </div>
            ))}

            {selectedTemplate ? (
              <div className="grid gap-2">
                {selectedTemplate.stages.map((stage) => (
                  <div className="rounded-md border border-border px-3 py-3" key={stage.key}>
                    <div className="flex items-center gap-2">
                      <GripVertical aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{stage.name}</p>
                    </div>
                    <div className="mt-3 grid gap-2 pl-6">
                      {stage.tasks.map((task) => (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground" key={task.key}>
                          <Circle aria-hidden="true" className="h-3 w-3" />
                          {task.title}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <button className={buttonClassName({ variant: "secondary", size: "sm" })} type="button">
                <Plus aria-hidden="true" className="h-4 w-4" />
                Stage
              </button>
              <button className={buttonClassName({ variant: "secondary", size: "sm" })} type="button">
                <Plus aria-hidden="true" className="h-4 w-4" />
                Task
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visual canvas</CardTitle>
            <CardDescription>Connected stage cards show progression and validation gates.</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <div className="grid gap-4 2xl:grid-cols-2">
                {selectedTemplate.stages.map((stage, index) => (
                  <div className="relative rounded-md border border-border bg-background p-4" key={stage.key}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs font-semibold text-accent">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <h2 className="mt-2 text-sm font-bold text-foreground">{stage.name}</h2>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {stage.clientTitle}
                        </p>
                      </div>
                      {stage.approvalRequired ? (
                        <ShieldCheck aria-hidden="true" className="h-4 w-4 text-amber-600" />
                      ) : (
                        <Workflow aria-hidden="true" className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                      <span>{stage.tasks.length} tasks</span>
                      <span>{stage.expectedDurationDays} day target</span>
                      <span>{stage.responsibleRole}</span>
                      <span>{stage.completionConditions[0] ?? "Completion rule required"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                No workflow template found. Create a draft template to begin building.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Selected stage and task settings.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {selectedStage ? (
              <>
                {[
                  ["Stage title", selectedStage.name],
                  ["Client-visible title", selectedStage.clientTitle],
                  ["Responsible role", selectedStage.responsibleRole],
                  ["Duration", `${selectedStage.expectedDurationDays} days`],
                ].map(([label, value]) => (
                  <label className="grid gap-1 text-sm" key={label}>
                    <span className="font-semibold text-foreground">{label}</span>
                    <input
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                      readOnly
                      value={value}
                    />
                  </label>
                ))}

                <div className="grid gap-2">
                  <p className="text-sm font-semibold text-foreground">Validation checks</p>
                  {[
                    "No circular dependencies",
                    "Unique stage order",
                    "Required stages complete before publish",
                    "Published versions are immutable",
                  ].map((item) => (
                    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm" key={item}>
                      <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">
                Select a stage to configure its conditions, tasks and notifications.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
