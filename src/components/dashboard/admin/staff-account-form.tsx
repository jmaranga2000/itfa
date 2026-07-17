import Link from "next/link";
import { Save } from "lucide-react";
import { ROLE_LABELS } from "@/features/authorization/roles";
import { STAFF_ACCOUNT_ROLES } from "@/features/staff/types";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { AdminDirectoryUser } from "@/repositories/user-repository";

export function StaffAccountForm({
  action,
  staff,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  staff?: AdminDirectoryUser;
  submitLabel: string;
}) {
  return (
    <form action={action}>
      {staff ? <input name="staffId" type="hidden" value={staff.id} /> : null}
      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="grid content-start gap-5">
          <div>
            <h2 className="text-base font-bold text-foreground">Staff profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These details identify the staff member in the admin and staff portals.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                defaultValue={staff?.firstName}
                id="firstName"
                maxLength={80}
                name="firstName"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                defaultValue={staff?.lastName}
                id="lastName"
                maxLength={80}
                name="lastName"
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              defaultValue={staff?.email}
              id="email"
              name="email"
              type="email"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">
              {staff ? "Reset password" : "Temporary password"}
            </Label>
            <Input
              id="password"
              name="password"
              placeholder={staff ? "Leave blank to keep the current password" : "At least 12 characters"}
              required={!staff}
              type="password"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Use at least 12 characters with uppercase, lowercase, a number and a symbol.
            </p>
          </div>
        </section>

        <aside className="grid content-start gap-5 rounded-md border border-border bg-muted/20 p-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Access</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the staff function and whether the account can sign in.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Staff role</Label>
            <Select
              defaultValue={staff?.roleKeys[0] ?? "consultant"}
              id="role"
              name="role"
            >
              {STAFF_ACCOUNT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Account status</Label>
            <Select defaultValue={staff?.status ?? "active"} id="status" name="status">
              <option value="active">Active - can sign in</option>
              <option value="suspended">Suspended - cannot sign in</option>
            </Select>
          </div>
        </aside>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 p-4 sm:flex-row sm:justify-end">
        <Link
          className={buttonClassName({ className: "w-full sm:w-auto", variant: "secondary" })}
          href="/admin/staff"
        >
          Cancel
        </Link>
        <SubmitButton className="w-full sm:w-auto" pendingText="Saving account...">
          <Save aria-hidden="true" className="h-4 w-4" />
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
