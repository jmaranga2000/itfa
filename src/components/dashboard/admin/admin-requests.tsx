import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const requestRows = [
  {
    reference: "REQ-2026-014",
    client: "Amani Holdings",
    service: "Corporate tax planning",
    status: "Admin review",
    priority: "High",
    owner: "Engagement manager",
    submitted: "Jul 15, 2026",
    nextAction: "Confirm scope and assign reviewer",
  },
  {
    reference: "REQ-2026-013",
    client: "Nairobi Trade Co.",
    service: "Transfer pricing review",
    status: "Clarification",
    priority: "Medium",
    owner: "Consultant",
    submitted: "Jul 14, 2026",
    nextAction: "Request missing entity structure",
  },
  {
    reference: "REQ-2026-012",
    client: "Kilele Foods",
    service: "Payroll compliance",
    status: "Ready to convert",
    priority: "Medium",
    owner: "Reviewer",
    submitted: "Jul 13, 2026",
    nextAction: "Open active engagement workspace",
  },
  {
    reference: "REQ-2026-011",
    client: "Blue Rift Advisory",
    service: "KRA notice response",
    status: "KYC required",
    priority: "High",
    owner: "Support staff",
    submitted: "Jul 12, 2026",
    nextAction: "Trigger KYC review checklist",
  },
];

function statusTone(status: string) {
  if (status === "Ready to convert") {
    return "green" as const;
  }

  if (status === "Clarification" || status === "KYC required") {
    return "gold" as const;
  }

  return "teal" as const;
}

function priorityTone(priority: string) {
  return priority === "High" ? ("red" as const) : ("slate" as const);
}

export function AdminRequests() {
  const readyToConvert = requestRows.filter((request) => request.status === "Ready to convert");
  const needsClient = requestRows.filter(
    (request) => request.status === "Clarification" || request.status === "KYC required",
  );

  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <Badge tone="teal">New requests</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Client requests
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Review what clients need, ask for missing information and approve work that is ready to begin.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonClassName({ variant: "secondary" })} href="/admin/clients">
              View clients
            </Link>
            <Link className={buttonClassName()} href="/admin/active-engagements">
              Active client work
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        {[
          ["Open requests", requestRows.length, "Requests waiting for admin movement."],
          ["Ready to start", readyToConvert.length, "Requests that can move into active work."],
          ["Waiting for client", needsClient.length, "Requests needing more information or verification."],
          ["High priority", requestRows.filter((request) => request.priority === "High").length, "Items requiring quick review."],
        ].map(([label, value, helper]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl font-bold">{value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>What was requested, its status and what to do next.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestRows.map((request) => (
                    <TableRow key={request.reference}>
                      <TableCell className="min-w-44">
                        <p className="font-semibold text-foreground">{request.reference}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {request.nextAction}
                        </p>
                      </TableCell>
                      <TableCell>{request.client}</TableCell>
                      <TableCell>{request.service}</TableCell>
                      <TableCell>
                        <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge tone={priorityTone(request.priority)}>{request.priority}</Badge>
                      </TableCell>
                      <TableCell>{request.owner}</TableCell>
                      <TableCell>{request.submitted}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            className={buttonClassName({ variant: "secondary", size: "sm" })}
                            href="/admin/clients"
                          >
                            Review
                          </Link>
                          <Link
                            className={buttonClassName({ size: "sm" })}
                            href="/admin/workflows"
                          >
                            Convert
                          </Link>
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
            <CardTitle>Intake controls</CardTitle>
            <CardDescription>Checks before a request becomes active work.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Confirm service scope and pricing",
              "Check client organization and representative access",
              "Trigger or review KYC requirements",
              "Assign staff owner before conversion",
              "Create workspace and first workflow tasks",
            ].map((item, index) => (
              <div className="rounded-md border border-border px-3 py-3" key={item}>
                <p className="font-mono text-xs font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
