import Link from "next/link";
import { ArrowUpRight, KeyRound, ShieldCheck, UserCog, Users } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminRoleRecord } from "@/repositories/role-repository";

export function AdminPermissions({ roles }: { roles: AdminRoleRecord[] }) {
  const highestPermissionCount = Math.max(...roles.map((role) => role.permissions.length), 0);
  const assignedUsers = roles.reduce((total, role) => total + role.userCount, 0);

  return (
    <AdminPageSurface
      description="Review each role, see how many accounts use it, and change access with simple Yes or No controls."
      icon={ShieldCheck}
      summary={[
        { label: "Roles", value: roles.length, helper: "Available account roles", icon: Users },
        { label: "Assigned accounts", value: assignedUsers, helper: "Across all roles", icon: KeyRound },
        { label: "Largest role", value: highestPermissionCount, helper: "Most allowed actions", icon: UserCog },
      ]}
      title="Roles and access"
      footer={<p className="text-sm text-muted-foreground">Role changes apply to every active account assigned to that role and are recorded in the activity log.</p>}
    >
      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Access level</TableHead>
              <TableHead>Assigned accounts</TableHead>
              <TableHead>Last changed</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.key}>
                <TableCell>
                  <p className="font-semibold text-foreground">{role.label}</p>
                  <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{role.description}</p>
                </TableCell>
                <TableCell><Badge tone="teal">{role.permissions.length} allowed</Badge></TableCell>
                <TableCell>{role.userCount}</TableCell>
                <TableCell className="text-muted-foreground">
                  {role.updatedAt
                    ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(role.updatedAt))
                    : "Seed defaults"}
                </TableCell>
                <TableCell className="text-right">
                  <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/admin/permissions/${role.key}`}>
                    Edit access
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
