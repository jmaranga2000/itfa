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

const reports = [
  {
    name: "Pipeline summary",
    owner: "Operations",
    cadence: "Weekly",
    status: "Ready",
    coverage: "Requests, KYC, active work",
  },
  {
    name: "Finance snapshot",
    owner: "Finance",
    cadence: "Monthly",
    status: "Ready",
    coverage: "Invoices, payments, reconciliation",
  },
  {
    name: "Staff workload",
    owner: "Admin",
    cadence: "Weekly",
    status: "Draft",
    coverage: "Assignments, tasks, review queues",
  },
  {
    name: "Audit export",
    owner: "Governance",
    cadence: "On demand",
    status: "Ready",
    coverage: "Sensitive actions and permission changes",
  },
];

const reportMetrics = [
  { label: "Ready reports", value: "3", helper: "Reports available for review or export." },
  { label: "Draft reports", value: "1", helper: "Reports still waiting on final data checks." },
  { label: "Export formats", value: "3", helper: "CSV, PDF and management summary views." },
];

function statusTone(status: string) {
  return status === "Ready" ? ("green" as const) : ("gold" as const);
}

export function AdminReports() {
  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Badge tone="teal">Admin reports</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Reporting center
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Review operational, finance, workload and audit reports from one admin surface before
              exporting management summaries.
            </p>
          </div>
          <div className="rounded-md border border-brand-mist-strong bg-brand-soft px-4 py-3">
            <p className="font-mono text-xs font-semibold text-muted-foreground">Available reports</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {reports.length} report packs
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {reportMetrics.map((metric) => (
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
            <CardTitle>Report packs</CardTitle>
            <CardDescription>Cadence, ownership, readiness and coverage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Cadence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Coverage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.name}>
                      <TableCell className="font-semibold text-foreground">{report.name}</TableCell>
                      <TableCell>{report.owner}</TableCell>
                      <TableCell>{report.cadence}</TableCell>
                      <TableCell>
                        <Badge tone={statusTone(report.status)}>{report.status}</Badge>
                      </TableCell>
                      <TableCell>{report.coverage}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export workflow</CardTitle>
            <CardDescription>Admin review path before reports leave the portal.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {["Select period", "Review source data", "Approve summary", "Export and archive"].map(
              (step, index) => (
                <div className="border-t-2 border-primary pt-3" key={step}>
                  <p className="font-mono text-xs font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{step}</p>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
