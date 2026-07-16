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
import { ROLE_LABELS } from "@/features/authorization/roles";
import { listArchivedUsersForAdmin } from "@/repositories/user-repository";

const archiveBuckets = [
  {
    label: "Completed engagements",
    value: "0",
    helper: "Read-only client workspaces after completion.",
  },
  {
    label: "Archived clients",
    value: "0",
    helper: "Client records removed from active operations.",
  },
  {
    label: "Archived staff",
    value: "0",
    helper: "Former staff retained for audit and reporting.",
  },
];

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

export async function AdminArchive() {
  const archivedUsers = await listArchivedUsersForAdmin();

  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Badge tone="teal">Admin archive</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Archive register
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Review archived accounts, completed workspaces and retained records without mixing
              them into active client and staff operations.
            </p>
          </div>
          <div className="rounded-md border border-brand-mist-strong bg-brand-soft px-4 py-3">
            <p className="font-mono text-xs font-semibold text-muted-foreground">Archived accounts</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {archivedUsers.length} archived users
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {archiveBuckets.map((bucket) => (
          <Card key={bucket.label}>
            <CardHeader>
              <CardDescription>{bucket.label}</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {bucket.label === "Archived clients"
                  ? archivedUsers.filter((user) =>
                      user.roleKeys.some((role) => role === "client" || role === "client_representative"),
                    ).length
                  : bucket.label === "Archived staff"
                    ? archivedUsers.filter((user) =>
                        user.roleKeys.every((role) => role !== "client" && role !== "client_representative"),
                      ).length
                    : bucket.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{bucket.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Archived accounts</CardTitle>
          <CardDescription>Read-only records retained for audit and restoration review.</CardDescription>
        </CardHeader>
        <CardContent>
          {archivedUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Archived</TableHead>
                    <TableHead>Last updated</TableHead>
                    <TableHead>Linked work</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="min-w-56">
                          <p className="font-semibold text-foreground">
                            {`${user.firstName} ${user.lastName}`.trim() || "Unnamed account"}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-52 flex-wrap gap-1.5">
                          {user.roleKeys.map((role) => (
                            <Badge key={role} tone="slate">
                              {ROLE_LABELS[role]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{dateLabel(user.archivedAt)}</TableCell>
                      <TableCell>{dateLabel(user.updatedAt)}</TableCell>
                      <TableCell>{user.assignedEngagementCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
              No archived accounts are available yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
