import Link from "next/link";
import {
  ArrowRight,
  FilePlus2,
  FileText,
  History,
  Plus,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { TemplateStatusBadge } from "@/components/dashboard/templates/template-status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createNewTemplateVersionAction,
  createTemplateDraftAction,
  publishTemplateVersionAction,
  restoreTemplateAction,
  submitTemplateForReviewAction,
} from "@/features/templates/actions";
import { TEMPLATE_CATEGORY_META } from "@/features/templates/types";
import type {
  TemplateCapabilities,
  TemplateListFilters,
  TemplateManagementData,
  TemplateRecord,
} from "@/repositories/template-repository";

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
    : "Not recorded";
}

function lifecycleAction(template: TemplateRecord, capabilities: TemplateCapabilities) {
  if (template.status === "draft" && capabilities.submitReview) {
    return { label: "Send for approval", icon: Send, action: submitTemplateForReviewAction };
  }
  if (template.status === "pending_review" && capabilities.publish) {
    return { label: "Approve and publish", icon: ShieldCheck, action: publishTemplateVersionAction };
  }
  if (template.status === "archived" && capabilities.restore) {
    return { label: "Restore", icon: History, action: restoreTemplateAction };
  }
  if (["published", "superseded"].includes(template.status) && capabilities.edit) {
    return { label: "Update template", icon: FilePlus2, action: createNewTemplateVersionAction };
  }
  return null;
}

function pageCopy(data: TemplateManagementData) {
  if (!data.activeCategory) {
    return {
      title: "Document templates",
      description: "Reusable letters, invoices and client documents prepared for consistent day-to-day work.",
    };
  }
  const category = TEMPLATE_CATEGORY_META[data.activeCategory];
  return {
    title: category.label,
    description: category.description,
  };
}

function templateUse(template: TemplateRecord) {
  const service = template.applicableServices[0] ?? "All services";
  const clientType = template.applicableClientTypes[0] ?? "All clients";
  return `${service} / ${clientType}`;
}

export function TemplateManagementDashboard({
  data,
  filters,
}: {
  data: TemplateManagementData;
  filters: TemplateListFilters;
}) {
  const copy = pageCopy(data);

  return (
    <div className="grid min-w-0 gap-5">
      <section className="flex min-w-0 flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><Badge tone="teal">Templates</Badge><Badge tone="slate">{data.templates.length} records</Badge></div>
          <h1 className="mt-3 text-2xl font-bold text-foreground">{copy.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{copy.description}</p>
        </div>
        {data.capabilities.create ? <a className={buttonClassName({ className: "shrink-0" })} href="#new-template"><Plus className="h-4 w-4" />Create template</a> : null}
      </section>

      {!data.activeCategory ? (
        <nav aria-label="Template types" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.categoryCards.map((category) => (
            <Link className="flex min-w-0 items-center justify-between gap-4 rounded-md border border-border bg-card p-4 hover:border-primary/50" href={category.href} key={category.key}>
              <div className="min-w-0"><p className="font-semibold text-foreground">{category.label}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{category.description}</p></div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-primary"><ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </nav>
      ) : null}

      {data.capabilities.create ? <details className="group rounded-md border border-border bg-card" id="new-template">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <div><p className="font-semibold text-foreground">Create a new template</p><p className="mt-1 text-sm text-muted-foreground">Start with a name, purpose and where it will be used.</p></div>
          <Plus className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-45" />
        </summary>
        <form action={createTemplateDraftAction} className="grid gap-4 border-t border-border p-5 md:grid-cols-2">
          {filters.category ? <input name="category" type="hidden" value={filters.category} /> : (
            <label className="grid gap-2 text-sm font-semibold text-foreground">Template type<select className="h-10 rounded-md border border-border bg-background px-3 font-normal" defaultValue="engagement_letter" name="category">{data.filterOptions.categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
          )}
          <label className="grid gap-2 text-sm font-semibold text-foreground">Template name<input className="h-10 rounded-md border border-border bg-background px-3 font-normal" name="name" placeholder="Example: Standard engagement letter" required /></label>
          <label className="grid gap-2 text-sm font-semibold text-foreground">Service<select className="h-10 rounded-md border border-border bg-background px-3 font-normal" defaultValue={filters.service ?? ""} name="service"><option value="">All services</option>{data.filterOptions.services.map((service) => <option key={service} value={service}>{service}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-semibold text-foreground">Client type<select className="h-10 rounded-md border border-border bg-background px-3 font-normal" defaultValue={filters.clientType ?? ""} name="clientType"><option value="">All clients</option>{data.filterOptions.clientTypes.map((clientType) => <option key={clientType} value={clientType}>{clientType}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-semibold text-foreground md:col-span-2">Purpose<textarea className="min-h-24 rounded-md border border-border bg-background px-3 py-2 font-normal" name="description" placeholder="Describe when staff should use this template." required /></label>
          <button className={buttonClassName({ className: "md:col-span-2 md:justify-self-end" })} type="submit"><Plus className="h-4 w-4" />Save as draft</button>
        </form>
      </details> : null}

      <Card className="min-w-0 overflow-hidden shadow-none">
        <CardContent className="p-0">
          <form className="grid gap-3 border-b border-border p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
            {filters.category ? <input name="category" type="hidden" value={filters.category} /> : null}
            <label className="relative min-w-0"><span className="sr-only">Search templates</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="h-10 w-full min-w-0 rounded-md border border-border bg-background pl-9 pr-3 text-sm" defaultValue={filters.search ?? ""} name="search" placeholder="Search by template name" type="search" /></label>
            <select aria-label="Template status" className="h-10 rounded-md border border-border bg-background px-3 text-sm" defaultValue={filters.status ?? ""} name="status"><option value="">Any status</option>{data.filterOptions.statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
            <button className={buttonClassName({ variant: "secondary" })} type="submit"><Search className="h-4 w-4" />Find</button>
          </form>

          <div className="grid gap-3 p-4 md:hidden">
            {data.templates.map((template) => {
              const action = lifecycleAction(template, data.capabilities);
              const ActionIcon = action?.icon;
              return <article className="min-w-0 rounded-md border border-border p-4" key={template.id}><div className="flex flex-wrap items-center gap-2"><TemplateStatusBadge status={template.status} /><span className="text-xs text-muted-foreground">Updated {formatDate(template.updatedAt)}</span></div><h2 className="mt-3 break-words font-bold text-foreground">{template.name}</h2><p className="mt-1 break-words text-sm text-muted-foreground">{templateUse(template)}</p><div className="mt-4 grid gap-2"><Link className={buttonClassName({ className: "w-full justify-center", size: "sm" })} href={`/admin/templates/${template.id}`}><FileText className="h-4 w-4" />Open template</Link>{action && ActionIcon ? <form action={action.action}><input name="templateId" type="hidden" value={template.id} /><button className={buttonClassName({ className: "w-full justify-center", size: "sm", variant: "secondary" })} type="submit"><ActionIcon className="h-4 w-4" />{action.label}</button></form> : null}</div></article>;
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader><TableRow><TableHead>Template</TableHead><TableHead>Used for</TableHead><TableHead>Status</TableHead><TableHead>Last updated</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.templates.map((template) => {
                  const action = lifecycleAction(template, data.capabilities);
                  const ActionIcon = action?.icon;
                  return <TableRow key={template.id}><TableCell className="min-w-64"><p className="font-semibold text-foreground">{template.name}</p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{template.description}</p></TableCell><TableCell>{templateUse(template)}</TableCell><TableCell><TemplateStatusBadge status={template.status} /></TableCell><TableCell>{formatDate(template.updatedAt)}</TableCell><TableCell><div className="flex justify-end gap-2"><Link className={buttonClassName({ size: "sm", variant: "secondary" })} href={`/admin/templates/${template.id}`}>Open</Link>{action && ActionIcon ? <form action={action.action}><input name="templateId" type="hidden" value={template.id} /><button className={buttonClassName({ size: "sm" })} type="submit"><ActionIcon className="h-4 w-4" />{action.label}</button></form> : null}</div></TableCell></TableRow>;
                })}
                {data.templates.length === 0 ? <TableRow><TableCell className="py-12 text-center text-sm text-muted-foreground" colSpan={5}>No templates match this search.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-3">
        <div><Badge tone="slate">Draft</Badge><p className="mt-2 text-sm text-muted-foreground">Still being prepared.</p></div>
        <div><Badge tone="gold">Awaiting approval</Badge><p className="mt-2 text-sm text-muted-foreground">Ready for an administrator to check.</p></div>
        <div><Badge tone="green">Published</Badge><p className="mt-2 text-sm text-muted-foreground">Available for staff to use.</p></div>
      </section>
    </div>
  );
}
