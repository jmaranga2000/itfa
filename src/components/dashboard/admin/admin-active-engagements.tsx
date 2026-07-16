import Link from "next/link";
import { AlertTriangle, ArrowUpRight, BarChart3, Briefcase, CalendarClock } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
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
    <AdminPageSurface
      actions={
        <>
          <Link className={buttonClassName({ variant: "secondary" })} href="/admin/requests">
            Requests
          </Link>
          <Link className={buttonClassName()} href="/admin/tasks">
            Review tasks
          </Link>
        </>
      }
      description="See what is being delivered, who owns it, what is delayed and what is due next."
      icon={Briefcase}
      summary={[
        { label: "In progress", value: engagementRows.length, helper: "Current client work", icon: Briefcase },
        { label: "Needs attention", value: blocked.length, helper: "Waiting on an action", icon: AlertTriangle },
        { label: "Due soon", value: dueSoon.length, helper: "Due this week", icon: CalendarClock },
        { label: "Progress", value: "64%", helper: "Average completion", icon: BarChart3 },
      ]}
      title="Active client work"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client work</TableHead>
              <TableHead>Stage and progress</TableHead>
              <TableHead>Responsible person</TableHead>
              <TableHead>Needs attention</TableHead>
              <TableHead>Next due</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {engagementRows.map((engagement) => (
              <TableRow key={engagement.reference}>
                <TableCell>
                  <div className="min-w-56">
                    <p className="font-semibold text-foreground">{engagement.client}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{engagement.service}</p>
                    <p className="mt-1 font-mono text-xs text-primary">{engagement.reference}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="grid min-w-44 gap-2">
                    <Badge tone={stageTone(engagement.stage)}>{engagement.stage}</Badge>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-sm bg-muted">
                        <div
                          className="h-2 rounded-sm bg-accent"
                          style={{ width: `${engagement.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{engagement.progress}%</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{engagement.owner}</TableCell>
                <TableCell>
                  <span className={engagement.blocker === "None" ? "text-muted-foreground" : "font-semibold text-foreground"}>
                    {engagement.blocker}
                  </span>
                </TableCell>
                <TableCell>{engagement.due}</TableCell>
                <TableCell className="text-right">
                  <Link
                    className={buttonClassName({ variant: "secondary", size: "sm" })}
                    href="/admin/workflows"
                  >
                    Open
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}
