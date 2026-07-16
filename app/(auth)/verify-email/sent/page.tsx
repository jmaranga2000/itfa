import Link from "next/link";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VerifyEmailSentPage({
  searchParams,
}: {
  searchParams?: Promise<{
    email?: string;
    error?: string;
    delivery?: string;
    preview?: string;
    resent?: string;
    sent?: string;
  }>;
}) {
  const params = await searchParams;
  const email = params?.email ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
        <CardDescription>
          We sent a verification link to your email. Open your inbox, confirm the address, and the
          link will bring you back to the portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {params?.resent ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            A new verification link has been prepared.
          </div>
        ) : null}

        {params?.delivery === "failed" ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-800">
            We could not send the verification email. Check the Resend API key and use an address from
            a verified Resend domain, then try again.
          </div>
        ) : null}

        {params?.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
            The verification link is missing, expired, or already used. Request a fresh link below.
          </div>
        ) : null}

        {email ? (
          <div className="rounded-md border border-border bg-muted/50 px-3 py-3">
            <p className="text-sm font-semibold text-foreground">{email}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Keep this page open if you need to send another verification link.
            </p>
          </div>
        ) : null}

        {params?.preview ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-900">
            Email delivery is not configured locally. Use this development verification link:{" "}
            <Link className="font-semibold underline" href={params.preview}>
              verify email
            </Link>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {email ? <ResendVerificationForm email={email} /> : null}
          <Link className={buttonClassName({ variant: "ghost" })} href="/sign-in">
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
