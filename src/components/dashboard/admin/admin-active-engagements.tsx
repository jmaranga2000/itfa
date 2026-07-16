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

const engagementRows = [
  {
    reference: "ENG-2026-044",
    client: "Amani Holdings",
    service: "Corporate tax planning",
    stage: "KYC review",
    owner: "Engagement manager",
    progress: 30,
    blocker: "Director ID pending",
    due: "Jul 18, 2026",
  },
  {
    reference: "ENG-2026-043",
    client: "Nairobi Trade Co.",
    service: "Transfer pricing review",
    stage: "Active work",
    owner: "Consultant",
    progress: 58,
    blocker: "None",
    due: "Jul 22, 2026",
  },
  {
    reference: "ENG-2026-042",
    client: "Kilele Foods",
    service: "Payroll compliance",
    stage: "Client review",
    owner: "Reviewer",
    progress: 76,
    blocker: "Client approval",
    due: "Jul 20, 2026",
  },
  {
    reference: "ENG-2026-041",
    client: "Blue Rift Advisory",
    service: "KRA notice response",
    stage: "Closeout",
    owner: "Document controller",
    progress: 92,
    blocker: "Archive pack",
    due: "Jul 16, 2026",
  },
];

function stageTone(stage: string) {
  if (stage === "Closeout") {
    return "green" as const;
  }

  if (stage === "KYC review" || stage === "Client review") {
    return "gold" as const;
  }

  return "teal" as const;
}

export function AdminActiveEngagements() {
  const blocked = engagementRows.filter((engagement) => engagement.blocker !== "None");
  const dueSoon = engagementRows.filter((engagement) =>
    ["Jul 16, 2026", "Jul 18, 2026", "Jul 20, 2026"].includes(engagement.due),
  );

  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <Badge tone="teal">Client work</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Active client work
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              See work in progress, who is responsible, what is delayed and what is due next.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonClassName({ variant: "secondary" })} href="/admin/requests">
              New requests
            </Link>
            <Link className={buttonClassName()} href="/admin/tasks">
              Review tasks
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        {[
          ["In progress", engagementRows.length, "Client work currently being delivered."],
          ["Needs attention", blocked.length, "Work waiting for a client or staff action."],
          ["Due soon", dueSoon.length, "Milestones requiring attention this week."],
          ["Overall progress", "64%", "Average progress across current client work."],
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
            <CardTitle>Current client work</CardTitle>
            <CardDescription>Status, person responsible, progress and anything causing a delay.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Next due</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {engagementRows.map((engagement) => (
                    <TableRow key={engagement.reference}>
                      <TableCell className="min-w-44">
                        <p className="font-semibold text-foreground">{engagement.reference}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Blocker: {engagement.blocker}
                        </p>
                      </TableCell>
                      <TableCell>{engagement.client}</TableCell>
                      <TableCell>{engagement.service}</TableCell>
                      <TableCell>
                        <Badge tone={stageTone(engagement.stage)}>{engagement.stage}</Badge>
                      </TableCell>
                      <TableCell className="min-w-40">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-sm bg-muted">
                            <div
                              className="h-2 rounded-sm bg-accent"
                              style={{ width: `${engagement.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {engagement.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{engagement.owner}</TableCell>
                      <TableCell>{engagement.due}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            className={buttonClassName({ variant: "secondary", size: "sm" })}
                            href="/admin/workflows"
                          >
                            Workflow
                          </Link>
                          <Link
                            className={buttonClassName({ size: "sm" })}
                            href="/admin/tasks"
                          >
                            Tasks
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
            <CardTitle>Delivery controls</CardTitle>
            <CardDescription>Admin checks for live engagements.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Confirm stage transition owner",
              "Resolve blockers before due dates",
              "Review client-visible deliverables",
              "Approve invoice or closeout readiness",
              "Move completed work to archive",
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
