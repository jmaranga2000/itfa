"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function ActionErrorPopup({ message, title = "Action could not be completed" }: { message: string; title?: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <section className="fixed left-4 right-4 top-20 z-[90] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-md border border-danger/30 bg-card p-4 shadow-2xl sm:left-auto sm:right-6 sm:w-[26rem]" role="alert">
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">{message}</p>
      </div>
      <button aria-label="Dismiss error" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setOpen(false)} type="button">
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </section>
  );
}
