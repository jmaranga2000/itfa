import Link from "next/link";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  Copy,
  FilePlus2,
  History,
  Send,
  ShieldCheck,
} from "lucide-react";
import { TemplateStatusBadge } from "@/components/dashboard/templates/template-status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  archiveTemplateAction,
  createNewTemplateVersionAction,
  duplicateTemplateAction,
  publishTemplateVersionAction,
  restoreTemplateAction,
  submitTemplateForReviewAction,
} from "@/features/templates/actions";
import { TEMPLATE_CATEGORY_META } from "@/features/templates/types";
import type {
  TemplateCapabilities,
  TemplateDetailData,
  TemplateRecord,
} from "@/repositories/template-repository";

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
    : "Not recorded";
}

function friendlyAction(value: string) {
  return value.replaceAll("_", " ").replaceAll(".", " / ").replace(/^./, (letter) => letter.toUpperCase());
}

function lifecycleAction(template: TemplateRecord, capabilities: TemplateCapabilities) {
  if (template.status === "draft" && capabilities.submitReview) {
    return { label: "Send for approval", icon: Send, action: submitTemplateForReviewAction };
  }
  if (template.status === "pending_review" && capabilities.publish) {
    return { label: "Approve and publish", icon: ShieldCheck, action: publishTemplateVersionAction };
  }
  if (template.status === "archived" && capabilities.restore) {
    return { label: "Restore template", icon: History, action: restoreTemplateAction };
  }
  if (["published", "superseded"].includes(template.status) && capabilities.edit) {
    return { label: "Prepare an update", icon: FilePlus2, action: createNewTemplateVersionAction };
  }
  return null;
}

export function TemplateDetail({ data }: { data: TemplateDetailData }) {
  const { audit, capabilities, template, usage, variableCatalogue, versions } = data;
  const category = TEMPLATE_CATEGORY_META[template.category];
  const currentVersion = template.currentVersion ?? versions[0] ?? null;
  const action = lifecycleAction(template, capabilities);
  const ActionIcon = action?.icon;
  const validationIssues = [
    ...(currentVersion?.validation.errors ?? []),
    ...(currentVersion?.validation.warnings ?? []),
  ];

  return (
    <div className="grid min-w-0 gap-5">
      <section className="flex min-w-0 flex-col justify-between gap-5 rounded-md border border-border bg-card p-5 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="teal">{template.categoryLabel}</Badge>
            <TemplateStatusBadge status={template.status} />
            <span className="text-xs font-semibold text-muted-foreground">Version {template.currentVersionNumber}</span>
          </div>
          <h1 className="mt-3 break-words text-2xl font-bold text-foreground">{template.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{template.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link className={buttonClassName({ variant: "secondary" })} href="/admin/templates">
            <ArrowLeft className="h-4 w-4" />Back to templates
          </Link>
          {action && ActionIcon ? (
            <form action={action.action}>
              <input name="templateId" type="hidden" value={template.id} />
              <button className={buttonClassName()} type="submit"><ActionIcon className="h-4 w-4" />{action.label}</button>
            </form>
          ) : null}
          {capabilities.create ? (
            <form action={duplicateTemplateAction}>
              <input name="templateId" type="hidden" value={template.id} />
              <button className={buttonClassName({ variant: "secondary" })} type="submit"><Copy className="h-4 w-4" />Make a copy</button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)]">
        <Card className="min-w-0 shadow-none">
          <CardHeader>
            <CardTitle>What this template is for</CardTitle>
            <CardDescription>Plain-language guidance for choosing the correct template.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><p className="text-xs font-semibold text-muted-foreground">PURPOSE</p><p className="mt-1 text-sm leading-6 text-foreground">{template.purpose || category.description}</p></div>
            <div><p className="text-xs font-semibold text-muted-foreground">SERVICES</p><p className="mt-1 text-sm font-semibold text-foreground">{template.applicableServices.join(", ") || "All services"}</p></div>
            <div><p className="text-xs font-semibold text-muted-foreground">CLIENTS</p><p className="mt-1 text-sm font-semibold text-foreground">{template.applicableClientTypes.join(", ") || "All client types"}</p></div>
            <div><p className="text-xs font-semibold text-muted-foreground">APPROVAL</p><p className="mt-1 text-sm font-semibold text-foreground">{template.approvalRules.requiredApproval ? `Checked by ${friendlyAction(template.approvalRules.requiredReviewerRole)}` : "No approval needed"}</p></div>
            <div><p className="text-xs font-semibold text-muted-foreground">LAST UPDATED</p><p className="mt-1 text-sm font-semibold text-foreground">{formatDate(template.updatedAt)}</p></div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader><CardTitle>Ready to use?</CardTitle><CardDescription>The system checks required wording and information.</CardDescription></CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              {currentVersion?.validation.publishReady ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" /> : <AlertCircle className="h-5 w-5 shrink-0 text-warning" />}
              <div><p className="font-semibold text-foreground">{currentVersion?.validation.publishReady ? "Ready for approval" : "Needs attention"}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{validationIssues.length ? `${validationIssues.length} item${validationIssues.length === 1 ? "" : "s"} to check before publishing.` : "All automatic checks have passed."}</p></div>
            </div>
            {validationIssues.length ? <ul className="mt-4 grid gap-2 border-t border-border pt-4">{validationIssues.slice(0, 4).map((issue) => <li className="text-sm text-muted-foreground" key={issue}>{issue}</li>)}</ul> : null}
          </CardContent>
        </Card>
      </section>

      <Card className="min-w-0 shadow-none">
        <CardHeader><CardTitle>Sample preview</CardTitle><CardDescription>This is how the template reads after example client details are filled in.</CardDescription></CardHeader>
        <CardContent><div className="max-h-[34rem] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background p-4 text-sm leading-7 text-foreground">{currentVersion?.renderedPreview || "No preview is available yet."}</div></CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="min-w-0 shadow-none">
          <CardHeader><CardTitle>Information filled automatically</CardTitle><CardDescription>Staff do not type these items into the finished document each time.</CardDescription></CardHeader>
          <CardContent className="grid gap-2">
            {variableCatalogue.map((variable) => (
              <div className="flex min-w-0 items-start justify-between gap-4 border-b border-border py-3 last:border-0" key={variable.key}>
                <div className="min-w-0"><p className="font-semibold text-foreground">{variable.label}</p><p className="mt-1 text-sm text-muted-foreground">{variable.description}</p></div>
                <Badge className="shrink-0" tone={variable.required ? "gold" : "slate"}>{variable.required ? "Required" : "Optional"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="min-w-0 shadow-none">
          <CardHeader><CardTitle>Version history</CardTitle><CardDescription>Older published wording remains available for record keeping.</CardDescription></CardHeader>
          <CardContent className="grid gap-2">
            {versions.map((version) => (
              <div className="flex flex-col justify-between gap-3 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center" key={version.id}>
                <div><p className="font-semibold text-foreground">Version {version.versionNumber}</p><p className="mt-1 text-sm text-muted-foreground">{version.changeSummary || "No change note was added."}</p></div>
                <div className="flex shrink-0 items-center gap-2"><TemplateStatusBadge status={version.status} /><span className="text-xs text-muted-foreground">{formatDate(version.updatedAt)}</span></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="min-w-0 shadow-none">
          <CardHeader><CardTitle>Recent use</CardTitle><CardDescription>Client records most recently created from this template.</CardDescription></CardHeader>
          <CardContent className="grid gap-2">
            {usage.slice(0, 8).map((item) => <div className="flex flex-col justify-between gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center" key={item.id}><div><p className="font-semibold text-foreground">{item.clientName || "Client not recorded"}</p><p className="mt-1 text-sm text-muted-foreground">{item.engagementReference || friendlyAction(item.generatedRecordType)}</p></div><span className="text-xs text-muted-foreground">{formatDate(item.usedAt)}</span></div>)}
            {usage.length === 0 ? <p className="py-5 text-sm text-muted-foreground">This template has not been used yet.</p> : null}
          </CardContent>
        </Card>

        <Card className="min-w-0 shadow-none">
          <CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>A simple history of approvals, publishing and changes.</CardDescription></CardHeader>
          <CardContent className="grid gap-2">
            {audit.slice(0, 8).map((item) => <div className="border-b border-border py-3 last:border-0" key={item.id}><p className="font-semibold text-foreground">{friendlyAction(item.action)}</p><p className="mt-1 text-sm text-muted-foreground">{item.actorEmail || "System"} / {formatDate(item.createdAt)}</p>{item.reason ? <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p> : null}</div>)}
            {audit.length === 0 ? <p className="py-5 text-sm text-muted-foreground">No activity has been recorded yet.</p> : null}
          </CardContent>
        </Card>
      </section>

      {capabilities.archive && template.status !== "archived" ? (
        <details className="group rounded-md border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4"><div><p className="font-semibold text-foreground">Retire this template</p><p className="mt-1 text-sm text-muted-foreground">Archived templates remain in history but cannot be selected for new work.</p></div><Archive className="h-5 w-5 shrink-0 text-muted-foreground" /></summary>
          <form action={archiveTemplateAction} className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-end">
            <input name="templateId" type="hidden" value={template.id} />
            <label className="grid min-w-0 flex-1 gap-2 text-sm font-semibold text-foreground">Reason<input className="h-10 rounded-md border border-border bg-background px-3 font-normal" defaultValue="This template is no longer used." name="reason" required /></label>
            <button className={buttonClassName({ variant: "secondary" })} type="submit"><Archive className="h-4 w-4" />Archive template</button>
          </form>
        </details>
      ) : null}
    </div>
  );
}
