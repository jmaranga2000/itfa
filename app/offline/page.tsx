import Link from "next/link";
import { ArrowLeft, RefreshCw, WifiOff } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-12 text-foreground">
      <section className="w-full max-w-lg border-l-4 border-primary bg-card p-6 shadow-sm sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-md bg-brand-soft text-brand-deep">
          <WifiOff aria-hidden="true" className="h-6 w-6" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase text-primary">IFTA Consulting</p>
        <h1 className="mt-2 text-2xl font-bold">You are currently offline</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Reconnect to open secure portal records, messages and documents. Public pages you visited recently may still be available.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <form action="/" method="get">
            <button className={buttonClassName()} type="submit">
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Try again
            </button>
          </form>
          <Link className={buttonClassName({ variant: "secondary" })} href="/">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
