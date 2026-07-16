import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const workflows = [
  {
    name: "Client onboarding",
    owner: "Engagement manager",
    status: "Published",
    tasks: 8,
    stages: ["Request", "KYC", "Approval", "Workspace"],
  },
  {
    name: "Tax advisory engagement",
    owner: "Consultant",
    status: "Draft",
    tasks: 12,
    stages: ["Scope", "Research", "Review", "Deliver"],
  },
  {
    name: "Finance review",
    owner: "Finance officer",
    status: "Published",
    tasks: 6,
    stages: ["Invoice", "Approval", "Payment", "Reconcile"],
  },
  {
    name: "Document quality review",
    owner: "Reviewer",
    status: "Review",
    tasks: 9,
    stages: ["Upload", "Classify", "Check", "Approve"],
  },
];

const workflowHealth = [
  { label: "Published workflows", value: "2", helper: "Available for active engagements." },
  { label: "Draft workflows", value: "1", helper: "Still being configured by admins." },
  { label: "Review queue", value: "1", helper: "Needs final approval before publishing." },
];

function statusTone(status: string) {
  if (status === "Published") {
    return "green" as const;
  }

  if (status === "Review") {
    return "gold" as const;
  }

  return "slate" as const;
}

export function AdminWorkflows() {
  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Badge tone="teal">Admin workflows</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Workflow control center
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Configure the workflow paths that drive client onboarding, engagement work,
              document review, finance approval and archive readiness.
            </p>
          </div>
          <div className="rounded-md border border-brand-mist-strong bg-brand-soft px-4 py-3">
            <p className="font-mono text-xs font-semibold text-muted-foreground">Active workflows</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {workflows.length} workflows
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {workflowHealth.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl font-bold">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle>Workflow library</CardTitle>
            <CardDescription>Workflow stages, owners, status and task volume.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Stages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.name}>
                      <TableCell className="font-semibold text-foreground">
                        {workflow.name}
                      </TableCell>
                      <TableCell>{workflow.owner}</TableCell>
                      <TableCell>
                        <Badge tone={statusTone(workflow.status)}>{workflow.status}</Badge>
                      </TableCell>
                      <TableCell>{workflow.tasks}</TableCell>
                      <TableCell>
                        <div className="flex min-w-72 flex-wrap gap-1.5">
                          {workflow.stages.map((stage) => (
                            <span
                              className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-semibold text-foreground"
                              key={stage}
                            >
                              {stage}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stage model</CardTitle>
            <CardDescription>The admin workflow model shown to staff and clients.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {["Submitted", "Admin review", "KYC", "Active work", "Client review", "Archive"].map(
              (stage, index) => (
                <div className="rounded-md border border-border px-3 py-3" key={stage}>
                  <p className="font-mono text-xs font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{stage}</p>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
