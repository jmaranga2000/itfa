import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Lock,
  RotateCcw,
  ShieldAlert,
  UserPlus,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { approveClientKycSubmissionAction } from "@/features/kyc/review-actions";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  KycProgressBar,
  KycRequirementStatusBadge,
  KycRiskBadge,
  KycStatusBadge,
} from "@/components/dashboard/kyc/kyc-badges";
import {
  getKycClientTypeLabel,
  type KycRequirement,
  type KycSubmission,
} from "@/repositories/kyc-repository";

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

function alertTone(severity: "warning" | "danger" | "info") {
  if (severity === "danger") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (severity === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-sky-200 bg-sky-50 text-sky-900";
}

function groupRequirements(requirements: KycRequirement[]) {
  return requirements.reduce<Record<string, KycRequirement[]>>((groups, requirement) => {
    groups[requirement.section] ??= [];
    groups[requirement.section].push(requirement);
    return groups;
  }, {});
}

type KycReviewWorkspaceProps = {
  submission: KycSubmission;
  portal?: "admin" | "staff";
  approved?: boolean;
  error?: string;
};

function portalHref(href: string, portal: "admin" | "staff") {
  if (portal === "admin") return href;
  if (href === "/admin/active-engagements") return "/staff/requests";
  if (href.startsWith("/admin/workflows/")) {
    return href.replace("/admin/workflows/", "/staff/engagements/");
  }
  return href.replace("/admin/", "/staff/");
}

export function KycReviewWorkspace({
  submission,
  portal = "admin",
  approved = false,
  error,
}: KycReviewWorkspaceProps) {
  const selectedRequirement = submission.requirements[0];
  const selectedDocument = selectedRequirement?.documentVersions[0];
  const grouped = groupRequirements(submission.requirements);
  const basePath = `/${portal}/kyc`;
  const returnPath = `${basePath}/${submission.id}`;

  return (
    <div className="grid gap-5">
      {approved ? (
        <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">KYC approved and engagement letter generated</p>
            <p className="mt-1 text-xs">The client has been notified and can review the letter in Documents.</p>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
          KYC could not be approved. Confirm that the questionnaire is submitted and the request is assigned.
        </div>
      ) : null}
      <section className="sticky top-16 z-20 rounded-md border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="teal">{submission.reference}</Badge>
              <KycStatusBadge status={submission.status} />
              <KycRiskBadge risk={submission.riskLevel} />
              {submission.seniorReviewRequired ? <Badge tone="purple">Senior Review</Badge> : null}
              {submission.overdue ? <Badge tone="red">Overdue</Badge> : null}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              {submission.clientName}
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
              {getKycClientTypeLabel(submission.clientType)} | {submission.engagementReference} |
              {submission.service}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <KycProgressBar
                label="Submission Progress"
                total={submission.completion.total}
                value={submission.completion.submitted}
              />
              <KycProgressBar
                label="Review Progress"
                tone={submission.status === "approved" ? "green" : "gold"}
                total={submission.completion.total}
                value={submission.completion.approved}
              />
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground">Assigned reviewer</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {submission.assignedReviewer}
                </p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground">Review due</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {dateLabel(submission.reviewDueAt)} | {submission.slaStatus}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Link className={buttonClassName({ variant: "secondary" })} href={basePath}>
              Back to KYC
            </Link>
            {portal === "admin" ? (
              <Link className={buttonClassName({ variant: "secondary" })} href="/admin/kyc/reviewers">
                <UserPlus aria-hidden="true" className="h-4 w-4" />
                Assign Reviewer
              </Link>
            ) : null}
            <Link className={buttonClassName({ variant: "secondary" })} href={portalHref(submission.clientHref, portal)}>
              View Client
            </Link>
            <Link className={buttonClassName({ variant: "secondary" })} href={portalHref(submission.engagementHref, portal)}>
              View Engagement
            </Link>
            {submission.status === "approved" ? (
              <span className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-100 px-4 text-sm font-semibold text-emerald-800">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Approved
              </span>
            ) : (
              <form action={approveClientKycSubmissionAction}>
                <input name="submissionId" type="hidden" value={submission.id} />
                <input name="returnPath" type="hidden" value={returnPath} />
                <SubmitButton disabled={!submission.canProceed} pendingText="Approving KYC...">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  Approve KYC
                </SubmitButton>
              </form>
            )}
          </div>
        </div>
      </section>

      {submission.alerts.length > 0 ? (
        <section className="grid gap-3">
          {submission.alerts.map((alert) => (
            <div
              className={`flex items-start gap-3 rounded-md border px-4 py-3 ${alertTone(alert.severity)}`}
              key={alert.message}
            >
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{alert.message}</p>
                <p className="mt-1 text-xs font-medium">{alert.action}</p>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)_340px]">
        <aside className="grid content-start gap-4 xl:sticky xl:top-52">
          <Card>
            <CardHeader>
              <CardTitle>Requirement checklist</CardTitle>
              <CardDescription>Mandatory and optional KYC controls.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {Object.entries(grouped).map(([section, requirements]) => (
                <div className="grid gap-2" key={section}>
                  <p className="text-xs font-bold uppercase text-muted-foreground">{section}</p>
                  {requirements.map((requirement) => (
                    <a
                      className={`rounded-md border px-3 py-3 text-left ${
                        requirement.id === selectedRequirement?.id
                          ? "border-accent bg-muted"
                          : "border-border bg-background"
                      }`}
                      href={`#${requirement.id}`}
                      key={requirement.id}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{requirement.name}</p>
                        <Badge tone={requirement.required ? "red" : "slate"}>
                          {requirement.required ? "Required" : "Optional"}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <KycRequirementStatusBadge status={requirement.status} />
                        <Badge tone="slate">{requirement.documentVersions.length} docs</Badge>
                      </div>
                    </a>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        <main className="grid gap-5">
          {selectedRequirement ? (
            <Card id={selectedRequirement.id}>
              <CardHeader>
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div>
                    <CardTitle>{selectedRequirement.name}</CardTitle>
                    <CardDescription>{selectedRequirement.instructions}</CardDescription>
                  </div>
                  <KycRequirementStatusBadge status={selectedRequirement.status} />
                </div>
              </CardHeader>
              <CardContent className="grid gap-5">
                <section className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border border-border bg-muted/30 p-4">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Client answer</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      {selectedRequirement.clientAnswer || "No answer provided."}
                    </p>
                  </div>
                  {selectedRequirement.comparison ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900">
                      <p className="text-xs font-bold uppercase">Information comparison</p>
                      <dl className="mt-2 grid gap-2 text-sm">
                        <div>
                          <dt className="font-semibold">Client-entered {selectedRequirement.comparison.label}</dt>
                          <dd>{selectedRequirement.comparison.entered}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Document {selectedRequirement.comparison.label}</dt>
                          <dd>{selectedRequirement.comparison.document}</dd>
                        </div>
                      </dl>
                      <p className="mt-2 text-xs font-medium">{selectedRequirement.comparison.warning}</p>
                    </div>
                  ) : null}
                </section>

                <section className="rounded-md border border-border bg-background">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Secure document preview</p>
                      <p className="text-xs text-muted-foreground">
                        Storage URLs are hidden; preview actions are controlled.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {[ZoomIn, ZoomOut, RotateCcw, Download].map((Icon, index) => (
                        <button
                          aria-label={["Zoom in", "Zoom out", "Rotate", "Download"][index]}
                          className="grid h-9 w-9 place-items-center rounded-md border border-border bg-secondary text-secondary-foreground"
                          key={String(index)}
                          type="button"
                        >
                          <Icon aria-hidden="true" className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid min-h-80 place-items-center bg-muted/40 p-6">
                    <div className="grid max-w-sm place-items-center gap-3 text-center">
                      <FileText aria-hidden="true" className="h-14 w-14 text-muted-foreground" />
                      <p className="font-semibold text-foreground">
                        {selectedDocument?.filename ?? "No document uploaded"}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Preview placeholder for supported PDF/image documents. Non-previewable files
                        show metadata and secure download controls.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="grid gap-3 md:grid-cols-2">
                  {(selectedRequirement.documentVersions ?? []).map((document) => (
                    <div className="rounded-md border border-border px-4 py-3" key={document.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{document.label}</p>
                        <Badge tone={document.reviewStatus === "Approved" ? "green" : "slate"}>
                          v{document.version}
                        </Badge>
                      </div>
                      <dl className="mt-3 grid gap-2 text-xs text-muted-foreground">
                        <div className="flex justify-between gap-3">
                          <dt>Filename</dt>
                          <dd className="font-medium text-foreground">{document.filename}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt>Uploaded</dt>
                          <dd>{dateLabel(document.uploadedAt)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt>Expiry</dt>
                          <dd>{dateLabel(document.expiryDate)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt>Checksum</dt>
                          <dd className="font-mono">{document.checksum}</dd>
                        </div>
                      </dl>
                      {document.rejectionReason ? (
                        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-900">
                          {document.rejectionReason}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </section>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Audit history</CardTitle>
              <CardDescription>Internal and client-visible KYC activity.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {submission.timeline.map((event) => (
                <div className="flex gap-3 rounded-md border border-border px-3 py-3" key={event.id}>
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted">
                    {event.internal ? (
                      <Lock aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{event.action}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.actor} | {dateLabel(event.at)}
                      {event.requirement ? ` | ${event.requirement}` : ""}
                    </p>
                    {event.note ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.note}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>

        <aside className="grid content-start gap-5 xl:sticky xl:top-52">
          <Card>
            <CardHeader>
              <CardTitle>Review controls</CardTitle>
              <CardDescription>Requirement-level decision panel.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <button className={buttonClassName({ className: "w-full" })} type="button">
                Approve Requirement
              </button>
              <button
                className={buttonClassName({ variant: "secondary", className: "w-full" })}
                type="button"
              >
                Request Replacement
              </button>
              <button
                className={buttonClassName({ variant: "secondary", className: "w-full" })}
                type="button"
              >
                Escalate Review
              </button>
              <button
                className={buttonClassName({ variant: "destructive", className: "w-full" })}
                type="button"
              >
                Reject Requirement
              </button>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-3">
                <p className="text-xs font-bold uppercase text-muted-foreground">Internal notes</p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {(selectedRequirement?.internalNotes ?? []).join(" ") || "No internal notes."}
                </p>
              </div>
              <div className="rounded-md border border-border bg-background px-3 py-3">
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  Client-visible feedback
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {(selectedRequirement?.clientFeedback ?? []).join(" ") || "No client feedback."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Final approval checklist</CardTitle>
              <CardDescription>Full KYC approval remains locked until required checks pass.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {submission.finalChecklist.map((item) => (
                <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2" key={item.label}>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <Badge tone={item.state === "Complete" ? "green" : item.state === "Incomplete" ? "red" : "slate"}>
                    {item.state}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escalation</CardTitle>
              <CardDescription>Internal risk and senior-review context.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-3">
                <ShieldAlert aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {submission.seniorReviewRequired ? "Senior review required" : "No senior review required"}
                </span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Clients never see internal escalation notes, risk labels or senior-review analysis.
              </p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
