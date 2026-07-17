import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, ClipboardCheck, Mail, UserRound } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState, staffDate, staffStatusLabel, staffStatusTone } from "@/components/dashboard/staff/staff-work-ui";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StaffClientDetailData } from "@/repositories/staff-work-repository";

export function StaffClientDetail({ data }: { data: StaffClientDetailData }) {
  const { client, workflows, requests, reviews } = data;

  return (
    <div className="grid gap-5">
      <AdminPageSurface
        actions={(
          <Link className={buttonClassName({ variant: "secondary" })} href="/staff/clients">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to clients
          </Link>
        )}
        description="Contact details and all work connected to this client in your workspace."
        icon={UserRound}
        summary={[
          { label: "Active engagements", value: client.activeEngagements, helper: "Work currently open", icon: BriefcaseBusiness },
          { label: "Assigned requests", value: client.pendingRequests, helper: "Waiting to begin", icon: ClipboardCheck },
        ]}
        title={client.name}
      >
        <div className="grid gap-0 divide-y divide-border p-5">
          {[
            ["Email", client.email ?? "Not available"],
            ["Organization", client.organization || "Not available"],
            ["Services", client.services.join(", ") || "Not set"],
            ["Last activity", staffDate(client.lastActivityAt)],
          ].map(([label, value]) => (
            <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[180px_1fr]" key={label}>
              <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
              <dd className="text-sm font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </div>
      </AdminPageSurface>

      <Card>
        <CardHeader><CardTitle>Engagements</CardTitle></CardHeader>
        <CardContent className="p-0">
          {workflows.length === 0 ? (
            <StaffEmptyState description="This client does not have an engagement visible in your workspace yet." title="No engagement yet" />
          ) : (
            <div className="divide-y divide-border">
              {workflows.map((workflow) => (
                <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center" key={workflow.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{workflow.reference}</p>
                      <Badge tone={staffStatusTone(workflow.status)}>{staffStatusLabel(workflow.status)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{workflow.serviceName} / {workflow.currentStageName}</p>
                  </div>
                  <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/engagements/${workflow.id}`}>
                    Open engagement
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {requests.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Assigned requests</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {requests.map((request) => (
              <div className="p-5" key={request.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{request.reference}</p>
                  <Badge tone={staffStatusTone(request.status)}>{staffStatusLabel(request.status)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{request.serviceName}</p>
                <p className="mt-3 text-sm text-foreground">Next action: {request.nextAction}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {reviews.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>KYC status</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {reviews.map((review) => (
              <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center" key={review.id}>
                <div>
                  <Badge tone={staffStatusTone(review.status)}>{staffStatusLabel(review.status)}</Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Questionnaire {review.questionnaireComplete ? "complete" : "incomplete"}; {review.documentCount} document(s)
                  </p>
                </div>
                {client.email ? (
                  <a className={buttonClassName({ variant: "secondary", size: "sm" })} href={`mailto:${client.email}`}>
                    <Mail aria-hidden="true" className="h-4 w-4" />
                    Email client
                  </a>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
