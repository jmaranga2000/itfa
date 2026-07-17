import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  FilePenLine,
  Plus,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
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
import { ROLE_LABELS } from "@/features/authorization/roles";
import { assignStaffToRequestAction } from "@/features/staff/actions";
import type { AdminRequest } from "@/content/admin-requests";
import type {
  RequestStaffAssignmentRecord,
  StaffWorkloadRecord,
} from "@/repositories/staff-assignment-repository";

function displayName(user: StaffWorkloadRecord) {
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}

function initials(user: StaffWorkloadRecord) {
  return `${user.firstName.at(0) ?? ""}${user.lastName.at(0) ?? ""}` || "S";
}

function dateLabel(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminStaff({
  assignment,
  assignmentRequest,
  error,
  staff,
}: {
  assignment?: RequestStaffAssignmentRecord | null;
  assignmentRequest?: AdminRequest | null;
  error?: boolean;
  staff: StaffWorkloadRecord[];
}) {
  const activeStaff = staff.filter((member) => member.status === "active");
  const availableStaff = activeStaff.filter((member) => member.available);
  const assignedWork = staff.reduce((total, member) => total + member.totalWorkload, 0);
  const recommended = availableStaff[0] ?? activeStaff[0] ?? null;
  const assignmentMode = Boolean(assignmentRequest);

  return (
    <AdminPageSurface
      actions={
        <>
          {assignmentRequest ? (
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href={`/admin/requests/${assignmentRequest.id}`}
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Back to request
            </Link>
          ) : (
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href="/admin/permissions"
            >
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Roles and access
            </Link>
          )}
          <Link className={buttonClassName()} href="/admin/staff/new">
            <Plus aria-hidden="true" className="h-4 w-4" />
            New staff account
          </Link>
        </>
      }
      description={
        assignmentRequest
          ? `Choose an active team member for ${assignmentRequest.reference}. Available staff are shown first, followed by the lightest workload.`
          : "Create staff accounts, manage portal access and see who has capacity for new work."
      }
      icon={assignmentMode ? BriefcaseBusiness : UserCog}
      summary={[
        { label: "Team members", value: staff.length, helper: "Staff accounts", icon: Users },
        { label: "Active", value: activeStaff.length, helper: "Can sign in", icon: UserCheck },
        {
          label: "Available now",
          value: availableStaff.length,
          helper: "No assigned work",
          icon: CheckCircle2,
        },
        {
          label: "Total workload",
          value: assignedWork,
          helper: "Requests and engagements",
          icon: BriefcaseBusiness,
        },
      ]}
      title={
        assignmentRequest
          ? `Assign staff to ${assignmentRequest.reference}`
          : "Staff directory"
      }
    >
      {error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">
          The selected staff member could not be assigned. Choose an active account.
        </p>
      ) : null}
      {assignmentRequest && recommended ? (
        <div className="flex flex-col justify-between gap-3 border-b border-border bg-brand-soft px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-brand-deep">Recommended assignment</p>
            <p className="mt-1 text-sm text-brand-deep/75">
              {displayName(recommended)} has{" "}
              {recommended.available
                ? "no assigned work"
                : `the lightest workload at ${recommended.totalWorkload} item${recommended.totalWorkload === 1 ? "" : "s"}`}.
            </p>
          </div>
          <Badge tone="teal">Recommended</Badge>
        </div>
      ) : null}

      {staff.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Staff member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Workload</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => {
                const isRecommended = recommended?.id === member.id;
                const isAssigned = assignment?.staffUserId === member.id;
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex min-w-60 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                          {initials(member)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{displayName(member)}</p>
                            {assignmentMode && isRecommended ? (
                              <Badge tone="teal">Recommended</Badge>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge tone="slate">
                        {ROLE_LABELS[member.roleKeys[0]] ?? "Staff"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.status !== "active" ? (
                        <Badge tone="red">Unavailable</Badge>
                      ) : member.available ? (
                        <Badge tone="green">Available</Badge>
                      ) : (
                        <Badge tone="gold">In use</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-foreground">
                        {member.totalWorkload} item{member.totalWorkload === 1 ? "" : "s"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {member.requestAssignmentCount} requests,{" "}
                        {member.assignedEngagementCount} engagements
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateLabel(member.lastLoginAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Link
                          className={buttonClassName({ size: "sm", variant: "secondary" })}
                          href={`/admin/staff/${member.id}`}
                        >
                          <FilePenLine aria-hidden="true" className="h-4 w-4" />
                          Open
                        </Link>
                        {assignmentRequest && member.status === "active" ? (
                          isAssigned ? (
                            <Badge className="h-9 px-3" tone="green">
                              Assigned
                            </Badge>
                          ) : (
                            <form action={assignStaffToRequestAction}>
                              <input name="requestId" type="hidden" value={assignmentRequest.id} />
                              <input name="staffUserId" type="hidden" value={member.id} />
                              <button className={buttonClassName({ size: "sm" })} type="submit">
                                Assign
                              </button>
                            </form>
                          )
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid justify-items-center gap-3 px-5 py-14 text-center">
          <Users aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">No staff accounts are available</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create the first account before assigning client work.
            </p>
          </div>
          <Link className={buttonClassName()} href="/admin/staff/new">
            <Plus aria-hidden="true" className="h-4 w-4" />
            New staff account
          </Link>
        </div>
      )}
    </AdminPageSurface>
  );
}
