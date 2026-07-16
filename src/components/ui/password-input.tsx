"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PasswordInput({ className, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        {...props}
        className={cn(
          "h-10 w-full rounded-md border border-border bg-card px-3 pr-12 text-sm font-normal text-foreground shadow-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
          className,
        )}
        type={visible ? "text" : "password"}
      />
      <button
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        disabled={props.disabled}
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Eye aria-hidden="true" className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
