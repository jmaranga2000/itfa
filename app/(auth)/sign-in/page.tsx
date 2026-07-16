import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; verified?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>
          Access your client, staff or admin workspace with your portal account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {params?.error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
            {params.error}
          </div>
        ) : null}
        {params?.verified ? (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            Your email is verified. You can sign in now.
          </div>
        ) : null}

        <SignInForm />

        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          New client?{" "}
          <Link className="font-semibold text-slate-950" href="/sign-up">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
