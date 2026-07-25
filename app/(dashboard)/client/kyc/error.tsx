"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";

export default function ClientKycError({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto grid w-full max-w-xl justify-items-center gap-4 rounded-md border border-border bg-card px-5 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-md bg-warning-soft text-warning">
        <AlertTriangle aria-hidden="true" className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-xl font-bold text-foreground">KYC needs another try</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your saved answers and uploaded documents are safe. Please try again, or return to your KYC overview.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link className={buttonClassName({ variant: "secondary" })} href="/client/kyc">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to KYC
        </Link>
        <button className={buttonClassName()} onClick={reset} type="button">
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Try again
        </button>
      </div>
    </section>
  );
}
