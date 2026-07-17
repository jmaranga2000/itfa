import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffAccountForm } from "@/components/dashboard/admin/staff-account-form";
import { buttonClassName } from "@/components/ui/button";
import { requirePermission } from "@/features/auth/server";
import { createStaffAccountAction } from "@/features/staff/actions";

export default async function NewStaffAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("staff.manage");
  const query = await searchParams;

  return (
    <AdminPageSurface
      actions={
        <Link className={buttonClassName({ variant: "secondary" })} href="/admin/staff">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to staff
        </Link>
      }
      description="Create the staff member’s portal account, role and temporary sign-in password."
      icon={UserPlus}
      title="New staff account"
    >
      {query.error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">
          {query.error === "email"
            ? "An account already uses that email address."
            : "Check every field and use a stronger temporary password."}
        </p>
      ) : null}
      <StaffAccountForm action={createStaffAccountAction} submitLabel="Create account" />
    </AdminPageSurface>
  );
}
