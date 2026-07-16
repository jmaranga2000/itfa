import Link from "next/link";
import { requestPasswordResetAction } from "@/features/auth/actions";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
        <CardDescription>Enter the email address linked to your portal account.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {params.sent ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            If an account uses that email, a password reset link is on its way.
          </div>
        ) : null}
        {params.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">
            {params.error === "expired-link" ? "That reset link has expired. Request a new one below." : "Enter a valid email address."}
          </div>
        ) : null}
        <form action={requestPasswordResetAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input autoComplete="email" id="email" name="email" required type="email" />
          </div>
          <SubmitButton pendingText="Sending reset link...">Send reset link</SubmitButton>
        </form>
        <Link className={buttonClassName({ variant: "secondary", className: "w-full" })} href="/sign-in">
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
