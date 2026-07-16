import Link from "next/link";
import { resetPasswordAction } from "@/features/auth/actions";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; token?: string }>;
}) {
  const params = await searchParams;

  if (!params.token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Password reset link required</CardTitle>
          <CardDescription>Request a new password reset email to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link className={buttonClassName()} href="/forgot-password">Request reset link</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Choose a new password</CardTitle>
        <CardDescription>Use at least 8 characters, with uppercase, lowercase, a number and a symbol.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {params.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">
            {params.error === "password-mismatch" ? "The passwords do not match." : "Choose a stronger password and try again."}
          </div>
        ) : null}
        <form action={resetPasswordAction} className="grid gap-4">
          <input name="token" type="hidden" value={params.token} />
          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <PasswordInput autoComplete="new-password" id="password" name="password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <PasswordInput autoComplete="new-password" id="confirmPassword" name="confirmPassword" required />
          </div>
          <SubmitButton pendingText="Updating password...">Update password</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
