import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState, staffDate, staffStatusLabel, staffStatusTone } from "@/components/dashboard/staff/staff-work-ui";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateEngagementTaskAction } from "@/features/engagement-workspace/actions";
import type { KycSubmission } from "@/features/kyc/service";
import type { EngagementLetterRecord } from "@/repositories/engagement-letter-repository";
import type { EngagementDocumentRecord } from "@/repositories/engagement-workspace-repository";
import type { StaffClientDetailData } from "@/repositories/staff-work-repository";
import type { WorkflowInstanceRecord, WorkflowTaskRecord } from "@/repositories/workflow-repository";

type TechnicalReviewContext = {
  workflow: WorkflowInstanceRecord;
  task: WorkflowTaskRecord;
  kyc: KycSubmission | null;
  letter: EngagementLetterRecord | null;
  documents: EngagementDocumentRecord[];
  canComplete: boolean;
};

export function StaffClientDetail({
  data,
  reviewContext,
}: {
  data: StaffClientDetailData;
  reviewContext?: TechnicalReviewContext | null;
}) {
  const { client, workflows, requests, reviews } = data;
  const engagementPath = reviewContext ? `/staff/engagements/${reviewContext.workflow.id}` : null;
  const kycDocuments = reviewContext?.kyc?.requirements.flatMap((requirement) =>
    requirement.documentVersions.map((document) => ({ ...document, requirement: requirement.name }))) ?? [];

  return (
    <div className="grid min-w-0 gap-5">
      <AdminPageSurface
        actions={(
          <div className="flex flex-wrap gap-2">
            {engagementPath ? (
              <Link className={buttonClassName({ variant: "secondary" })} href={`${engagementPath}?tab=tasks`}>
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Back to engagement tasks
              </Link>
            ) : null}
            <Link className={buttonClassName({ variant: "secondary" })} href="/staff/clients">
              <UserRound aria-hidden="true" className="h-4 w-4" />
              All clients
            </Link>
          </div>
        )}
        description={reviewContext
          ? "Review the client profile, KYC answers, signed engagement letter, and submitted evidence before completing the technical review."
          : "Contact details and all work connected to this client in your workspace."}
        icon={UserRound}
        summary={[
          { label: "Active engagements", value: client.activeEngagements, helper: "Work currently open", icon: BriefcaseBusiness },
          { label: "Assigned requests", value: client.pendingRequests, helper: "Waiting to begin", icon: ClipboardCheck },
        ]}
        title={client.name}
      >
        <dl className="grid gap-0 divide-y divide-border p-5">
          {[
            ["Email", client.email ?? "Not available"],
            ["Organization", client.organization || "Not available"],
            ["Services", client.services.join(", ") || "Not set"],
            ["Last activity", staffDate(client.lastActivityAt)],
          ].map(([label, value]) => (
            <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[180px_1fr]" key={label}>
              <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
              <dd className="break-words text-sm font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </AdminPageSurface>

      {reviewContext ? (
        <Card className="overflow-hidden border-primary/25 shadow-none">
          <CardHeader className="border-b border-border bg-primary/5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Initial technical review</CardTitle>
                  <Badge tone={reviewContext.task.status === "completed" ? "green" : "gold"}>{staffStatusLabel(reviewContext.task.status)}</Badge>
                </div>
                <CardDescription className="mt-2">{reviewContext.workflow.reference} / {reviewContext.workflow.serviceName}</CardDescription>
              </div>
              {reviewContext.canComplete ? (
                <form action={updateEngagementTaskAction}>
                  <input name="workflowId" type="hidden" value={reviewContext.workflow.id} />
                  <input name="taskKey" type="hidden" value={reviewContext.task.key} />
                  <input name="status" type="hidden" value="completed" />
                  <input name="returnPath" type="hidden" value={engagementPath ?? ""} />
                  <SubmitButton pendingText="Completing review..."><ShieldCheck className="h-4 w-4" />Approve review and continue</SubmitButton>
                </form>
              ) : reviewContext.task.status === "completed" ? (
                <span className="flex items-center gap-2 text-sm font-semibold text-success"><CheckCircle2 className="h-4 w-4" />Review complete</span>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 md:grid-cols-3">
            <div className="rounded-md border border-border p-3"><p className="text-xs font-medium text-muted-foreground">KYC</p><p className="mt-1 font-semibold text-foreground">{reviewContext.kyc ? staffStatusLabel(reviewContext.kyc.status) : "Not available"}</p></div>
            <div className="rounded-md border border-border p-3"><p className="text-xs font-medium text-muted-foreground">Engagement letter</p><p className="mt-1 font-semibold text-foreground">{reviewContext.letter ? staffStatusLabel(reviewContext.letter.status) : "Not available"}</p></div>
            <div className="rounded-md border border-border p-3"><p className="text-xs font-medium text-muted-foreground">Submitted evidence</p><p className="mt-1 font-semibold text-foreground">{kycDocuments.length + reviewContext.documents.length} files</p></div>
          </CardContent>
        </Card>
      ) : null}

      {reviewContext?.kyc ? (
        <Card className="min-w-0 overflow-hidden shadow-none">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div><CardTitle>KYC questionnaire and evidence</CardTitle><CardDescription className="mt-1">Every answer and uploaded version submitted by the client.</CardDescription></div>
              <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/kyc/${reviewContext.kyc.id}`}><ShieldCheck className="h-4 w-4" />Open KYC workspace</Link>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {reviewContext.kyc.requirements.map((requirement) => (
              <section className="grid min-w-0 gap-3 p-4 md:grid-cols-[minmax(11rem,0.35fr)_minmax(0,1fr)]" key={requirement.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{requirement.name}</p><Badge tone={staffStatusTone(requirement.status)}>{staffStatusLabel(requirement.status)}</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">{requirement.required ? "Required" : "Optional"} / {staffStatusLabel(requirement.section)}</p>
                </div>
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{requirement.clientAnswer || "No written answer supplied."}</p>
                  {requirement.documentVersions.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {requirement.documentVersions.map((document) => (
                        <div className="flex min-w-0 flex-col justify-between gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center" key={document.id}>
                          <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{document.filename}</p><p className="mt-1 text-xs text-muted-foreground">Version {document.version} / {document.fileSize} / {staffDate(document.uploadedAt)}</p></div>
                          <div className="flex shrink-0 flex-wrap gap-2"><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={document.previewHref} target="_blank"><Eye className="h-4 w-4" />Preview</Link><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={document.downloadHref}><Download className="h-4 w-4" />Download</Link></div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>
            ))}
          </CardContent>
        </Card>
      ) : reviewContext ? (
        <StaffEmptyState description="No submitted KYC record is connected to this assigned client." title="KYC record unavailable" />
      ) : null}

      {reviewContext?.letter ? (
        <Card className="overflow-hidden shadow-none">
          <CardHeader className="border-b border-border"><CardTitle>Signed engagement letter</CardTitle><CardDescription>{reviewContext.letter.reference} / Completed {staffDate(reviewContext.letter.completedAt)}</CardDescription></CardHeader>
          <CardContent className="grid gap-4 p-4">
            <div className="flex flex-wrap gap-2"><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/engagement-letters/${reviewContext.letter.id}/pdf`} target="_blank"><Eye className="h-4 w-4" />Preview PDF</Link><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/engagement-letters/${reviewContext.letter.id}/pdf?download=1`}><Download className="h-4 w-4" />Download PDF</Link><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/engagement-letters/${reviewContext.letter.id}/docx`}><FileText className="h-4 w-4" />Download Word file</Link></div>
            <div className="grid gap-3 md:grid-cols-2">
              {reviewContext.letter.signers.map((signer) => <div className="rounded-md border border-border p-3" key={signer.id}><div className="flex items-center justify-between gap-2"><p className="font-semibold text-foreground">{signer.name}</p><Badge tone={signer.status === "signed" ? "green" : "gold"}>{staffStatusLabel(signer.status)}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{signer.title || staffStatusLabel(signer.role)}</p><p className="mt-2 text-xs text-muted-foreground">Signed {staffDate(signer.signedAt)}</p></div>)}
            </div>
          </CardContent>
        </Card>
      ) : reviewContext ? (
        <StaffEmptyState description="The active engagement does not have a linked signed engagement letter." title="Engagement letter unavailable" />
      ) : null}

      {reviewContext && reviewContext.documents.length > 0 ? (
        <Card className="overflow-hidden shadow-none">
          <CardHeader><CardTitle>Engagement documents</CardTitle><CardDescription>Files already exchanged inside this engagement workspace.</CardDescription></CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {reviewContext.documents.map((document) => <div className="flex min-w-0 flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center" key={document.id}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="break-words font-semibold text-foreground">{document.name}</p><Badge tone={staffStatusTone(document.status)}>{staffStatusLabel(document.status)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{staffStatusLabel(document.documentKind)} / Version {document.version}</p></div><div className="flex shrink-0 flex-wrap gap-2"><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/engagements/${reviewContext.workflow.id}/documents/${document.id}?preview=1`} target="_blank"><Eye className="h-4 w-4" />Preview</Link><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/engagements/${reviewContext.workflow.id}/documents/${document.id}`}><Download className="h-4 w-4" />Download</Link></div></div>)}
          </CardContent>
        </Card>
      ) : null}

      {!reviewContext ? (
        <>
          <Card>
            <CardHeader><CardTitle>Engagements</CardTitle></CardHeader>
            <CardContent className="p-0">
              {workflows.length === 0 ? (
                <StaffEmptyState description="This client does not have an engagement visible in your workspace yet." title="No engagement yet" />
              ) : (
                <div className="divide-y divide-border">
                  {workflows.map((workflow) => (
                    <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center" key={workflow.id}>
                      <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{workflow.reference}</p><Badge tone={staffStatusTone(workflow.status)}>{staffStatusLabel(workflow.status)}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{workflow.serviceName} / {workflow.currentStageName}</p></div>
                      <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/engagements/${workflow.id}`}>Open engagement<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {requests.length > 0 ? <Card><CardHeader><CardTitle>Assigned requests</CardTitle></CardHeader><CardContent className="divide-y divide-border p-0">{requests.map((request) => <div className="p-5" key={request.id}><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{request.reference}</p><Badge tone={staffStatusTone(request.status)}>{staffStatusLabel(request.status)}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{request.serviceName}</p><p className="mt-3 text-sm text-foreground">Next action: {request.nextAction}</p></div>)}</CardContent></Card> : null}

          {reviews.length > 0 ? <Card><CardHeader><CardTitle>KYC status</CardTitle></CardHeader><CardContent className="divide-y divide-border p-0">{reviews.map((review) => <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center" key={review.id}><div><Badge tone={staffStatusTone(review.status)}>{staffStatusLabel(review.status)}</Badge><p className="mt-2 text-sm text-muted-foreground">Questionnaire {review.questionnaireComplete ? "complete" : "incomplete"}; {review.documentCount} document(s)</p></div>{client.email ? <a className={buttonClassName({ variant: "secondary", size: "sm" })} href={`mailto:${client.email}`}><Mail aria-hidden="true" className="h-4 w-4" />Email client</a> : null}</div>)}</CardContent></Card> : null}
        </>
      ) : null}
    </div>
  );
}