import Link from "next/link";
import { Briefcase, ShieldCheck, UserCheck, UserCog, Users } from "lucide-react";
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
import { ROLE_LABELS, ROLE_PERMISSION_MATRIX } from "@/features/authorization/roles";
import { listStaffForAdmin, type AdminDirectoryUser } from "@/repositories/user-repository";

function displayName(user: AdminDirectoryUser) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || "Unnamed staff member";
}

function initials(user: AdminDirectoryUser) {
  return `${user.firstName.at(0) ?? ""}${user.lastName.at(0) ?? ""}` || "S";
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
  const roleCoverage = new Set(staff.flatMap((member) => member.roleKeys)).size;

  return (
    <AdminPageSurface
      actions={
        <Link className={buttonClassName({ variant: "secondary" })} href="/admin/permissions">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          Manage access
        </Link>
      }
      description="Find staff members, check their role and see whether they can access the portal."
      icon={UserCog}
      summary={[
        { label: "Team members", value: staff.length, helper: "Staff accounts", icon: Users },
        { label: "Active", value: activeStaff, helper: "Can sign in", icon: UserCheck },
        { label: "Assigned work", value: assignedWork, helper: "Linked engagements", icon: Briefcase },
        { label: "Roles covered", value: roleCoverage, helper: `${suspendedStaff} suspended`, icon: ShieldCheck },
      ]}
      title="Staff directory"
    >
      {staff.length > 0 ? (
        <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Portal access</TableHead>
                    <TableHead>Assigned work</TableHead>
                    <TableHead>Last activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex min-w-60 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                            {initials(member)}
                          </span>
                          <div>
                            <p className="font-semibold text-foreground">{displayName(member)}</p>
                            <p className="text-xs font-medium text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-44 flex-wrap gap-1.5">
                          {roleLabels(member).map((role) => (
                            <Badge key={role} tone="teal">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid justify-items-start gap-1.5">
                          <Badge tone={statusTone(member.status)}>{member.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {member.emailVerifiedAt ? "Email verified" : "Email pending"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-foreground">
                          {member.assignedEngagementCount} engagements
                        </p>
                        <p className="text-xs text-muted-foreground">{permissionCount(member)} access rights</p>
                      </TableCell>
                      <TableCell>
                        <p>{dateLabel(member.lastLoginAt)}</p>
                        <p className="text-xs text-muted-foreground">Joined {dateLabel(member.createdAt)}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No staff accounts are available yet.
        </div>
      )}
    </AdminPageSurface>
  );
}
