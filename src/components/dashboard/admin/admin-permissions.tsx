import { KeyRound, ShieldCheck, UserCog, Users } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERMISSIONS, type Permission } from "@/features/authorization/permissions";
import {
  APP_ROLES,
  ROLE_LABELS,
  ROLE_PERMISSION_MATRIX,
  type AppRole,
} from "@/features/authorization/roles";

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
    <AdminPageSurface
      description="See what each staff role can access. Use this page before changing someone’s responsibilities."
      icon={ShieldCheck}
      summary={[
        { label: "Roles", value: APP_ROLES.length, helper: "Available staff roles", icon: Users },
        { label: "Access rights", value: PERMISSIONS.length, helper: "Actions controlled", icon: KeyRound },
        { label: "Largest role", value: highestPermissionCount, helper: "Most access rights", icon: UserCog },
      ]}
      title="Roles and access"
      footer={
        <p className="text-sm text-muted-foreground">
          “Yes” means the role can open that area. Change role assignments carefully and review staff access afterwards.
        </p>
      }
    >
      <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Access level</TableHead>
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
                      <TableCell>{permissionCount(role)} allowed actions</TableCell>
                      {[
                        roleHasPermission(role, "clients.read"),
                        roleHasPermission(role, "staff.read"),
                        roleHasPermission(role, "reports.read"),
                        roleHasPermission(role, "archive.read"),
                      ].map((allowed, index) => (
                        <TableCell key={`${role}-${index}`}>
                          <Badge tone={allowed ? "green" : "slate"}>{allowed ? "Yes" : "No"}</Badge>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
      </div>
    </AdminPageSurface>
  );
}
