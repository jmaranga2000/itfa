import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type PortalMetric = {
  label: string;
  value: string;
  helper: string;
};

export type PortalAction = {
  label: string;
  href: string;
  symbol: string;
  tone?: "slate" | "teal" | "gold" | "red" | "green";
};

export function PortalShell({
  eyebrow,
  title,
  description,
  metrics,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  metrics: PortalMetric[];
  actions: PortalAction[];
}) {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link className="text-sm font-semibold text-muted-foreground" href="/">
              IFTA Consulting
            </Link>
            <Badge tone="teal">{eyebrow}</Badge>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-normal text-foreground">{title}</h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <CardHeader>
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-2xl">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{metric.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workspace Actions</CardTitle>
            <CardDescription>Permission-scoped entry points for this role.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {actions.map((action) => (
              <Link
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                href={action.href}
                key={action.label}
              >
                <span className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-muted text-xs font-bold text-foreground">
                    {action.symbol}
                  </span>
                  {action.label}
                </span>
                <Badge tone={action.tone ?? "slate"}>Open</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
