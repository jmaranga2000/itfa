import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  ShieldCheck,
  UserCheck,
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
import { ROLE_LABELS } from "@/features/authorization/roles";
import {
  listRegisteredClientsForAdmin,
  type AdminDirectoryUser,
} from "@/repositories/user-repository";

function displayName(user: AdminDirectoryUser) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || "Unnamed client";
}

function initials(user: AdminDirectoryUser) {
  const value = `${user.firstName.at(0) ?? ""}${user.lastName.at(0) ?? ""}`.trim();
  return value || user.email.at(0)?.toUpperCase() || "C";
}

function dateLabel(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === "active") {
    return "green" as const;
  }

  if (status === "invited") {
    return "gold" as const;
  }

  if (status === "suspended") {
    return "red" as const;
  }

  return "slate" as const;
}

function roleLabel(user: AdminDirectoryUser) {
  return user.roleKeys.map((role) => ROLE_LABELS[role]).join(", ");
}

export async function AdminClients() {
  const clients = await listRegisteredClientsForAdmin();
  const activeClients = clients.filter((client) => client.status === "active").length;
  const verifiedClients = clients.filter((client) => client.emailVerifiedAt).length;
  const linkedRequests = clients.reduce(
    (total, client) => total + client.assignedEngagementCount,
    0,
  );
  const summary = [
    {
      label: "Total clients",
      value: clients.length,
      helper: "Registered accounts",
      icon: Users,
    },
    {
      label: "Portal access",
      value: activeClients,
      helper: "Can currently sign in",
      icon: UserCheck,
    },
    {
      label: "Email verified",
      value: verifiedClients,
      helper: "Identity confirmed",
      icon: ShieldCheck,
    },
    {
      label: "Linked work",
      value: linkedRequests,
      helper: "Requests and workspaces",
      icon: Briefcase,
    },
  ];

  return (
    <div className="min-w-0">
      <Card className="overflow-hidden">
        <CardHeader className="gap-5 border-b border-border bg-card">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-primary">
                <Users aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-2xl">Client directory</CardTitle>
                <CardDescription className="mt-1 max-w-2xl leading-6">
                  Find a client, check their portal access and open their full account record.
                </CardDescription>
              </div>
            </div>
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href="/admin/requests"
            >
              <Briefcase aria-hidden="true" className="h-4 w-4" />
              View requests
            </Link>
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
          {clients.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Portal access</TableHead>
                    <TableHead>Client activity</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last activity</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex min-w-60 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                            {initials(client)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">{displayName(client)}</p>
                            <p className="truncate text-xs font-medium text-muted-foreground">
                              {client.email}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {roleLabel(client)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid justify-items-start gap-1.5">
                          <Badge tone={statusTone(client.status)}>{client.status}</Badge>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                            {client.emailVerifiedAt ? "Email verified" : "Verification pending"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid gap-1 text-sm">
                          <span className="inline-flex items-center gap-2 font-semibold text-foreground">
                            <Briefcase aria-hidden="true" className="h-4 w-4 text-primary" />
                            {client.assignedEngagementCount} linked requests
                          </span>
                          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                            <Building2 aria-hidden="true" className="h-4 w-4" />
                            {client.clientOrganizationCount} organizations
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{dateLabel(client.createdAt)}</TableCell>
                      <TableCell>{dateLabel(client.lastLoginAt)}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          className={buttonClassName({ variant: "secondary", size: "sm" })}
                          href={`/admin/clients/${client.id}`}
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
          ) : (
            <div className="m-5 rounded-md border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
              <Users aria-hidden="true" className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-3 font-semibold text-foreground">No clients yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Registered client accounts will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
