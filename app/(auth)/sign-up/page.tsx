import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create client account</CardTitle>
        <CardDescription>
          Start a secure engagement request and continue through KYC, letters and invoicing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {params?.error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
            {params.error}
          </div>
        ) : null}

        <SignUpForm />

        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Already have access?{" "}
          <Link className="font-semibold text-slate-950" href="/sign-in">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
