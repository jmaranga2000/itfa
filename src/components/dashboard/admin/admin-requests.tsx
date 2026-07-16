import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Inbox,
  Users,
} from "lucide-react";
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
import { adminRequests } from "@/content/admin-requests";

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
  const readyToConvert = adminRequests.filter((request) => request.status === "Ready to convert");
  const needsClient = adminRequests.filter(
    (request) => request.status === "Clarification" || request.status === "KYC required",
  );
  const highPriority = adminRequests.filter((request) => request.priority === "High");
  const summary = [
    {
      label: "Open",
      value: adminRequests.length,
      helper: "Awaiting a decision",
      icon: Inbox,
    },
    {
      label: "Ready to begin",
      value: readyToConvert.length,
      helper: "Can become active work",
      icon: CheckCircle2,
    },
    {
      label: "Need client input",
      value: needsClient.length,
      helper: "Clarification or KYC",
      icon: Clock,
    },
    {
      label: "High priority",
      value: highPriority.length,
      helper: "Needs prompt attention",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="min-w-0">
      <Card className="overflow-hidden">
        <CardHeader className="gap-5 border-b border-border bg-card">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-primary">
                <Inbox aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-2xl">Engagement requests</CardTitle>
                <CardDescription className="mt-1 max-w-2xl leading-6">
                  Review incoming client needs and move complete requests into active work.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={buttonClassName({ variant: "secondary" })} href="/admin/clients">
                <Users aria-hidden="true" className="h-4 w-4" />
                View clients
              </Link>
              <Link className={buttonClassName()} href="/admin/active-engagements">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Active work
              </Link>
            </div>
          </div>

          <div className="grid overflow-hidden rounded-md border border-border bg-background sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  className={[
                    "flex min-w-0 items-center gap-3 px-4 py-3",
                    index > 0 ? "border-t border-border sm:border-t-0" : "",
                    index % 2 === 1 ? "sm:border-l sm:border-border" : "",
                    index > 1 ? "sm:border-t xl:border-t-0" : "",
                    index > 0 ? "xl:border-l xl:border-border" : "",
                  ].join(" ")}
                  key={item.label}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-soft text-primary">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">{item.value}</span>
                      <span className="truncate text-sm font-semibold text-foreground">
                        {item.label}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{item.helper}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Service and next step</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminRequests.map((request) => (
                  <TableRow key={request.reference}>
                    <TableCell>
                      <div className="min-w-48">
                        <p className="font-semibold text-foreground">{request.client}</p>
                        <p className="mt-1 font-mono text-xs font-semibold text-primary">
                          {request.reference}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-64 max-w-md">
                        <p className="font-semibold text-foreground">{request.service}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Next: {request.nextAction}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="grid justify-items-start gap-1.5">
                        <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                        <Badge tone={priorityTone(request.priority)}>
                          {request.priority} priority
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{request.owner}</TableCell>
                    <TableCell>{request.submitted}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        className={buttonClassName({ variant: "secondary", size: "sm" })}
                        href={`/admin/requests/${request.id}`}
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
        </CardContent>
      </Card>
    </div>
  );
}
