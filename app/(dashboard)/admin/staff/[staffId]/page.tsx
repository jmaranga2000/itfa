import Link from "next/link";
import { ArrowLeft, UserCog } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffAccountForm } from "@/components/dashboard/admin/staff-account-form";
import { StaffAccountLifecycle } from "@/components/dashboard/admin/staff-account-lifecycle";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { requirePermission } from "@/features/auth/server";
import { updateStaffAccountAction } from "@/features/staff/actions";
import { getStaffForAdmin } from "@/repositories/user-repository";

export default async function StaffAccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ staffId: string }>;
  searchParams: Promise<{ created?: string; error?: string; saved?: string }>;
}) {
  await requirePermission("staff.manage");
  const [{ staffId }, query] = await Promise.all([params, searchParams]);
  const staff = await getStaffForAdmin(staffId);
  if (!staff) notFound();

  const name = `${staff.firstName} ${staff.lastName}`.trim() || staff.email;
  return (
    <AdminPageSurface
      actions={
        <Link className={buttonClassName({ variant: "secondary" })} href="/admin/staff">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to staff
        </Link>
      }
      description="Update the staff member’s profile, role, account status or sign-in password."
      icon={UserCog}
      title={name}
    >
      {query.created || query.saved ? (
        <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">
          <Badge tone="green">{query.created ? "Created" : "Saved"}</Badge>
          The staff account is up to date.
        </div>
      ) : null}
      {query.error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">
          {query.error === "email"
            ? "An account already uses that email address."
            : "Check the fields and password requirements."}
        </p>
      ) : null}
      <StaffAccountForm
        action={updateStaffAccountAction}
        staff={staff}
        submitLabel="Save changes"
      />
      <StaffAccountLifecycle
        name={name}
        staffId={staff.id}
        status={staff.status}
      />
    </AdminPageSurface>
  );
}
