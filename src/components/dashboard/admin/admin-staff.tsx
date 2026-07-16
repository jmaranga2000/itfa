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
import { ROLE_LABELS, ROLE_PERMISSION_MATRIX } from "@/features/authorization/roles";
import { listStaffForAdmin, type AdminDirectoryUser } from "@/repositories/user-repository";

function displayName(user: AdminDirectoryUser) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || "Unnamed staff member";
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

function roleLabels(user: AdminDirectoryUser) {
  return user.roleKeys.map((role) => ROLE_LABELS[role]);
}

function permissionCount(user: AdminDirectoryUser) {
  const permissions = new Set(user.directPermissions);

  for (const role of user.roleKeys) {
    for (const permission of ROLE_PERMISSION_MATRIX[role]) {
      permissions.add(permission);
    }
  }

  return permissions.size;
}

export async function AdminStaff() {
  const staff = await listStaffForAdmin();
  const activeStaff = staff.filter((member) => member.status === "active").length;
  const suspendedStaff = staff.filter((member) => member.status === "suspended").length;
  const assignedWork = staff.reduce(
    (total, member) => total + member.assignedEngagementCount,
    0,
  );

  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Badge tone="teal">Admin staff</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Staff directory and access detail
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Review staff accounts with roles, permission reach, account state, verification,
              assigned work and recent activity from registered user records.
            </p>
          </div>
          <div className="rounded-md border border-brand-mist-strong bg-brand-soft px-4 py-3">
            <p className="font-mono text-xs font-semibold text-muted-foreground">Team members</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{staff.length} listed</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Staff accounts</CardDescription>
            <CardTitle className="text-2xl font-bold">{staff.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Admin, consultant, reviewer, finance, support and audit roles.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active staff</CardDescription>
            <CardTitle className="text-2xl font-bold">{activeStaff}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Accounts currently allowed into staff and admin portals.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Assigned work</CardDescription>
            <CardTitle className="text-2xl font-bold">{assignedWork}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Engagement references attached to staff user records.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Full staff details</CardTitle>
          <CardDescription>
            Roles, permissions, account health, assigned work and activity details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff member</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="min-w-56">
                          <p className="font-semibold text-foreground">{displayName(member)}</p>
                          <p className="text-xs font-medium text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-52 flex-wrap gap-1.5">
                          {roleLabels(member).map((role) => (
                            <Badge key={role} tone="teal">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid gap-2">
                          <Badge tone={statusTone(member.status)}>{member.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {member.emailVerifiedAt ? "Email verified" : "Email pending"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-foreground">{permissionCount(member)}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.directPermissions.length} direct
                        </p>
                      </TableCell>
                      <TableCell>{member.assignedEngagementCount}</TableCell>
                      <TableCell>{dateLabel(member.createdAt)}</TableCell>
                      <TableCell>{dateLabel(member.lastLoginAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
              No staff accounts are available yet.
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Access review",
            value: `${suspendedStaff} suspended`,
            helper: "Suspended or archived records should be reviewed before production use.",
          },
          {
            label: "Role coverage",
            value: `${new Set(staff.flatMap((member) => member.roleKeys)).size} roles`,
            helper: "Distinct role types currently represented in the staff directory.",
          },
          {
            label: "Direct grants",
            value: `${staff.reduce((total, member) => total + member.directPermissions.length, 0)}`,
            helper: "Direct permission overrides outside role defaults.",
          },
        ].map((item) => (
          <div className="rounded-md border border-border bg-card p-4" key={item.label}>
            <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-xl font-bold text-foreground">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.helper}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
