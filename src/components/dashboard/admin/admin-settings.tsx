import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const settingGroups = [
  {
    label: "Security",
    status: "Configured",
    items: ["Session duration", "Password policy", "Email verification", "Audit logging"],
  },
  {
    label: "Portal defaults",
    status: "Review",
    items: ["Client onboarding", "Staff assignment", "Theme preference", "Timezone"],
  },
  {
    label: "Notifications",
    status: "Draft",
    items: ["KYC alerts", "Invoice reminders", "Staff task updates", "Client messages"],
  },
  {
    label: "Integrations",
    status: "Review",
    items: ["MongoDB", "Email provider", "Payments", "AI workspace"],
  },
];

const safeguards = [
  "Sensitive changes should write an audit record.",
  "Secrets should stay in environment variables, never in UI state.",
  "Permission changes should be reviewed from the Roles and permissions page.",
];

function statusTone(status: string) {
  if (status === "Configured") {
    return "green" as const;
  }

  if (status === "Review") {
    return "gold" as const;
  }

  return "slate" as const;
}

export function AdminSettings() {
  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Badge tone="teal">Admin settings</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Platform settings
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Manage the operational settings that control security, portal defaults,
              notifications, integrations and audit readiness.
            </p>
          </div>
          <div className="rounded-md border border-brand-mist-strong bg-brand-soft px-4 py-3">
            <p className="font-mono text-xs font-semibold text-muted-foreground">SETTINGS</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {settingGroups.length} groups
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Configured groups</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {settingGroups.filter((group) => group.status === "Configured").length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Settings with production-ready defaults.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Needs review</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {settingGroups.filter((group) => group.status === "Review").length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Groups to validate before launch or handover.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Setting items</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {settingGroups.reduce((total, group) => total + group.items.length, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Individual settings grouped by admin responsibility.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-4 md:grid-cols-2">
          {settingGroups.map((group) => (
            <div className="rounded-md border border-border bg-card p-4" key={group.label}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">{group.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {group.items.length} configurable items
                  </p>
                </div>
                <Badge tone={statusTone(group.status)}>{group.status}</Badge>
              </div>
              <div className="mt-4 grid gap-2">
                {group.items.map((item) => (
                  <div
                    className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Change safeguards</CardTitle>
            <CardDescription>Rules for future settings mutations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {safeguards.map((safeguard, index) => (
              <div className="rounded-md border border-border px-3 py-3" key={safeguard}>
                <p className="font-mono text-xs font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{safeguard}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
