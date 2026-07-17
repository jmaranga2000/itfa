import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import type { BadgeProps } from "@/components/ui/badge";

export function staffDate(value: string | null, includeYear = true) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" as const } : {}),
  }).format(new Date(value));
}

export function staffStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function staffStatusTone(value: string): BadgeProps["tone"] {
  if (["active", "approved", "completed", "final", "paid", "verified", "reconciled"].includes(value)) {
    return "green";
  }
  if (["blocked", "critical", "high", "overdue", "rejected", "failed"].includes(value)) {
    return "red";
  }
  if (["pending", "pending_review", "in_progress", "on_hold", "waiting_for_client", "awaiting_approval"].includes(value)) {
    return "gold";
  }
  return "slate";
}

export function StaffEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-64 place-items-center px-5 py-10 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-md bg-brand-soft text-primary">
          <Inbox aria-hidden="true" className="h-5 w-5" />
        </span>
        <h2 className="mt-4 font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
