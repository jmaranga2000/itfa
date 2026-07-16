import {
  Archive,
  Copy,
  Download,
  Eye,
  FilePlus2,
  Filter,
  GitCompareArrows,
  History,
  Plus,
  Search,
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
  createTemplateDraftAction,
  duplicateTemplateAction,
  publishTemplateVersionAction,
  restoreTemplateAction,
  submitTemplateForReviewAction,
} from "@/features/templates/actions";
import { TEMPLATE_CATEGORY_META, type TemplateCategory } from "@/features/templates/types";
import type {
  TemplateListFilters,
  TemplateManagementData,
  TemplateRecord,
} from "@/repositories/template-repository";

const creationSteps = [
  "Category",
  "Basic information",
  "Applicability",
  "Content",
  "Variables",
  "Preview",
  "Review",
];

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

function metadataDownloadHref(templates: TemplateRecord[]) {
  const metadata = templates.map((template) => ({
    id: template.id,
    name: template.name,
    category: template.category,
    status: template.status,
    currentVersion: template.currentVersionNumber,
    publishedVersion: template.publishedVersionNumber,
    usageCount: template.usageSummary.totalUses,
    applicableServices: template.applicableServices,
    applicableClientTypes: template.applicableClientTypes,
    lastUpdated: template.updatedAt,
  }));

  return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(metadata, null, 2))}`;
}

function lifecycleAction(template: TemplateRecord) {
  if (template.status === "draft") {
    return {
      label: "Submit",
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
    label: "New version",
    icon: FilePlus2,
    action: createNewTemplateVersionAction,
  };
}

function hiddenTemplateId(templateId: string) {
  return <input name="templateId" type="hidden" value={templateId} />;
}

export function TemplateManagementDashboard({
  data,
  filters,
}: {
  data: TemplateManagementData;
  filters: TemplateListFilters;
}) {
  const activeCategory = data.activeCategory
    ? TEMPLATE_CATEGORY_META[data.activeCategory]
    : null;
  const exportHref = metadataDownloadHref(data.templates);

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <Badge tone="teal">Admin templates</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              {activeCategory ? activeCategory.label : "Templates"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {activeCategory
                ? activeCategory.description
                : "Manage reusable content, workflows, documents, messages, and system-generated outputs."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className={buttonClassName({ variant: "secondary" })}
              download="ifta-template-metadata.json"
              href={exportHref}
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Export metadata
            </a>
            <a className={buttonClassName()} href="#create-template">
              <Plus aria-hidden="true" className="h-4 w-4" />
              Create Template
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.summary.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl font-bold">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{item.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
        {data.categoryCards.map((category) => (
          <Link
            className="rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-accent"
            href={category.href}
            key={category.key}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground">
                <TemplateCategoryIcon icon={category.icon} />
              </span>
              <span className="text-right text-xs font-semibold text-muted-foreground">
                {formatDate(category.lastUpdated)}
              </span>
            </div>
            <h2 className="mt-4 text-sm font-bold text-foreground">{category.label}</h2>
            <p className="mt-2 min-h-12 text-xs leading-5 text-muted-foreground">
              {category.description}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <span className="rounded-md border border-border px-2 py-2">
                <strong className="block text-sm text-foreground">{category.activeTemplates}</strong>
                Published
              </span>
              <span className="rounded-md border border-border px-2 py-2">
                <strong className="block text-sm text-foreground">{category.drafts}</strong>
                Drafts
              </span>
              <span className="rounded-md border border-border px-2 py-2">
                <strong className="block text-sm text-foreground">{category.pendingReview}</strong>
                Review
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section
        className="grid gap-5 rounded-md border border-border bg-card p-5 xl:grid-cols-[minmax(0,1fr)_360px]"
        id="create-template"
      >
        <div>
          <Badge tone="slate">Guided creation</Badge>
          <h2 className="mt-3 text-lg font-bold text-foreground">Create a controlled template draft</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {creationSteps.map((step, index) => (
              <div className="rounded-md border border-border px-3 py-2 text-sm" key={step}>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="ml-2 font-semibold text-foreground">{step}</span>
              </div>
            ))}
          </div>
        </div>
        <form action={createTemplateDraftAction} className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-foreground">Category</span>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
              defaultValue={filters.category ?? "engagement_letter"}
              name="category"
            >
              {data.filterOptions.categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-foreground">Template name</span>
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
              name="name"
              placeholder="New engagement letter"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-foreground">Applicability</span>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                defaultValue={filters.service ?? data.filterOptions.services[0]}
                name="service"
              >
                {data.filterOptions.services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                defaultValue={filters.clientType ?? data.filterOptions.clientTypes[0]}
                name="clientType"
              >
                {data.filterOptions.clientTypes.map((clientType) => (
                  <option key={clientType} value={clientType}>
                    {clientType}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-foreground">Purpose</span>
            <textarea
              className="min-h-20 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              name="description"
              placeholder="What this template standardizes"
            />
          </label>
          <button className={buttonClassName()} type="submit">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Save draft
          </button>
        </form>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <CardTitle>Template register</CardTitle>
                <CardDescription>
                  Search, filter, version, publish, archive, duplicate and compare templates.
                </CardDescription>
              </div>
              <button
                className={buttonClassName({ variant: "secondary", size: "sm" })}
                type="button"
              >
                <Archive aria-hidden="true" className="h-4 w-4" />
                Bulk archive
              </button>
            </div>
            <form className="grid gap-3 pt-3 md:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(140px,1fr))_auto]">
              <label className="relative">
                <span className="sr-only">Search templates</span>
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground"
                  defaultValue={filters.search ?? ""}
                  name="search"
                  placeholder="Search name, service, variable..."
                  type="search"
                />
              </label>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                defaultValue={filters.category ?? ""}
                name="category"
              >
                <option value="">All categories</option>
                {data.filterOptions.categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                defaultValue={filters.status ?? ""}
                name="status"
              >
                <option value="">All statuses</option>
                {data.filterOptions.statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                defaultValue={filters.service ?? ""}
                name="service"
              >
                <option value="">All services</option>
                {data.filterOptions.services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                defaultValue={filters.clientType ?? ""}
                name="clientType"
              >
                <option value="">All client types</option>
                {data.filterOptions.clientTypes.map((clientType) => (
                  <option key={clientType} value={clientType}>
                    {clientType}
                  </option>
                ))}
              </select>
              <button className={buttonClassName({ variant: "secondary" })} type="submit">
                <Filter aria-hidden="true" className="h-4 w-4" />
                Apply
              </button>
            </form>
          </CardHeader>
          <CardContent>
            {data.templates.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Client Type</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.templates.map((template) => {
                        const action = lifecycleAction(template);
                        const ActionIcon = action.icon;

                        return (
                          <TableRow key={template.id}>
                            <TableCell className="min-w-64">
                              <Link
                                className="font-semibold text-foreground hover:text-accent"
                                href={`/admin/templates/${template.id}`}
                              >
                                {template.name}
                              </Link>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                {template.description}
                              </p>
                            </TableCell>
                            <TableCell>{template.categoryLabel}</TableCell>
                            <TableCell>{template.applicableServices[0] ?? "All services"}</TableCell>
                            <TableCell>
                              {template.applicableClientTypes[0] ?? "All clients"}
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold">
                              v{template.currentVersionNumber}
                            </TableCell>
                            <TableCell>
                              <TemplateStatusBadge status={template.status} />
                            </TableCell>
                            <TableCell>{template.usageSummary.totalUses}</TableCell>
                            <TableCell>{formatDate(template.updatedAt)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <Link
                                  className={buttonClassName({ variant: "secondary", size: "sm" })}
                                  href={`/admin/templates/${template.id}`}
                                >
                                  <Eye aria-hidden="true" className="h-4 w-4" />
                                  Open
                                </Link>
                                <form action={action.action}>
                                  {hiddenTemplateId(template.id)}
                                  <button
                                    className={buttonClassName({ variant: "secondary", size: "sm" })}
                                    type="submit"
                                  >
                                    <ActionIcon aria-hidden="true" className="h-4 w-4" />
                                    {action.label}
                                  </button>
                                </form>
                                <form action={duplicateTemplateAction}>
                                  {hiddenTemplateId(template.id)}
                                  <button
                                    className={buttonClassName({ variant: "secondary", size: "sm" })}
                                    type="submit"
                                  >
                                    <Copy aria-hidden="true" className="h-4 w-4" />
                                    Duplicate
                                  </button>
                                </form>
                                {template.status !== "archived" ? (
                                  <form action={archiveTemplateAction}>
                                    {hiddenTemplateId(template.id)}
                                    <input
                                      name="reason"
                                      type="hidden"
                                      value="Archived from template register."
                                    />
                                    <button
                                      className={buttonClassName({
                                        variant: "ghost",
                                        size: "sm",
                                      })}
                                      type="submit"
                                    >
                                      <Archive aria-hidden="true" className="h-4 w-4" />
                                      Archive
                                    </button>
                                  </form>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex flex-col justify-between gap-3 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row">
                  <span>Showing {data.templates.length} templates from the current view.</span>
                  <span>Pagination ready for the next result set.</span>
                </div>
              </>
            ) : (
              <div className="rounded-md border border-dashed border-border p-8 text-center">
                <p className="font-semibold text-foreground">No templates</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  No templates have been created in this category.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Saved views</CardTitle>
              <CardDescription>Focused lists for daily administration.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.savedViews.map((view) => (
                <Link
                  className="rounded-md border border-border px-3 py-3 hover:border-accent"
                  href={view.href}
                  key={view.label}
                >
                  <span className="text-sm font-semibold text-foreground">{view.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {view.description}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permission matrix</CardTitle>
              <CardDescription>Controls for the template lifecycle.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {data.permissions.map((permission) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
                  key={permission.permission}
                >
                  <span className="font-medium text-foreground">{permission.label}</span>
                  <Badge tone="slate">{permission.permission}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lifecycle</CardTitle>
              <CardDescription>Draft to archive control path.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {["Draft", "Pending Review", "Published", "Superseded", "Archived"].map(
                (status, index) => (
                  <div
                    className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
                    key={status}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-muted font-mono text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-foreground">{status}</span>
                  </div>
                ),
              )}
              <div className="mt-2 rounded-md border border-border px-3 py-3 text-sm text-muted-foreground">
                Published versions are preserved. New edits create a draft version and existing
                engagements keep the version they received.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Version comparison</CardTitle>
              <CardDescription>Available from each template detail page.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-3 text-sm text-muted-foreground">
                <GitCompareArrows aria-hidden="true" className="h-4 w-4 text-accent" />
                Compare content, variables, settings, services and approval rules.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
