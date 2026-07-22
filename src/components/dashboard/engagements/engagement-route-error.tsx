"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";

export function EngagementRouteError({
  backHref,
  reset,
}: {
  backHref: string;
  reset: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/45 p-4" role="presentation">
      <section
        aria-labelledby="engagement-error-title"
        aria-modal="true"
        className="w-full max-w-md rounded-md border border-border bg-card p-5 shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-danger-soft text-danger">
            <AlertTriangle aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground" id="engagement-error-title">
              This engagement could not be opened
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your work is still saved. Try loading it again, or return to the engagement list.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link className={buttonClassName({ variant: "secondary" })} href={backHref}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to engagements
          </Link>
          <button className={buttonClassName()} onClick={reset} type="button">
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Try again
          </button>
        </div>
      </section>
    </div>
  );
}
