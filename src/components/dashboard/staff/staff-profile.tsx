import Image from "next/image";
import { Camera, KeyRound, Save, UserRound } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { isAppRole, ROLE_LABELS } from "@/features/authorization/roles";
import {
  changeStaffPasswordAction,
  updateStaffProfileAction,
  uploadStaffAvatarAction,
} from "@/features/staff/profile-actions";
import type { StaffProfileRecord } from "@/repositories/staff-profile-repository";

const errors: Record<string, string> = {
  profile: "Enter a valid first and last name.",
  "avatar-missing": "Choose an avatar image before uploading.",
  "avatar-size": "The avatar must be smaller than 3 MB.",
  "avatar-type": "Use a JPG, PNG or WebP image.",
  "avatar-upload": "The avatar could not be stored. Check the R2 configuration.",
  "current-password": "The current password is incorrect.",
  "password-policy": "The new passwords must match and meet the password requirements.",
  "password-same": "Choose a password that is different from the current password.",
};

function initials(profile: StaffProfileRecord) {
  return `${profile.firstName.at(0) ?? ""}${profile.lastName.at(0) ?? ""}`.toUpperCase() || "S";
}

export function StaffProfile({
  error,
  profile,
  success,
}: {
  error?: string;
  profile: StaffProfileRecord;
  success?: string;
}) {
  const roleLabel = isAppRole(profile.role) ? ROLE_LABELS[profile.role] : "Staff member";
  const avatarUrl = `/api/staff/avatar/${profile.id}?v=${encodeURIComponent(profile.avatarUpdatedAt ?? "none")}`;

  return (
    <AdminPageSurface
      description="Manage your staff identity, profile picture and sign-in password."
      icon={UserRound}
      title="My profile"
    >
      {success ? (
        <p className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">
          {success === "avatar" ? "Profile picture updated." : "Profile details updated."}
        </p>
      ) : null}
      {error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">
          {errors[error] ?? "The profile could not be updated."}
        </p>
      ) : null}

      <div className="grid gap-6 p-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="grid content-start gap-5 rounded-md border border-border bg-muted/20 p-5">
          <div className="grid justify-items-center gap-3 text-center">
            {profile.avatarUpdatedAt ? (
              <Image
                alt={`${profile.firstName} ${profile.lastName}`}
                className="h-24 w-24 rounded-full border-4 border-card object-cover shadow-sm"
                height={96}
                src={avatarUrl}
                unoptimized
                width={96}
              />
            ) : (
              <span className="grid h-24 w-24 place-items-center rounded-full bg-brand-deep text-2xl font-bold text-white">
                {initials(profile)}
              </span>
            )}
            <div>
              <p className="font-bold text-foreground">{profile.firstName} {profile.lastName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
              <Badge className="mt-3" tone="teal">{roleLabel}</Badge>
            </div>
          </div>
          <form action={uploadStaffAvatarAction} className="grid gap-3" encType="multipart/form-data">
            <div className="grid gap-2">
              <Label htmlFor="avatar">Profile picture</Label>
              <Input accept="image/jpeg,image/png,image/webp" id="avatar" name="avatar" required type="file" />
            </div>
            <SubmitButton pendingText="Uploading picture..." variant="secondary">
              <Camera aria-hidden="true" className="h-4 w-4" />
              Upload picture
            </SubmitButton>
          </form>
        </aside>

        <div className="grid content-start gap-6">
          <form action={updateStaffProfileAction} className="grid gap-4 rounded-md border border-border p-5">
            <div>
              <h2 className="font-bold text-foreground">Profile details</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your work email is managed by an administrator.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input defaultValue={profile.firstName} id="firstName" name="firstName" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input defaultValue={profile.lastName} id="lastName" name="lastName" required />
              </div>
            </div>
            <div className="flex justify-end">
              <SubmitButton pendingText="Saving profile...">
                <Save aria-hidden="true" className="h-4 w-4" />
                Save profile
              </SubmitButton>
            </div>
          </form>

          <form action={changeStaffPasswordAction} className="grid gap-4 rounded-md border border-border p-5">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-foreground">
                <KeyRound aria-hidden="true" className="h-4 w-4 text-primary" />
                Change password
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Changing your password signs out every active session.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <PasswordInput autoComplete="current-password" id="currentPassword" name="currentPassword" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">New password</Label>
                <PasswordInput autoComplete="new-password" id="newPassword" name="newPassword" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <PasswordInput autoComplete="new-password" id="confirmPassword" name="confirmPassword" required />
              </div>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">Use at least 12 characters with uppercase, lowercase, a number and a symbol.</p>
            <div className="flex justify-end">
              <SubmitButton pendingText="Changing password...">
                <KeyRound aria-hidden="true" className="h-4 w-4" />
                Change password
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </AdminPageSurface>
  );
}
