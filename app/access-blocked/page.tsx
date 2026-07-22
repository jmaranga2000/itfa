import Link from "next/link";
import { ArrowLeft, Home, ShieldX } from "lucide-react";
import { getCurrentUser } from "@/features/auth/server";
import { buttonClassName } from "@/components/ui/button";

function workspaceHome(roleKeys: string[]) {
  if (roleKeys.some((role) => role === "admin" || role === "super_admin")) return "/admin/dashboard";
  if (roleKeys.some((role) => role === "client" || role === "client_representative")) return "/client";
  return "/staff";
}

export default async function AccessBlockedPage() {
  const principal = await getCurrentUser();
  const homeHref = principal ? workspaceHome(principal.roleKeys) : "/sign-in";

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-xl sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-md bg-danger-soft text-danger">
          <ShieldX aria-hidden="true" className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Access blocked</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your account does not have permission to open this page or perform this action. No information has been changed.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link className={buttonClassName()} href={homeHref}>
            <Home aria-hidden="true" className="h-4 w-4" />
            Return to my workspace
          </Link>
          <Link className={buttonClassName({ variant: "secondary" })} href="/contact">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Contact support
          </Link>
        </div>
      </section>
    </main>
  );
}
