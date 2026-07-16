import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clientModules } from "@/constants/dashboard-modules";
import { getModuleCode, getPrimaryAction } from "@/lib/dashboard/module-page-utils";

const pageModule = clientModules.payments;

export function ClientPayments() {
  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Badge tone="teal">{pageModule.eyebrow}</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              {pageModule.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {pageModule.description}
            </p>
          </div>
          <div className="rounded-md border border-border px-4 py-3">
            <p className="font-mono text-xs font-semibold text-muted-foreground">
              {getModuleCode(pageModule)}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {getPrimaryAction(pageModule)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {pageModule.metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl font-bold">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{pageModule.title} services</CardTitle>
            <CardDescription>Available tools and information for this area.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {pageModule.services.map((service) => (
              <div className="rounded-md border border-border bg-muted/40 px-3 py-3 text-sm font-medium text-foreground" key={service}>
                {service}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{pageModule.title} actions</CardTitle>
            <CardDescription>Actions available for the current portal role.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {pageModule.actions.map((action, index) => (
              <button
                className={buttonClassName({
                  variant: index === 0 ? "primary" : "secondary",
                  className: "w-full",
                })}
                key={action}
                type="button"
              >
                {action}
              </button>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{pageModule.title} workflow</CardTitle>
          <CardDescription>How work moves through this area.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          {pageModule.workflow.map((step, index) => (
            <div className="border-t-2 border-primary pt-3" key={step}>
              <p className="font-mono text-xs font-semibold text-primary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
