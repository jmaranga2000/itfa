import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";

export function EngagementUnavailable({ backHref }: { backHref: string }) {
  return (
    <section className="mx-auto grid w-full max-w-xl justify-items-center gap-4 rounded-md border border-border bg-card px-5 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-md bg-warning-soft text-warning">
        <AlertTriangle aria-hidden="true" className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-xl font-bold text-foreground">Engagement not available</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This record may have moved, been archived, or may not be assigned to your account.
        </p>
      </div>
      <Link className={buttonClassName()} href={backHref}>
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to engagements
      </Link>
    </section>
  );
}
