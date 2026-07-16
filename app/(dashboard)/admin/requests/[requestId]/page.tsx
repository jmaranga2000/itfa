import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleAlert, FileText, MessageSquareText, UserRoundCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminRequest } from "@/content/admin-requests";

function statusTone(status: string) {
  if (status === "Ready to convert") return "green" as const;
  if (status === "Clarification" || status === "KYC required") return "gold" as const;
  return "teal" as const;
}

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const request = getAdminRequest(requestId);

  if (!request) notFound();

  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" href="/admin/requests">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Back to requests
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone="teal">{request.reference}</Badge>
              <Badge tone={statusTone(request.status)}>{request.status}</Badge>
              <Badge tone={request.priority === "High" ? "red" : "slate"}>{request.priority} priority</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-foreground">{request.service}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{request.requestSummary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonClassName({ variant: "secondary" })} href="/admin/clients">
              <UserRoundCheck aria-hidden="true" className="h-4 w-4" />
              Open client
            </Link>
            <Link className={buttonClassName()} href="/admin/active-engagements">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              Set up engagement
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Client", request.client],
          ["Primary contact", request.clientContact],
          ["Submitted", request.submitted],
          ["Current owner", request.owner],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-base">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Requested outcome</CardTitle>
              <CardDescription>What the client expects from this engagement.</CardDescription>
            </CardHeader>
            <CardContent><p className="text-sm leading-6 text-foreground">{request.requestedOutcome}</p></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Proposed scope</CardTitle>
              <CardDescription>Confirm these items before activating the engagement.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {request.scope.map((item, index) => (
                <div className="flex gap-3 border-l-2 border-primary pl-3" key={item}>
                  <span className="text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <p className="text-sm leading-6 text-foreground">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Request history</CardTitle>
              <CardDescription>Key intake events for this request.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {request.timeline.map((event) => (
                <div className="grid gap-1 border-l-2 border-border pl-3" key={event.at}>
                  <p className="text-xs font-semibold text-muted-foreground">{event.at}</p>
                  <p className="text-sm font-semibold text-foreground">{event.title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{event.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Admin actions</CardTitle>
              <CardDescription>Move the request forward with the appropriate next step.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link className={buttonClassName({ className: "w-full" })} href="/admin/active-engagements">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Approve and set up work
              </Link>
              <Link className={buttonClassName({ variant: "secondary", className: "w-full" })} href="/admin/messages">
                <MessageSquareText aria-hidden="true" className="h-4 w-4" />
                Request clarification
              </Link>
              <Link className={buttonClassName({ variant: "secondary", className: "w-full" })} href="/admin/staff">
                <UserRoundCheck aria-hidden="true" className="h-4 w-4" />
                Assign an owner
              </Link>
              <Link className={buttonClassName({ variant: "secondary", className: "w-full" })} href="/admin/kyc">
                <CircleAlert aria-hidden="true" className="h-4 w-4" />
                Open KYC review
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Documents checklist</CardTitle>
              <CardDescription>Review what is ready and what the client still needs to provide.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {request.documents.map((document) => (
                <div className="flex items-start gap-3 rounded-md border border-border px-3 py-3" key={document.label}>
                  <FileText aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{document.label}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">{document.status}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
