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
import { ROLE_LABELS } from "@/features/authorization/roles";
import {
  listRegisteredClientsForAdmin,
  type AdminDirectoryUser,
} from "@/repositories/user-repository";

function displayName(user: AdminDirectoryUser) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || "Unnamed client";
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

  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Badge tone="teal">Clients</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Clients
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              View registered clients, their access status, requests and organizations.
            </p>
          </div>
          <div className="rounded-md border border-brand-mist-strong bg-brand-soft px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">Total clients</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {clients.length} registered
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Registered clients</CardDescription>
            <CardTitle className="text-2xl font-bold">{clients.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Client and client representative accounts that are not archived.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active access</CardDescription>
            <CardTitle className="text-2xl font-bold">{activeClients}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Accounts currently allowed to use the client portal.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Verified emails</CardDescription>
            <CardTitle className="text-2xl font-bold">{verifiedClients}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Clients who have completed email verification.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle>Client records</CardTitle>
            <CardDescription>Contact details, access and related requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Requests</TableHead>
                      <TableHead>Organizations</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="min-w-56">
                            <p className="font-semibold text-foreground">{displayName(client)}</p>
                            <p className="text-xs font-medium text-muted-foreground">
                              {client.email}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {roleLabel(client)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="grid gap-2">
                            <Badge tone={statusTone(client.status)}>{client.status}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {client.emailVerifiedAt ? "Email verified" : "Email pending"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-foreground">
                            {client.assignedEngagementCount}
                          </p>
                          <p className="text-xs text-muted-foreground">linked requests</p>
                        </TableCell>
                        <TableCell>{client.clientOrganizationCount}</TableCell>
                        <TableCell>{dateLabel(client.createdAt)}</TableCell>
                        <TableCell>{dateLabel(client.lastLoginAt)}</TableCell>
                        <TableCell>
                          <Link
                            className={buttonClassName({ variant: "secondary", size: "sm" })}
                            href={`/admin/clients/${client.id}`}
                          >
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                No registered client accounts are available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request coverage</CardTitle>
            <CardDescription>
              Current request visibility based on linked engagement references.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-md border border-border px-3 py-3">
              <p className="font-mono text-xs font-semibold text-primary">LINKED</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{linkedRequests}</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Total request/workspace references attached to client records.
              </p>
            </div>
            {["Submitted request", "KYC in review", "Active engagement", "Archived work"].map(
              (stage) => (
                <div
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  key={stage}
                >
                  <span className="text-sm font-medium text-foreground">{stage}</span>
                  <span className="font-mono text-xs font-semibold text-muted-foreground">
                    0
                  </span>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
