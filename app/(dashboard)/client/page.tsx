import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileCheck2,
  FileText,
  MessageSquareText,
  ReceiptText,
} from "lucide-react";
import { CommunicationWidget } from "@/components/dashboard/communication/communication-widget";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/features/auth/server";
import { getCommunicationHubData } from "@/repositories/communication-repository";

const clientMetrics = [
  { icon: BriefcaseBusiness, label: "Active engagements", value: "0", helper: "Approved workspaces currently in progress." },
  { icon: FileCheck2, label: "Actions required", value: "0", helper: "KYC, signatures and document requests." },
  { icon: MessageSquareText, label: "Unread messages", value: "0", helper: "New engagement-linked conversations." },
  { icon: ReceiptText, label: "Unpaid invoices", value: "0", helper: "Open finance records for your organization." },
] as const;

const timeline = [
  "Engagement request submitted",
  "Administrative review",
  "KYC and onboarding",
  "Engagement letter",
  "Active workspace",
] as const;

export default async function ClientDashboardPage() {
  const principal = await requireUser();
  const communication = await getCommunicationHubData(principal);

  return (
    <div className="grid min-w-0 gap-5">
      <section className="overflow-hidden rounded-md bg-brand-deep p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Badge tone="teal">Client dashboard</Badge>
            <h1 className="mt-4 max-w-3xl text-2xl font-bold leading-tight md:text-3xl">
              Your engagements, documents and next actions.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Track approved work, complete onboarding and keep every client-facing record connected to the correct engagement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonClassName({ variant: "accent" })} href="/client/cart">
              Request a service
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              className={buttonClassName({ className: "border-white/30 bg-transparent text-white hover:bg-white/10", variant: "ghost" })}
              href="/client/documents"
            >
              Open documents
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {clientMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle className="mt-2 text-3xl font-bold">{metric.value}</CardTitle>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-soft text-brand-deep">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{metric.helper}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Engagement journey</CardTitle>
            <CardDescription>Your next approved request will progress through these client-visible stages.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="divide-y divide-border border-y border-border">
              {timeline.map((item, index) => (
                <li className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 py-3" key={item}>
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-soft font-mono text-[10px] font-bold text-brand-deep">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{item}</span>
                  <span className="text-xs font-medium text-muted-foreground">Waiting</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Start here</CardTitle>
            <CardDescription>Common client actions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              ["Browse and request a service", "/client/cart"],
              ["Check KYC requirements", "/client/kyc"],
              ["Upload requested documents", "/client/documents"],
              ["Send a secure message", "/client/messages"],
            ].map(([label, href], index) => (
              <Link className="flex items-center gap-3 rounded-md border border-border px-3 py-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-brand-soft" href={href} key={label}>
                <span className="font-mono text-xs font-bold text-primary">0{index + 1}</span>
                <span className="min-w-0 flex-1">{label}</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Recently shared</CardTitle>
            <CardDescription>Documents appear here after access checks and validation.</CardDescription>
          </div>
          <FileText aria-hidden="true" className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed border-border bg-surface-subtle px-4 py-6 text-sm leading-6 text-muted-foreground">
            No documents have been shared yet. Request an engagement or complete KYC when it opens.
          </div>
        </CardContent>
      </Card>

      <CommunicationWidget data={communication} messagesHref="/client/messages" notificationsHref="/client/notifications" />
    </div>
  );
}
