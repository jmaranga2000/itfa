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

const templates = [
  {
    name: "Engagement kickoff",
    type: "Engagement",
    owner: "Engagement manager",
    status: "Published",
    version: "v1.4",
    usage: 18,
  },
  {
    name: "KYC questionnaire",
    type: "Compliance",
    owner: "Reviewer",
    status: "Published",
    version: "v2.1",
    usage: 27,
  },
  {
    name: "Advisory report",
    type: "Deliverable",
    owner: "Consultant",
    status: "Draft",
    version: "v0.9",
    usage: 6,
  },
  {
    name: "Invoice approval",
    type: "Finance",
    owner: "Finance officer",
    status: "Review",
    version: "v1.2",
    usage: 13,
  },
];

const templateGroups = [
  {
    label: "Client-facing",
    items: ["KYC questionnaire", "Document request", "Client update email"],
  },
  {
    label: "Staff workspace",
    items: ["Kickoff checklist", "Internal review note", "Research summary"],
  },
  {
    label: "Governance",
    items: ["Invoice approval", "Archive checklist", "Audit export"],
  },
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

export function AdminTemplates() {
  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Badge tone="teal">Admin templates</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Template library
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Maintain reusable templates for client onboarding, staff workspaces, compliance
              reviews, deliverables, invoices and archive packs.
            </p>
          </div>
          <div className="rounded-md border border-brand-mist-strong bg-brand-soft px-4 py-3">
            <p className="font-mono text-xs font-semibold text-muted-foreground">Available templates</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {templates.length} templates
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {templates.filter((template) => template.status === "Published").length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Templates available for live workflows and client requests.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Needs review</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {templates.filter((template) => template.status === "Review").length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Templates waiting for admin approval.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total usage</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {templates.reduce((total, template) => total + template.usage, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Recorded uses across workflow and document surfaces.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Version, ownership, status and current usage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Usage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.name}>
                      <TableCell className="font-semibold text-foreground">
                        {template.name}
                      </TableCell>
                      <TableCell>{template.type}</TableCell>
                      <TableCell>{template.owner}</TableCell>
                      <TableCell>
                        <Badge tone={statusTone(template.status)}>{template.status}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {template.version}
                      </TableCell>
                      <TableCell>{template.usage}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template groups</CardTitle>
            <CardDescription>How templates are organized in the admin portal.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {templateGroups.map((group) => (
              <div className="rounded-md border border-border px-3 py-3" key={group.label}>
                <p className="text-sm font-semibold text-foreground">{group.label}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <span
                      className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-semibold text-foreground"
                      key={item}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
