import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/features/auth/server";
import { ROLE_LABELS } from "@/features/authorization/roles";
import {
  getRegisteredClientForAdmin,
  type AdminDirectoryUser,
} from "@/repositories/user-repository";

function displayName(client: AdminDirectoryUser) {
  const name = `${client.firstName} ${client.lastName}`.trim();
  return name || "Unnamed client";
}

function initials(client: AdminDirectoryUser) {
  const value = `${client.firstName.at(0) ?? ""}${client.lastName.at(0) ?? ""}`.trim();
  return value || client.email.at(0)?.toUpperCase() || "C";
}

function dateLabel(value: string | null, includeTime = false) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === "active") return "green" as const;
  if (status === "invited") return "gold" as const;
  if (status === "suspended") return "red" as const;
  return "slate" as const;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-border py-4 last:border-0 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
      <dt className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const [{ clientId }] = await Promise.all([params, requirePermission("clients.read")]);
  const client = await getRegisteredClientForAdmin(clientId);

  if (!client) notFound();

  const clientName = displayName(client);
  const roles = client.roleKeys.map((role) => ROLE_LABELS[role]).join(", ");
  const readiness = [
    {
      complete: Boolean(client.emailVerifiedAt),
      label: "Email address verified",
      detail: client.emailVerifiedAt
        ? `Verified ${dateLabel(client.emailVerifiedAt)}`
        : "Client still needs to verify their email",
    },
    {
      complete: client.status === "active",
      label: "Portal access is active",
      detail:
        client.status === "active"
          ? "The client can sign in"
          : `Current access state: ${client.status}`,
    },
    {
      complete: Boolean(client.lastLoginAt),
      label: "First portal visit completed",
      detail: client.lastLoginAt
        ? `Last signed in ${dateLabel(client.lastLoginAt, true)}`
        : "No successful sign-in has been recorded",
    },
    {
      complete: client.clientOrganizationCount > 0,
      label: "Organization profile linked",
      detail:
        client.clientOrganizationCount > 0
          ? `${client.clientOrganizationCount} organization profile linked`
          : "No organization profile is linked yet",
    },
    {
      complete: client.assignedEngagementCount > 0,
      label: "Client work linked",
      detail:
        client.assignedEngagementCount > 0
          ? `${client.assignedEngagementCount} request or workspace linked`
          : "No request or workspace is linked yet",
    },
  ];
  const readinessComplete = readiness.filter((item) => item.complete).length;
  const accountSummary: Array<{
    icon: LucideIcon;
    label: string;
    value: ReactNode;
  }> = [
    { icon: CalendarDays, label: "Joined", value: dateLabel(client.createdAt) },
    { icon: Clock3, label: "Last sign-in", value: dateLabel(client.lastLoginAt) },
    { icon: Building2, label: "Organizations", value: client.clientOrganizationCount },
    {
      icon: BriefcaseBusiness,
      label: "Linked work",
      value: client.assignedEngagementCount,
    },
  ];

  return (
    <div className="grid min-w-0 gap-5">
      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-l-4 border-l-primary p-5 md:p-6">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            href="/admin/clients"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to clients
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-primary text-lg font-bold text-primary-foreground">
                {initials(client)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={statusTone(client.status)}>{client.status}</Badge>
                  <Badge tone={client.emailVerifiedAt ? "green" : "gold"}>
                    {client.emailVerifiedAt ? "Email verified" : "Verification pending"}
                  </Badge>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-foreground">{clientName}</h1>
                <p className="mt-1 break-all text-sm text-muted-foreground">{client.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                className={buttonClassName({ variant: "secondary" })}
                href={`mailto:${client.email}`}
              >
                <Mail aria-hidden="true" className="h-4 w-4" />
                Email client
              </a>
              <Link className={buttonClassName()} href="/admin/requests">
                <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />
                View requests
              </Link>
            </div>
          </div>
        </div>

        <div className="grid border-t border-border bg-muted/20 sm:grid-cols-2 xl:grid-cols-4">
          {accountSummary.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                className={[
                  "flex min-w-0 items-center gap-3 px-5 py-4",
                  index > 0 ? "border-t border-border sm:border-t-0" : "",
                  index % 2 === 1 ? "sm:border-l" : "",
                  index > 1 ? "sm:border-t xl:border-t-0" : "",
                  index > 0 ? "xl:border-l" : "",
                ].join(" ")}
                key={item.label}
              >
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Client profile</CardTitle>
            <CardDescription>
              Identity, access, verification and linked account information in one ordered record.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-1 pt-0">
            <dl>
              <DetailRow icon={UserRound} label="Full name" value={clientName} />
              <DetailRow icon={Mail} label="Email address" value={client.email} />
              <DetailRow icon={KeyRound} label="Portal role" value={roles} />
              <DetailRow
                icon={ShieldCheck}
                label="Access status"
                value={<Badge tone={statusTone(client.status)}>{client.status}</Badge>}
              />
              <DetailRow
                icon={FileCheck2}
                label="Email verification"
                value={dateLabel(client.emailVerifiedAt, true)}
              />
              <DetailRow
                icon={CalendarDays}
                label="Account created"
                value={dateLabel(client.createdAt, true)}
              />
              <DetailRow
                icon={Clock3}
                label="Last successful sign-in"
                value={dateLabel(client.lastLoginAt, true)}
              />
              <DetailRow
                icon={Clock3}
                label="Profile last updated"
                value={dateLabel(client.updatedAt, true)}
              />
              <DetailRow
                icon={Building2}
                label="Linked organizations"
                value={client.clientOrganizationCount}
              />
              <DetailRow
                icon={BriefcaseBusiness}
                label="Linked requests and workspaces"
                value={client.assignedEngagementCount}
              />
              <DetailRow
                icon={KeyRound}
                label="Additional permissions"
                value={
                  client.directPermissions.length > 0
                    ? client.directPermissions.join(", ")
                    : "No additional permissions"
                }
              />
              <DetailRow
                icon={CalendarDays}
                label="Archived date"
                value={dateLabel(client.archivedAt, true)}
              />
            </dl>
          </CardContent>
        </Card>

        <aside className="grid content-start gap-5">
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Account readiness</CardTitle>
                  <CardDescription>What is complete and what still needs attention.</CardDescription>
                </div>
                <Badge tone={readinessComplete === readiness.length ? "green" : "gold"}>
                  {readinessComplete}/{readiness.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {readiness.map((item) => (
                <div className="flex gap-3 px-4 py-4" key={item.label}>
                  {item.complete ? (
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                    />
                  ) : (
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Continue client review</CardTitle>
              <CardDescription>Open the related administration areas.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link
                className={buttonClassName({ className: "w-full justify-start" })}
                href="/admin/requests"
              >
                <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />
                Engagement requests
              </Link>
              <Link
                className={buttonClassName({
                  className: "w-full justify-start",
                  variant: "secondary",
                })}
                href="/admin/kyc"
              >
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                KYC reviews
              </Link>
              <Link
                className={buttonClassName({
                  className: "w-full justify-start",
                  variant: "secondary",
                })}
                href="/admin/active-engagements"
              >
                <FileCheck2 aria-hidden="true" className="h-4 w-4" />
                Active engagements
              </Link>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
