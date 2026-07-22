import Link from "next/link";
import {
  Archive, ArrowRight, Banknote, BarChart3, Bot, CheckCircle2, ClipboardList,
  Clock3, FileText, History, ReceiptText, UsersRound,
} from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState, staffDate, staffStatusLabel, staffStatusTone } from "@/components/dashboard/staff/staff-work-ui";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { approveAndIssueInvoiceAction, reviewClientPaymentAction } from "@/features/staff/finance-actions";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { StaffAuditRecord } from "@/repositories/staff-audit-repository";
import type { StaffWorkloadRecord } from "@/repositories/staff-assignment-repository";
import type { StaffAssignedRequest, StaffWorkData } from "@/repositories/staff-work-repository";
import type { StaffPaymentRecord } from "@/repositories/staff-finance-repository";
import type { TemplateRecord } from "@/repositories/template-repository";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

export function StaffRequests({ requests }: { requests: StaffAssignedRequest[] }) {
  return (
    <AdminPageSurface
      description="Client requests currently assigned to you for review or follow-up."
      icon={ClipboardList}
      summary={[
        { label: "Assigned", value: requests.length, helper: "Requests in your queue", icon: ClipboardList },
        { label: "High priority", value: requests.filter((request) => ["high", "critical"].includes(request.priority)).length, helper: "Need prompt attention", icon: Clock3 },
      ]}
      title="Engagement requests"
    >
      {requests.length === 0 ? (
        <StaffEmptyState description="Requests assigned by an administrator will appear here." title="No assigned requests" />
      ) : (
        <div className="divide-y divide-border">
          {requests.map((request) => (
            <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center" key={request.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{request.reference}</p>
                  <Badge tone={staffStatusTone(request.status)}>{staffStatusLabel(request.status)}</Badge>
                  <Badge tone={staffStatusTone(request.priority)}>{request.priority} priority</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{request.clientName} / {request.serviceName}</p>
                <p className="mt-3 text-sm text-foreground">Next action: {request.nextAction}</p>
              </div>
              <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/requests/${request.id}`}>
                Open request
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </AdminPageSurface>
  );
}

export function StaffFinance({
  canManage,
  error,
  mode,
  payments = [],
  updated,
  workflows,
}: {
  canManage: boolean;
  error?: string;
  mode: "invoices" | "payments";
  payments?: StaffPaymentRecord[];
  updated?: string;
  workflows: WorkflowInstanceRecord[];
}) {
  const heading = mode === "invoices" ? "Invoices" : "Payments";
  const pending = mode === "invoices"
    ? workflows.filter((workflow) => !["paid", "void", "refunded"].includes(workflow.financial.invoiceStatus)).length
    : payments.filter((payment) => payment.status === "pending").length;
  const balance = workflows.reduce((total, workflow) => total + workflow.financial.balanceDue, 0);

  return (
    <AdminPageSurface
      description={`${heading} recorded against the engagements you are permitted to access.`}
      icon={mode === "invoices" ? ReceiptText : Banknote}
      summary={[
        { label: "Records", value: mode === "invoices" ? workflows.length : payments.length, helper: mode === "invoices" ? "Visible engagements" : "Submitted payments", icon: ReceiptText },
        { label: "Needs action", value: pending, helper: mode === "invoices" ? "Not fully settled" : "Waiting for verification", icon: Clock3 },
        { label: "Balance due", value: balance.toLocaleString("en-KE"), helper: "Across visible currencies", icon: Banknote },
      ]}
      title={heading}
    >
      {updated ? <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-900">Finance record updated successfully.</div> : null}
      {error ? <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-900">The finance action could not be completed. Check the record and try again.</div> : null}
      {mode === "invoices" ? (
        workflows.length === 0 ? (
          <StaffEmptyState description="Invoice work appears here when an engagement reaches finance or is assigned to the finance role." title="No invoice work" />
        ) : (
          <div className="divide-y divide-border">
            {workflows.map((workflow) => {
              const task = workflow.tasks.find((item) => item.key === "approve_invoice" || (item.stageKey === "finance" && item.assignedRole === "finance_officer"));
              const canIssue = canManage
                && workflow.financial.balanceDue > 0
                && Boolean(task && ["ready", "in_progress", "waiting_for_approval", "overdue"].includes(task.status))
                && !["issued", "partially_paid", "paid", "void", "refunded"].includes(workflow.financial.invoiceStatus);
              return (
                <div className="grid min-w-0 scroll-mt-24 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" id={`invoice-${workflow.id}`} key={workflow.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words font-semibold text-foreground">{workflow.reference}</p>
                      <Badge tone={staffStatusTone(workflow.financial.invoiceStatus)}>{staffStatusLabel(workflow.financial.invoiceStatus)}</Badge>
                      {task ? <Badge tone={staffStatusTone(task.status)}>{task.status === "completed" ? "Task complete" : "Finance task"}</Badge> : null}
                    </div>
                    <p className="mt-1 break-words text-sm text-muted-foreground">{workflow.clientName} / {workflow.serviceName}</p>
                    <p className="mt-3 text-sm font-semibold text-foreground">{workflow.financial.currency} {workflow.financial.balanceDue.toLocaleString("en-KE")} due</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link className={buttonClassName({ variant: "secondary", size: "sm", className: "justify-center" })} href={`/staff/engagements/${workflow.id}?tab=finance`}>Open finance<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                    {canIssue ? (
                      <form action={approveAndIssueInvoiceAction}>
                        <input name="workflowId" type="hidden" value={workflow.id} />
                        <SubmitButton className="w-full justify-center" pendingText="Issuing..." size="sm">Approve and issue</SubmitButton>
                      </form>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : payments.length === 0 ? (
        <StaffEmptyState description="Client payment submissions will appear here for verification." title="No payment submissions" />
      ) : (
        <div className="divide-y divide-border">
          {payments.map((payment) => (
            <div className="grid min-w-0 gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] xl:items-center" key={payment.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{payment.engagementReference}</p><Badge tone={staffStatusTone(payment.status)}>{staffStatusLabel(payment.status)}</Badge></div>
                <p className="mt-1 break-words text-sm text-muted-foreground">{payment.clientName} / {staffStatusLabel(payment.method)}</p>
                <p className="mt-3 text-lg font-bold text-foreground">{payment.currency} {payment.amount.toLocaleString("en-KE")}</p>
                <p className="mt-1 break-all text-xs text-muted-foreground">Reference: {payment.transactionReference} / Submitted {staffDate(payment.submittedAt)}</p>
                {payment.reviewNote ? <p className="mt-2 text-sm text-muted-foreground">Review note: {payment.reviewNote}</p> : null}
              </div>
              {canManage && payment.status === "pending" ? (
                <form action={reviewClientPaymentAction} className="grid min-w-0 gap-2">
                  <input name="paymentId" type="hidden" value={payment.id} />
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor={`review-note-${payment.id}`}>Review note</label>
                  <textarea className="min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" id={`review-note-${payment.id}`} name="reviewNote" placeholder="Optional note for the client" />
                  <div className="grid grid-cols-2 gap-2">
                    <SubmitButton name="decision" pendingText="Saving..." size="sm" value="rejected" variant="secondary">Reject</SubmitButton>
                    <SubmitButton name="decision" pendingText="Saving..." size="sm" value="verified">Verify payment</SubmitButton>
                  </div>
                </form>
              ) : <Link className={buttonClassName({ variant: "secondary", size: "sm", className: "w-fit" })} href={`/staff/engagements/${payment.workflowId}?tab=finance`}>Open finance<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}
            </div>
          ))}
        </div>
      )}
    </AdminPageSurface>
  );
}

export function StaffFinanceReports({ workflows, payments }: { workflows: WorkflowInstanceRecord[]; payments: StaffPaymentRecord[] }) {
  const issued = workflows.filter((workflow) => !["draft", "pending_approval"].includes(workflow.financial.invoiceStatus)).length;
  const pendingPayments = payments.filter((payment) => payment.status === "pending").length;
  const verifiedPayments = payments.filter((payment) => payment.status === "verified").reduce((total, payment) => total + payment.amount, 0);
  const balanceDue = workflows.reduce((total, workflow) => total + workflow.financial.balanceDue, 0);
  const rows = [
    ["Invoice records", workflows.length, "Engagements visible to finance", "/staff/invoices"],
    ["Invoices issued", issued, "Approved or issued billing records", "/staff/invoices"],
    ["Outstanding balance", balanceDue.toLocaleString("en-KE"), "Across visible engagement currencies", "/staff/invoices"],
    ["Payments awaiting review", pendingPayments, "Client submissions requiring a decision", "/staff/payments"],
    ["Verified payment value", verifiedPayments.toLocaleString("en-KE"), "Payments confirmed by finance", "/staff/payments"],
  ] as const;
  return <AdminPageSurface description="Live invoice and payment totals calculated from the finance records you can access." icon={BarChart3} title="Finance reports"><div className="divide-y divide-border">{rows.map(([label, value, helper, href]) => <Link className="flex min-w-0 items-center justify-between gap-4 p-5 hover:bg-muted/30" href={href} key={label}><div className="min-w-0"><p className="font-semibold text-foreground">{label}</p><p className="mt-1 text-sm text-muted-foreground">{helper}</p></div><div className="flex shrink-0 items-center gap-2"><p className="text-xl font-bold text-primary">{value}</p><ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" /></div></Link>)}</div></AdminPageSurface>;
}

export function StaffReports({ data }: { data: StaffWorkData }) {
  const tasks = data.workflows.flatMap((workflow) => workflow.tasks);
  const completed = tasks.filter((task) => task.status === "completed").length;
  const overdue = tasks.filter((task) => task.status === "overdue").length;
  const atRisk = data.workflows.filter((workflow) => ["high", "critical"].includes(workflow.riskLevel)).length;
  const rows = [
    ["Engagements", data.workflows.length, "Assigned client work"],
    ["Tasks completed", completed, "Finished workflow tasks"],
    ["Tasks overdue", overdue, "Need follow-up"],
    ["Engagements at risk", atRisk, "High or critical risk"],
    ["Documents", data.documents.length, "Files across visible work"],
    ["KYC reviews", data.reviews.length, "Visible client submissions"],
  ] as const;

  return (
    <AdminPageSurface description="A straightforward summary calculated from your current assigned work." icon={BarChart3} title="Reports">
      <div className="divide-y divide-border">
        {rows.map(([label, value, helper]) => (
          <div className="flex items-center justify-between gap-4 p-5" key={label}>
            <div><p className="font-semibold text-foreground">{label}</p><p className="mt-1 text-sm text-muted-foreground">{helper}</p></div>
            <p className="text-2xl font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>
    </AdminPageSurface>
  );
}

export function StaffArchive({ workflows }: { workflows: WorkflowInstanceRecord[] }) {
  const records = workflows.filter((workflow) => workflow.status === "archived" || workflow.status === "read_only" || workflow.archive.status !== "not_ready");
  return (
    <AdminPageSurface
      description="Completed and retained engagement records available to your role."
      icon={Archive}
      summary={[{ label: "Retained records", value: records.length, helper: "Read-only or archived work", icon: Archive }]}
      title="Archive"
    >
      {records.length === 0 ? (
        <StaffEmptyState description="Completed work will appear here when its retention period begins." title="No archived work" />
      ) : (
        <div className="divide-y divide-border">
          {records.map((workflow) => (
            <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center" key={workflow.id}>
              <div><p className="font-semibold text-foreground">{workflow.reference} / {workflow.clientName}</p><p className="mt-1 text-sm text-muted-foreground">{workflow.serviceName}; retain until {staffDate(workflow.archive.retentionUntil)}</p></div>
              <div className="flex items-center gap-2"><Badge tone="slate">{staffStatusLabel(workflow.archive.status)}</Badge><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/engagements/${workflow.id}`}>Open<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>
            </div>
          ))}
        </div>
      )}
    </AdminPageSurface>
  );
}

export function StaffTemplates({ templates }: { templates: TemplateRecord[] }) {
  const published = templates.filter((template) => template.status === "published").length;
  return (
    <AdminPageSurface
      description="Approved and in-progress templates available to your role."
      icon={FileText}
      summary={[
        { label: "Templates", value: templates.length, helper: "Visible to your role", icon: FileText },
        { label: "Published", value: published, helper: "Ready for use", icon: CheckCircle2 },
      ]}
      title="Templates"
    >
      {templates.length === 0 ? (
        <StaffEmptyState description="Templates will appear when an administrator publishes one for your role." title="No templates available" />
      ) : (
        <div className="divide-y divide-border">
          {templates.map((template) => (
            <div className="p-5" key={template.id}>
              <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{template.name}</p><Badge tone={staffStatusTone(template.status)}>{template.statusLabel}</Badge></div>
              <p className="mt-1 text-sm text-muted-foreground">{template.categoryLabel} / Version {template.currentVersionNumber}</p>
              <p className="mt-3 text-sm leading-6 text-foreground">{template.description}</p>
            </div>
          ))}
        </div>
      )}
    </AdminPageSurface>
  );
}

export function StaffTeamWorkload({ members }: { members: StaffWorkloadRecord[] }) {
  return (
    <AdminPageSurface
      description="Current staff availability based on active engagements and request assignments."
      icon={UsersRound}
      summary={[
        { label: "Available", value: members.filter((member) => member.available).length, helper: "No active assigned work", icon: CheckCircle2 },
        { label: "Team members", value: members.length, helper: "Operational staff", icon: UsersRound },
      ]}
      title="Team workload"
    >
      {members.length === 0 ? (
        <StaffEmptyState description="Active staff accounts will appear here." title="No staff found" />
      ) : (
        <div className="overflow-x-auto"><Table className="min-w-[700px]"><TableHeader><TableRow><TableHead>Staff member</TableHead><TableHead>Role</TableHead><TableHead>Engagements</TableHead><TableHead>Requests</TableHead><TableHead>Availability</TableHead></TableRow></TableHeader><TableBody>{members.map((member) => <TableRow key={member.id}><TableCell><p className="font-semibold text-foreground">{`${member.firstName} ${member.lastName}`.trim() || member.email}</p><p className="mt-1 text-xs text-muted-foreground">{member.email}</p></TableCell><TableCell>{member.roleKeys.map(staffStatusLabel).join(", ")}</TableCell><TableCell>{member.assignedEngagementCount}</TableCell><TableCell>{member.requestAssignmentCount}</TableCell><TableCell><Badge tone={member.available ? "green" : member.totalWorkload > 4 ? "red" : "gold"}>{member.available ? "available" : `${member.totalWorkload} assigned`}</Badge></TableCell></TableRow>)}</TableBody></Table></div>
      )}
    </AdminPageSurface>
  );
}

export function StaffAudit({ records }: { records: StaffAuditRecord[] }) {
  return (
    <AdminPageSurface description="Recent system and account changes. This view is read-only." icon={History} title="Activity history">
      {records.length === 0 ? <StaffEmptyState description="Recorded system changes will appear here." title="No activity recorded" /> : <div className="overflow-x-auto"><Table className="min-w-[760px]"><TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Record</TableHead><TableHead>Actor</TableHead><TableHead>Reason</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{records.map((record) => <TableRow key={record.id}><TableCell className="font-semibold text-foreground">{staffStatusLabel(record.action)}</TableCell><TableCell>{record.resourceType}{record.resourceId ? ` / ${record.resourceId}` : ""}</TableCell><TableCell>{record.actorEmail ?? "System"}</TableCell><TableCell>{record.reason ?? "Not provided"}</TableCell><TableCell>{staffDate(record.createdAt)}</TableCell></TableRow>)}</TableBody></Table></div>}
    </AdminPageSurface>
  );
}

export function StaffAiWorkspace({ workflows }: { workflows: WorkflowInstanceRecord[] }) {
  return (
    <AdminPageSurface description="Choose an assigned engagement before using AI-assisted drafting and review tools." icon={Bot} title="AI workspace">
      {workflows.length === 0 ? <StaffEmptyState description="AI tools become available in the context of assigned client work." title="No engagement available" /> : <div className="divide-y divide-border">{workflows.map((workflow) => <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center" key={workflow.id}><div><p className="font-semibold text-foreground">{workflow.reference} / {workflow.clientName}</p><p className="mt-1 text-sm text-muted-foreground">{workflow.serviceName}; {workflow.currentStageName}</p></div><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/engagements/${workflow.id}`}>Open engagement<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>)}</div>}
    </AdminPageSurface>
  );
}
