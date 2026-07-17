import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StaffWorkspace } from "@/features/staff/workspace";
import type { CommunicationSummary } from "@/repositories/communication-repository";

export function StaffDashboard({
  accessRestricted,
  assignedCount,
  summary,
  workspace,
}: {
  accessRestricted: boolean;
  assignedCount: number;
  summary: CommunicationSummary;
  workspace: StaffWorkspace;
}) {
  const metrics = [
    { label: "Assigned work", value: assignedCount, icon: BriefcaseBusiness },
    { label: "Unread messages", value: summary.unreadMessages, icon: MessageSquareText },
    { label: "New notifications", value: summary.unreadNotifications, icon: Bell },
    { label: "Open conversations", value: summary.openConversations, icon: CheckCircle2 },
  ];

  return (
    <div className="grid min-w-0 gap-5">
      {accessRestricted ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          That page is not part of your role. Your available work is shown below.
        </p>
      ) : null}

      <section className="rounded-md bg-brand-deep p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="teal">{workspace.roleLabel}</Badge>
              {workspace.role === "auditor" ? <Badge tone="slate">Read only</Badge> : null}
            </div>
            <h1 className="mt-4 text-2xl font-bold md:text-3xl">{workspace.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              {workspace.description}
            </p>
          </div>
          <Link className={buttonClassName({ variant: "accent" })} href={workspace.primaryLinks[0].href}>
            {workspace.primaryLinks[0].label}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div className="flex items-center justify-between gap-4 bg-card p-4" key={metric.label}>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{metric.value}</p>
              </div>
              <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader><CardTitle>Work areas</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {workspace.primaryLinks.map((item) => (
              <Link
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                href={item.href}
                key={item.href}
              >
                <span>
                  <span className="block font-semibold text-foreground">{item.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{item.description}</span>
                </span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="h-5 w-5 text-primary" />
              Current priorities
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {workspace.priorities.map((priority, index) => (
              <div className="flex items-start gap-3" key={priority}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-deep">
                  {index + 1}
                </span>
                <p className="pt-0.5 text-sm leading-5 text-foreground">{priority}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
