import {
  Archive,
  CheckCircle2,
  Copy,
  Eye,
  FilePlus2,
  History,
  ListChecks,
  Send,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { TemplateCategoryIcon } from "@/components/dashboard/templates/template-category-icon";
import { TemplateStatusBadge } from "@/components/dashboard/templates/template-status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  TemplateDetailData,
  TemplateRecord,
} from "@/repositories/template-repository";

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function hiddenTemplateId(templateId: string) {
  return <input name="templateId" type="hidden" value={templateId} />;
}

function primaryLifecycleAction(template: TemplateRecord) {
  if (template.status === "draft") {
    return {
      label: "Submit for Review",
      icon: Send,
      action: submitTemplateForReviewAction,
    };
  }

  if (template.status === "pending_review") {
    return {
      label: "Publish",
      icon: ShieldCheck,
      action: publishTemplateVersionAction,
    };
  }

  if (template.status === "archived") {
    return {
      label: "Restore",
      icon: History,
      action: restoreTemplateAction,
    };
  }

  return {
    label: "Create New Version",
    icon: FilePlus2,
    action: createNewTemplateVersionAction,
  };
}

export function TemplateDetail({ data }: { data: TemplateDetailData }) {
  const { template, versions, usage, audit, comparison, variableCatalogue } = data;
  const category = TEMPLATE_CATEGORY_META[template.category];
  const action = primaryLifecycleAction(template);
  const ActionIcon = action.icon;
  const currentVersion = template.currentVersion ?? versions[0] ?? null;
  const validationErrors = currentVersion?.validation.errors ?? [];
  const validationWarnings = currentVersion?.validation.warnings ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground">
                <TemplateCategoryIcon icon={category.icon} />
              </span>
              <Badge tone="teal">{template.categoryLabel}</Badge>
              <TemplateStatusBadge status={template.status} />
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              {template.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {template.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-md border border-border px-2 py-1">
                Current v{template.currentVersionNumber}
              </span>
              <span className="rounded-md border border-border px-2 py-1">
                Published {template.publishedVersionNumber ? `v${template.publishedVersionNumber}` : "none"}
              </span>
              <span className="rounded-md border border-border px-2 py-1">
                {template.usageSummary.totalUses} uses
              </span>
              <span className="rounded-md border border-border px-2 py-1">
                Updated {formatDate(template.updatedAt)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonClassName({ variant: "secondary" })} href="/admin/templates">
              Back to library
            </Link>
            <form action={action.action}>
              {hiddenTemplateId(template.id)}
              <button className={buttonClassName()} type="submit">
                <ActionIcon aria-hidden="true" className="h-4 w-4" />
                {action.label}
              </button>
            </form>
            <form action={duplicateTemplateAction}>
              {hiddenTemplateId(template.id)}
              <button className={buttonClassName({ variant: "secondary" })} type="submit">
                <Copy aria-hidden="true" className="h-4 w-4" />
                Duplicate
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Applicable services", template.applicableServices.join(", ") || "All services"],
          ["Applicable client types", template.applicableClientTypes.join(", ") || "All clients"],
          ["Approval role", template.approvalRules.requiredReviewerRole],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle>{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-md border border-border bg-card p-2 text-sm font-semibold">
        {["Overview", "Content", "Variables", "Versions", "Usage", "Audit"].map((item) => (
          <a
            className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            href={`#${item.toLowerCase()}`}
            key={item}
          >
            {item}
          </a>
        ))}
      </nav>

      <section className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_340px]" id="content">
        <Card>
          <CardHeader>
            <CardTitle>Template sections</CardTitle>
            <CardDescription>Required sections and content blocks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {currentVersion?.requiredSections.map((section, index) => (
              <div className="rounded-md border border-border px-3 py-3" key={section}>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-1 text-sm font-semibold text-foreground">{section}</p>
              </div>
            ))}
            <div className="rounded-md border border-border px-3 py-3">
              <p className="text-sm font-semibold text-foreground">Required fields</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {variableCatalogue
                  .filter((variable) => variable.required)
                  .map((variable) => (
                    <Badge key={variable.key} tone="slate">
                      {variable.key}
                    </Badge>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Editor and preview</CardTitle>
                <CardDescription>
                  Raw template, rendered sample and unresolved variable checks.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge tone="slate">{currentVersion?.outputFormat ?? category.outputFormat}</Badge>
                {currentVersion?.validation.publishReady ? (
                  <Badge className="gap-1.5" tone="green">
                    <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                    Publish ready
                  </Badge>
                ) : (
                  <Badge tone="red">Needs fixes</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-border bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Raw template</p>
                  <Eye aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                </div>
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {currentVersion?.content ?? "No content found."}
                </pre>
              </div>
              <div className="rounded-md border border-border bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Rendered preview</p>
                  <Badge tone="teal">Sample data</Badge>
                </div>
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {currentVersion?.renderedPreview ?? "No preview available."}
                </pre>
              </div>
            </div>

            {validationErrors.length > 0 || validationWarnings.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <p className="font-semibold">Validation errors</p>
                  <div className="mt-2 grid gap-1">
                    {validationErrors.length > 0 ? (
                      validationErrors.map((error) => <span key={error}>{error}</span>)
                    ) : (
                      <span>No blocking errors.</span>
                    )}
                  </div>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Warnings</p>
                  <div className="mt-2 grid gap-1">
                    {validationWarnings.length > 0 ? (
                      validationWarnings.map((warning) => <span key={warning}>{warning}</span>)
                    ) : (
                      <span>No warnings recorded.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Applicability, approval and output rules.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              ["Owner role", template.ownerRole],
              ["Output format", currentVersion?.outputFormat ?? category.outputFormat],
              ["Signature required", template.approvalRules.signatureRequired ? "Yes" : "No"],
              ["Human review", template.approvalRules.humanReviewRequired ? "Required" : "Optional"],
            ].map(([label, value]) => (
              <div className="rounded-md border border-border px-3 py-3" key={label}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
            <form action={archiveTemplateAction} className="grid gap-2 rounded-md border border-border p-3">
              {hiddenTemplateId(template.id)}
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-foreground">Archive reason</span>
                <input
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  defaultValue="Template retired by administrator."
                  name="reason"
                />
              </label>
              <button
                className={buttonClassName({ variant: "secondary", size: "sm" })}
                disabled={template.status === "archived"}
                type="submit"
              >
                <Archive aria-hidden="true" className="h-4 w-4" />
                Confirm archive
              </button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" id="overview">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Description, purpose, usage and ownership.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              ["Description", template.description],
              ["Purpose", template.purpose || category.description],
              ["Created", formatDate(template.createdAt)],
              ["Last updated", formatDate(template.updatedAt)],
              ["Published", formatDate(template.publishedAt)],
              ["Last used", formatDate(template.lastUsedAt)],
            ].map(([label, value]) => (
              <div className="rounded-md border border-border px-3 py-3" key={label}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage summary</CardTitle>
            <CardDescription>Where this template has generated records.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              ["Total", template.usageSummary.totalUses],
              ["Active", template.usageSummary.activeEngagements],
              ["Documents", template.usageSummary.generatedDocuments],
              ["Messages", template.usageSummary.generatedMessages],
              ["Reports", template.usageSummary.generatedReports],
              ["Historical", template.usageSummary.historicalEngagements],
            ].map(([label, value]) => (
              <div className="rounded-md border border-border px-3 py-3" key={label}>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" id="variables">
        <Card>
          <CardHeader>
            <CardTitle>Variables</CardTitle>
            <CardDescription>Supported placeholders and sample values.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placeholder</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Sample</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variableCatalogue.map((variable) => (
                    <TableRow key={variable.key}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {`{{${variable.key}}}`}
                      </TableCell>
                      <TableCell>{variable.description}</TableCell>
                      <TableCell>{variable.required ? "Required" : "Optional"}</TableCell>
                      <TableCell>{variable.sampleValue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variable map</CardTitle>
            <CardDescription>Used in the rendered sample preview.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {currentVersion?.variables.map((variable) => (
              <div
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
                key={variable.key}
              >
                <span className="font-mono text-xs font-semibold text-foreground">
                  {variable.key}
                </span>
                <span className="text-muted-foreground">{variable.sampleValue}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" id="versions">
        <Card>
          <CardHeader>
            <CardTitle>Versions</CardTitle>
            <CardDescription>Complete version history and immutability state.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Change summary</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Published</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        v{version.versionNumber}
                      </TableCell>
                      <TableCell>
                        <TemplateStatusBadge status={version.status} />
                      </TableCell>
                      <TableCell>{version.changeSummary || "No summary recorded."}</TableCell>
                      <TableCell>{version.usageCount}</TableCell>
                      <TableCell>{formatDate(version.publishedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compare versions</CardTitle>
            <CardDescription>
              v{comparison.baseVersion ?? "-"} to v{comparison.compareVersion ?? "-"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              ["Added text", comparison.addedText],
              ["Removed text", comparison.removedText],
              ["Changed variables", comparison.changedVariables],
              ["Changed settings", comparison.changedSettings],
              ["Changed applicability", comparison.changedApplicability],
            ].map(([label, items]) => (
              <div className="rounded-md border border-border px-3 py-3" key={label as string}>
                <p className="text-sm font-semibold text-foreground">{label as string}</p>
                <div className="mt-2 grid gap-1 text-xs leading-5 text-muted-foreground">
                  {(items as string[]).length > 0 ? (
                    (items as string[]).map((item) => <span key={item}>{item}</span>)
                  ) : (
                    <span>No changes detected.</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2" id="usage">
        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>Generated records linked to this exact template history.</CardDescription>
          </CardHeader>
          <CardContent>
            {usage.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Record</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Used By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usage.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.clientName || "Not recorded"}</TableCell>
                        <TableCell>{item.engagementReference || "Not recorded"}</TableCell>
                        <TableCell>{item.generatedRecordType}</TableCell>
                        <TableCell>v{item.templateVersion}</TableCell>
                        <TableCell>{item.usedByName || "System"}</TableCell>
                        <TableCell>{formatDate(item.usedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-8 text-center">
                <p className="font-semibold text-foreground">No usage records</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  This template has not been used yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="audit">
          <CardHeader>
            <CardTitle>Audit</CardTitle>
            <CardDescription>Template-related audit history.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {audit.length > 0 ? (
              audit.map((item) => (
                <div className="rounded-md border border-border px-3 py-3" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.action}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.actorEmail ?? "System"} on {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <ListChecks aria-hidden="true" className="h-4 w-4 text-accent" />
                  </div>
                  {item.reason ? (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.reason}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-border p-8 text-center">
                <p className="font-semibold text-foreground">No audit records</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Lifecycle activity will appear here when this template changes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
