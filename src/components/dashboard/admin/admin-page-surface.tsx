import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { LayoutList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AdminSummaryItem = {
  label: string;
  value: string | number;
  helper: string;
  icon?: LucideIcon;
};

export function AdminPageSurface({
  title,
  description,
  icon: PageIcon = LayoutList,
  actions,
  summary = [],
  children,
  footer,
  contentClassName,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  summary?: AdminSummaryItem[];
  children: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
}) {
  return (
    <Card className="overflow-hidden shadow-none">
      <CardHeader className="gap-5 border-b border-border">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-primary">
              <PageIcon aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription className="mt-1 max-w-3xl">{description}</CardDescription>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        {summary.length > 0 ? (
          <div
            className={cn(
              "grid overflow-hidden rounded-md border border-border bg-background",
              summary.length === 1
                ? "sm:grid-cols-1"
                : summary.length === 3
                  ? "sm:grid-cols-3"
                  : "sm:grid-cols-2 xl:grid-cols-4",
            )}
          >
            {summary.map((item, index) => {
              const Icon = item.icon ?? LayoutList;

              return (
                <div
                  className={cn(
                    "flex min-w-0 items-center gap-3 px-4 py-3",
                    index > 0 && "border-t border-border sm:border-t-0",
                    summary.length === 3
                      ? index > 0 && "sm:border-l"
                      : index % 2 === 1 && "sm:border-l",
                    summary.length !== 3 && index > 1 && "sm:border-t xl:border-t-0",
                    summary.length !== 3 && index > 0 && "xl:border-l",
                  )}
                  key={item.label}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-soft text-primary">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">{item.value}</span>
                      <span className="truncate text-sm font-semibold text-foreground">
                        {item.label}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{item.helper}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className={cn("p-0", contentClassName)}>{children}</CardContent>
      {footer ? <div className="border-t border-border bg-muted/20 p-4">{footer}</div> : null}
    </Card>
  );
}
