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
import {
  PERMISSION_DESCRIPTIONS,
  PERMISSIONS,
  type Permission,
} from "@/features/authorization/permissions";
import {
  APP_ROLES,
  ROLE_LABELS,
  ROLE_PERMISSION_MATRIX,
  type AppRole,
} from "@/features/authorization/roles";

const permissionGroups: Array<{
  label: string;
  permissions: Permission[];
}> = [
  {
    label: "Client and staff",
    permissions: ["clients.read", "clients.create", "clients.update", "staff.read", "staff.manage"],
  },
  {
    label: "Engagement work",
    permissions: [
      "engagements.read_all",
      "engagements.read_assigned",
      "engagements.create",
      "engagements.accept",
      "engagements.assign",
      "engagements.update_workflow",
      "engagements.complete",
      "engagements.archive",
    ],
  },
  {
    label: "Governance",
    permissions: [
      "templates.manage",
      "reports.read",
      "audit_logs.read",
      "permissions.manage",
      "settings.manage",
      "archive.read",
      "archive.restore",
    ],
  },
];

function permissionCount(role: AppRole) {
  return ROLE_PERMISSION_MATRIX[role].length;
}

function roleHasPermission(role: AppRole, permission: Permission) {
  return ROLE_PERMISSION_MATRIX[role].includes(permission);
}

export function AdminPermissions() {
  const highestPermissionCount = Math.max(
    ...APP_ROLES.map((role) => ROLE_PERMISSION_MATRIX[role].length),
  );

  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Badge tone="teal">Admin permissions</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Roles and permission matrix
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Review the database-backed role definitions that control client, staff, finance,
              reporting, templates, archive, settings and admin access.
            </p>
          </div>
          <div className="rounded-md border border-brand-mist-strong bg-brand-soft px-4 py-3">
            <p className="font-mono text-xs font-semibold text-muted-foreground">Access setup</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {APP_ROLES.length} roles, {PERMISSIONS.length} permissions
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Roles</CardDescription>
            <CardTitle className="text-2xl font-bold">{APP_ROLES.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              System roles seeded into the authorization layer.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Permissions</CardDescription>
            <CardTitle className="text-2xl font-bold">{PERMISSIONS.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Granular actions available to roles and direct grants.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Broadest role</CardDescription>
            <CardTitle className="text-2xl font-bold">{highestPermissionCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Maximum permission count assigned to a single role.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Role coverage</CardTitle>
            <CardDescription>Permission count and important access areas per role.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Archive</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {APP_ROLES.map((role) => (
                    <TableRow key={role}>
                      <TableCell className="font-semibold text-foreground">
                        {ROLE_LABELS[role]}
                      </TableCell>
                      <TableCell>{permissionCount(role)}</TableCell>
                      <TableCell>{roleHasPermission(role, "clients.read") ? "Yes" : "No"}</TableCell>
                      <TableCell>{roleHasPermission(role, "staff.read") ? "Yes" : "No"}</TableCell>
                      <TableCell>{roleHasPermission(role, "reports.read") ? "Yes" : "No"}</TableCell>
                      <TableCell>{roleHasPermission(role, "archive.read") ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permission groups</CardTitle>
            <CardDescription>Key admin areas with their seeded permission keys.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {permissionGroups.map((group) => (
              <div className="rounded-md border border-border px-3 py-3" key={group.label}>
                <p className="text-sm font-semibold text-foreground">{group.label}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {group.permissions.map((permission) => (
                    <Badge key={permission} tone="slate">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Permission descriptions</CardTitle>
          <CardDescription>Action labels shown for admin review and auditing.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {PERMISSIONS.map((permission) => (
            <div className="rounded-md border border-border px-3 py-3" key={permission}>
              <p className="font-mono text-xs font-semibold text-primary">{permission}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {PERMISSION_DESCRIPTIONS[permission]}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
