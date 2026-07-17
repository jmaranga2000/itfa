import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeDollarSign,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  MessageSquareText,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminRequest } from "@/content/admin-requests";
import { requirePermission } from "@/features/auth/server";
import {
  convertEngagementRequestAction,
} from "@/features/client/request-admin-actions";
import { engagementRequestToAdminRecord, getEngagementRequestForAdmin } from "@/repositories/engagement-request-repository";
import { getRequestStaffAssignment } from "@/repositories/staff-assignment-repository";

function statusTone(status: string) {
  if (status === "Ready to convert") return "green" as const;
  if (status === "Clarification" || status === "KYC required") return "gold" as const;
  return "teal" as const;
}

function primaryAction(status: string) {
  if (status === "Ready to convert") {
    return {
      href: "/admin/active-engagements",
      label: "Set up engagement",
      icon: BriefcaseBusiness,
    };
  }

  if (status === "KYC required") {
    return {
      href: "/admin/kyc",
      label: "Open KYC review",
      icon: ShieldCheck,
    };
  }

  if (status === "Clarification") {
    return {
      href: "/admin/messages",
      label: "Request clarification",
      icon: MessageSquareText,
    };
  }

  return {
    href: "/admin/active-engagements",
    label: "Approve and set up work",
    icon: CheckCircle2,
  };
}

export default async function AdminRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ assigned?: string; quoted?: string; error?: string }>;
}) {
  const [{ requestId }, query] = await Promise.all([
    params,
    searchParams,
    requirePermission("engagements.read_all"),
  ]);
  const databaseRequest = await getEngagementRequestForAdmin(requestId);
  const request = databaseRequest ? engagementRequestToAdminRecord(databaseRequest) : getAdminRequest(requestId);

  if (!request) notFound();
  const assignment = await getRequestStaffAssignment(requestId);

  const receivedDocuments = request.documents.filter(
    (document) => document.status === "Received",
  ).length;
  const missingDocuments = request.documents.length - receivedDocuments;
  const action = primaryAction(request.status);
  const ActionIcon = action.icon;

  return (
    <div className="grid min-w-0 gap-5">
      {query.assigned === "1" && assignment ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {assignment.staffName} has been assigned to this request.
        </p>
      ) : null}
      {query.quoted === "1" ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          The quotation was sent to the client for acceptance.
        </p>
      ) : null}
      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-l-4 border-l-primary p-5 md:p-6">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            href="/admin/requests"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to requests
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="teal">{request.reference}</Badge>
                <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                <Badge tone={request.priority === "High" ? "red" : "slate"}>
                  {request.priority} priority
                </Badge>
              </div>
              <h1 className="mt-3 text-2xl font-bold text-foreground">{request.service}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {request.requestSummary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                className={buttonClassName({ variant: "secondary" })}
                href="/admin/clients"
              >
                <UserRound aria-hidden="true" className="h-4 w-4" />
                Client directory
              </Link>
              {databaseRequest && ["quotation_requested", "quotation_preparing", "quotation_sent"].includes(databaseRequest.status) ? (
                <Link className={buttonClassName()} href={`/admin/quotations/${request.id}`}>
                  <BadgeDollarSign aria-hidden="true" className="h-4 w-4" />
                  {databaseRequest.status === "quotation_sent" ? "Open quotation" : "Prepare quotation"}
                </Link>
              ) : request.source === "database" && !request.workflowId ? (
                <form action={convertEngagementRequestAction}>
                  <input name="requestId" type="hidden" value={request.id} />
                  <SubmitButton pendingText="Creating engagement...">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    Approve and create engagement
                  </SubmitButton>
                </form>
              ) : (
                <Link className={buttonClassName()} href={request.workflowId ? `/admin/workflows/${request.workflowId}` : action.href}>
                  <ActionIcon aria-hidden="true" className="h-4 w-4" />
                  {request.workflowId ? "Open engagement" : action.label}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid border-t border-border bg-muted/20 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: UserRound, label: "Client", value: request.client },
            { icon: MessageSquareText, label: "Primary contact", value: request.clientContact },
            { icon: Clock3, label: "Submitted", value: request.submitted },
            { icon: UserRoundCheck, label: "Current owner", value: request.owner },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                className={[
                  "flex min-w-0 items-start gap-3 px-5 py-4",
                  index > 0 ? "border-t border-border sm:border-t-0" : "",
                  index % 2 === 1 ? "sm:border-l" : "",
                  index > 1 ? "sm:border-t xl:border-t-0" : "",
                  index > 0 ? "xl:border-l" : "",
                ].join(" ")}
                key={item.label}
              >
                <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-bold leading-5 text-foreground">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="grid content-start gap-5">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Request brief</CardTitle>
              <CardDescription>
                The client’s need, expected result and the scope currently under review.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 p-5">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Client request</p>
                <p className="mt-2 text-sm leading-7 text-foreground">{request.requestSummary}</p>
              </div>
              <div className="border-t border-border pt-5">
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  Expected outcome
                </p>
                <p className="mt-2 text-sm leading-7 text-foreground">
                  {request.requestedOutcome}
                </p>
              </div>
              <div className="border-t border-border pt-5">
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  Proposed scope
                </p>
                <ol className="mt-4 grid gap-4">
                  {request.scope.map((item, index) => (
                    <li className="flex gap-3" key={item}>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <p className="pt-0.5 text-sm leading-6 text-foreground">{item}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    Evidence received and any items still needed before work begins.
                  </CardDescription>
                </div>
                <Badge tone={missingDocuments === 0 ? "green" : "gold"}>
                  {receivedDocuments}/{request.documents.length} received
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {request.documents.map((document) => (
                <div
                  className="flex items-center justify-between gap-4 px-5 py-4"
                  key={document.label}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{document.label}</p>
                  </div>
                  <Badge tone={document.status === "Received" ? "green" : "gold"}>
                    {document.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Request history</CardTitle>
              <CardDescription>Recorded events from submission to the current review state.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <ol className="grid gap-0">
                {request.timeline.map((event, index) => (
                  <li className="relative flex gap-4 pb-6 last:pb-0" key={`${event.at}-${event.title}`}>
                    {index < request.timeline.length - 1 ? (
                      <span className="absolute left-3.5 top-7 h-[calc(100%-1rem)] w-px bg-border" />
                    ) : null}
                    <span className="relative z-10 mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-card">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground">{event.at}</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{event.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <aside className="grid content-start gap-5 xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border bg-brand-soft">
              <CardDescription className="font-semibold text-primary">
                Next required action
              </CardDescription>
              <CardTitle className="text-lg text-brand-deep">{request.nextAction}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-5">
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Request captured</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      The service, contact and expected outcome are recorded.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {missingDocuments === 0 ? (
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
                    <p className="text-sm font-semibold text-foreground">Documents</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {missingDocuments === 0
                        ? "All listed documents have been received."
                        : `${missingDocuments} document${missingDocuments === 1 ? "" : "s"} still needed.`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {assignment ? (
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                    />
                  ) : (
                    <Clock3
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">Assigned staff</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {assignment
                        ? `${assignment.staffName} is responsible for this request.`
                        : "No staff member has been assigned yet."}
                    </p>
                  </div>
                </div>
              </div>

              <Link className={buttonClassName({ className: "w-full" })} href={action.href}>
                <ActionIcon aria-hidden="true" className="h-4 w-4" />
                {action.label}
              </Link>
              <Link
                className={buttonClassName({
                  className: "w-full",
                  variant: "secondary",
                })}
                href="/admin/messages"
              >
                <MessageSquareText aria-hidden="true" className="h-4 w-4" />
                Message client
              </Link>
              <Link
                className={buttonClassName({
                  className: "w-full",
                  variant: "secondary",
                })}
                href={`/admin/staff?assignRequest=${encodeURIComponent(request.id)}`}
              >
                <UserRoundCheck aria-hidden="true" className="h-4 w-4" />
                {assignment ? "Change assigned staff" : "Assign staff"}
              </Link>
            </CardContent>
          </Card>

          <div className="rounded-md border border-border bg-muted/20 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Check aria-hidden="true" className="h-4 w-4 text-primary" />
              Review note
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Confirm the scope, required evidence, KYC state and owner before creating active
              work.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
