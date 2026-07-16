import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/features/authorization/roles";
import {
  getRegisteredClientForAdmin,
  type AdminDirectoryUser,
} from "@/repositories/user-repository";

function displayName(client: AdminDirectoryUser) {
  const name = `${client.firstName} ${client.lastName}`.trim();
  return name || "Unnamed client";
}

function dateLabel(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === "active") {
    return "green" as const;
  }

  if (status === "invited") {
    return "gold" as const;
  }

  if (status === "suspended") {
    return "red" as const;
  }

  return "slate" as const;
}

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getRegisteredClientForAdmin(clientId);

  if (!client) {
    notFound();
  }

  const roles = client.roleKeys.map((role) => ROLE_LABELS[role]).join(", ");
  const verification = client.emailVerifiedAt ? "Verified" : "Pending verification";
  const clientName = displayName(client);

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <Badge tone="red">Client detail</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              {clientName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Registered client account, portal access state, request links and organization
              coverage for admin review.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href="/admin/clients"
            >
              Back to clients
            </Link>
            <Link className={buttonClassName({ variant: "accent" })} href="/admin/requests">
              Review requests
            </Link>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <CardTitle>Client profile</CardTitle>
              <CardDescription>
                Identity, access, linked records, verification and admin review context.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone(client.status)}>{client.status}</Badge>
              <Badge tone={client.emailVerifiedAt ? "green" : "gold"}>{verification}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <dl className="rounded-md border border-border bg-background px-4">
            <DetailItem label="Full name" value={clientName} />
            <DetailItem label="Email" value={client.email} />
            <DetailItem label="Roles" value={roles} />
            <DetailItem label="Joined" value={dateLabel(client.createdAt)} />
            <DetailItem label="Last login" value={dateLabel(client.lastLoginAt)} />
            <DetailItem label="Email verified" value={dateLabel(client.emailVerifiedAt)} />
            <DetailItem label="Last updated" value={dateLabel(client.updatedAt)} />
            <DetailItem label="Organizations" value={client.clientOrganizationCount} />
            <DetailItem label="Linked requests" value={client.assignedEngagementCount} />
            <DetailItem label="Direct permissions" value={client.directPermissions.length} />
            <DetailItem label="Access status" value={client.status} />
            <DetailItem label="Archived at" value={dateLabel(client.archivedAt)} />
          </dl>

          <section className="rounded-md border border-border bg-background p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-sm font-bold text-foreground">Admin review context</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Use this profile to verify access, organization coverage and engagement request
                  readiness before activating client workspaces.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className={buttonClassName({ variant: "secondary", size: "sm" })}
                  href="/admin/kyc"
                >
                  Check KYC review state
                </Link>
                <Link
                  className={buttonClassName({ variant: "secondary", size: "sm" })}
                  href="/admin/active-engagements"
                >
                  Active engagements
                </Link>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-4">
              {[
                "Review submitted engagement requests",
                "Confirm organization profile coverage",
                "Check KYC review state",
                "Validate access before workspace activation",
              ].map((step, index) => (
                <div className="rounded-md border border-border px-3 py-3" key={step}>
                  <p className="font-mono text-xs font-semibold text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{step}</p>
                </div>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
