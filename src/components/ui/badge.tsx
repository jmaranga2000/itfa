import type * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "slate" | "teal" | "gold" | "red" | "green" | "purple" | "dark";

const toneClasses: Record<BadgeTone, string> = {
  slate: "ifta-badge-neutral",
  teal: "ifta-badge-brand",
  gold: "ifta-badge-warning",
  red: "ifta-badge-danger",
  green: "ifta-badge-success",
  purple: "ifta-badge-info",
  dark: "ifta-badge-strong",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
