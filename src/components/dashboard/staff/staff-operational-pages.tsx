import Link from "next/link";
import {
  Archive, ArrowRight, Banknote, BarChart3, Bot, CheckCircle2, ClipboardList,
  Clock3, FileText, History, ReceiptText, UsersRound,
} from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState, staffDate, staffStatusLabel, staffStatusTone } from "@/components/dashboard/staff/staff-work-ui";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { StaffAuditRecord } from "@/repositories/staff-audit-repository";
import type { StaffWorkloadRecord } from "@/repositories/staff-assignment-repository";
import type { StaffAssignedRequest, StaffWorkData } from "@/repositories/staff-work-repository";
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

export function StaffFinance({ mode, workflows }: { mode: "invoices" | "payments"; workflows: WorkflowInstanceRecord[] }) {
  const statusKey = mode === "invoices" ? "invoiceStatus" : "paymentStatus";
  const heading = mode === "invoices" ? "Invoices" : "Payments";
  const pending = workflows.filter((workflow) => !["paid", "reconciled", "void", "refunded"].includes(workflow.financial[statusKey])).length;
  const balance = workflows.reduce((total, workflow) => total + workflow.financial.balanceDue, 0);

  return (
    <AdminPageSurface
      description={`${heading} recorded against the engagements you are permitted to access.`}
      icon={mode === "invoices" ? ReceiptText : Banknote}
      summary={[
        { label: "Records", value: workflows.length, helper: "Visible engagements", icon: ReceiptText },
        { label: "Open", value: pending, helper: "Not fully settled", icon: Clock3 },
        { label: "Balance due", value: balance.toLocaleString("en-KE"), helper: "Across visible currencies", icon: Banknote },
      ]}
      title={heading}
    >
      {workflows.length === 0 ? (
        <StaffEmptyState description="Financial records appear when an engagement is assigned to you." title="No financial records" />
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader><TableRow><TableHead>Engagement</TableHead><TableHead>Client</TableHead><TableHead>Status</TableHead><TableHead>Balance due</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {workflows.map((workflow) => {
                const status = workflow.financial[statusKey];
                return (
                  <TableRow key={workflow.id}>
                    <TableCell><p className="font-semibold text-foreground">{workflow.reference}</p><p className="mt-1 text-xs text-muted-foreground">{workflow.serviceName}</p></TableCell>
                    <TableCell>{workflow.clientName}</TableCell>
                    <TableCell><Badge tone={staffStatusTone(status)}>{staffStatusLabel(status)}</Badge></TableCell>
                    <TableCell>{workflow.financial.currency} {workflow.financial.balanceDue.toLocaleString("en-KE")}</TableCell>
                    <TableCell className="text-right"><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/engagements/${workflow.id}`}>Open<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPageSurface>
  );
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
