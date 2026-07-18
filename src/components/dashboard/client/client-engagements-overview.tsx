import Link from "next/link";
import { CheckCircle2, Clock3, FileText, ShoppingBag } from "lucide-react";
import { ClientWorkflowProgress } from "@/components/dashboard/workflows/client-workflow-progress";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { acceptQuotationAction } from "@/features/client/commerce-actions";
import type { EngagementRequestRecord } from "@/repositories/engagement-request-repository";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

const requestLabels: Record<EngagementRequestRecord["status"], string> = {
  admin_review: "Under review",
  quotation_requested: "Pricing requested",
  quotation_preparing: "Pricing in progress",
  quotation_sent: "Ready for your approval",
  clarification: "More information needed",
  approved: "Approved for setup",
  rejected: "Not proceeding",
  converted: "Engagement created",
};

function requestTone(status: EngagementRequestRecord["status"]) {
  if (status === "converted" || status === "approved") return "green" as const;
  if (status === "clarification" || status === "quotation_sent") return "gold" as const;
  return "teal" as const;
}

function requestLabel(request: EngagementRequestRecord) {
  if (request.status !== "approved") return requestLabels[request.status];
  if (!request.kycUnlockedAt) return "Approved, team assignment pending";
  if (!request.kycApprovedAt) return "Complete KYC";
  return "Engagement letter ready";
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(value));
}

export function ClientEngagementsOverview({
  requests,
  workflows,
  notice,
}: {
  requests: EngagementRequestRecord[];
  workflows: WorkflowInstanceRecord[];
  notice?: string;
}) {
  const openRequests = requests.filter((request) => request.status !== "converted");

  return (
    <div className="grid min-w-0 gap-5">
      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </p>
      ) : null}

      <section className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-center">
        <div>
          <Badge tone="teal">Your work with IFTA</Badge>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Requests and engagements</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Follow requests awaiting review and continue work once an engagement is active.
          </p>
        </div>
        <Link className={buttonClassName()} href="/client/services">
          <ShoppingBag aria-hidden="true" className="h-4 w-4" />
          Browse services
        </Link>
      </section>

      {openRequests.length > 0 ? (
        <section className="grid gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Requests being prepared</h2>
            <p className="text-sm text-muted-foreground">The administration team will move these into active work after review.</p>
          </div>
          {openRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={requestTone(request.status)}>{requestLabel(request)}</Badge>
                    <span className="text-xs font-semibold text-muted-foreground">{request.reference}</span>
                  </div>
                  <CardTitle className="mt-3">{request.items.map((item) => item.serviceTitle).join(", ")}</CardTitle>
                  <CardDescription>Submitted {dateLabel(request.submittedAt)}</CardDescription>
                </div>
                {request.quotationAmount ? (
                  <div className="text-left md:text-right">
                    <p className="text-xs font-semibold text-muted-foreground">Quoted fee</p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                      {request.quotationCurrency} {request.quotationAmount.toLocaleString("en-KE")}
                    </p>
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="grid gap-4 border-t border-border pt-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />{requestLabel(request)}</span>
                  <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" />{request.items.length} selected service{request.items.length === 1 ? "" : "s"}</span>
                </div>
                {request.status === "quotation_sent" ? (
                  <form action={acceptQuotationAction} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-3">
                    <input name="requestId" type="hidden" value={request.id} />
                    <p className="text-sm font-medium text-foreground">Accept this quotation so IFTA can set up your engagement.</p>
                    <SubmitButton pendingText="Accepting...">
                      <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                      Accept quotation
                    </SubmitButton>
                  </form>
                ) : request.status === "approved" && request.kycUnlockedAt && !request.kycApprovedAt ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-3"><p className="text-sm font-medium text-foreground">Complete your KYC information so the review team can prepare your engagement letter.</p><Link className={buttonClassName()} href="/client/kyc">Continue KYC</Link></div>
                ) : request.status === "approved" && request.kycApprovedAt ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-3"><p className="text-sm font-medium text-foreground">Your letter is ready to review and sign before work begins.</p><Link className={buttonClassName()} href="/client/documents">Review letter</Link></div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Active engagements</h2>
          <p className="text-sm text-muted-foreground">Live progress, actions and shared updates from your consulting team.</p>
        </div>
        <ClientWorkflowProgress showHeader={false} workflows={workflows} />
      </section>
    </div>
  );
}
