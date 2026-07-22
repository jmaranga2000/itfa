import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Circle,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  History,
  ListChecks,
  MessageSquareText,
  Plus,
  Printer,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
  UsersRound,
} from "lucide-react";
import { EngagementTeamAssignmentForm } from "@/components/dashboard/admin/engagement-team-assignment-form";
import { EngagementStageProgress } from "@/components/dashboard/engagements/engagement-stage-progress";
import { Badge } from "@/components/ui/badge";
import { ActionErrorPopup } from "@/components/ui/action-error-popup";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { uploadClientDocumentAction } from "@/features/client/document-actions";
import {
  addEngagementDocumentCommentAction,
  archiveCompletedEngagementAction,
  completeEngagementAction,
  createEngagementInvoiceAction,
  createEngagementTaskAction,
  createFollowUpEngagementAction,
  releaseEngagementDeliverableAction,
  requestClientCollaborationAction,
  respondToClientCollaborationAction,
  reviewEngagementTaskAction,
  reviewEngagementDeliverableAction,
  sendEngagementInvoiceAction,
  sendEngagementMessageAction,
} from "@/features/engagements/execution-actions";
import { reviewEngagementDocumentAction, updateEngagementTaskAction, uploadEngagementDocumentAction } from "@/features/engagement-workspace/actions";
import type { AppRole } from "@/features/authorization/roles";
import type { EngagementExecutionData } from "@/repositories/engagement-execution-repository";
import type { EngagementTeamCandidate, EngagementTeamRole } from "@/repositories/engagement-management-repository";

export const ENGAGEMENT_WORKSPACE_TABS = ["overview", "tasks", "documents", "deliverables", "messages", "finance", "timeline", "completion"] as const;
export type EngagementWorkspaceTab = (typeof ENGAGEMENT_WORKSPACE_TABS)[number];

const tabMeta: Array<{ key: EngagementWorkspaceTab; label: string; icon: typeof BriefcaseBusiness }> = [
  { key: "overview", label: "Overview", icon: BriefcaseBusiness },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "deliverables", label: "Deliverables", icon: FileCheck2 },
  { key: "messages", label: "Messages", icon: MessageSquareText },
  { key: "finance", label: "Finance", icon: CircleDollarSign },
  { key: "timeline", label: "Timeline", icon: Clock3 },
  { key: "completion", label: "Completion", icon: CheckCircle2 },
];

function dateLabel(value: string | null, time = false) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(time ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function money(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    not_started: "To do",
    ready: "To do",
    in_progress: "In progress",
    waiting_for_approval: "Waiting review",
    waiting_for_client: "Waiting for client",
    completed: "Completed",
    issued: "Sent",
    partially_paid: "Partially paid",
  };
  return labels[status] ?? status.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function statusTone(status: string) {
  if (["completed", "approved", "paid", "verified", "final"].includes(status)) return "green" as const;
  if (["overdue", "rejected", "changes_requested", "blocked"].includes(status)) return "red" as const;
  if (["waiting_for_approval", "pending", "pending_review", "partially_paid"].includes(status)) return "gold" as const;
  return "teal" as const;
}

function MobileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group min-w-0" open>
      <summary className="mb-3 flex cursor-pointer list-none items-center justify-between rounded-md border border-border bg-card px-4 py-3 font-semibold text-foreground md:hidden">
        {title}<span className="text-primary group-open:rotate-90">&gt;</span>
      </summary>
      <div className="min-w-0">{children}</div>
    </details>
  );
}

function taskNextAction(status: string) {
  if (["not_started", "ready"].includes(status)) return { label: "Start task", status: "in_progress" };
  if (status === "in_progress") return { label: "Submit for review", status: "waiting_for_approval" };
  if (status === "blocked") return { label: "Resume task", status: "in_progress" };
  return null;
}

function SectionIntro({
  complete,
  doneWhen,
  nextAction,
  purpose,
  title,
}: {
  complete: boolean;
  doneWhen: string;
  nextAction: string;
  purpose: string;
  title: string;
}) {
  return (
    <div className="mb-4 grid gap-4 rounded-md border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.65fr)] md:items-start">
      <div className="flex items-start gap-3">
        {complete ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />}
        <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-foreground">{title}</h2><Badge tone={complete ? "green" : "gold"}>{complete ? "Section complete" : "Work remains"}</Badge></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{purpose}</p></div>
      </div>
      <dl className="grid gap-2 text-sm"><div><dt className="text-xs font-semibold text-muted-foreground">DONE WHEN</dt><dd className="mt-1 text-foreground">{doneWhen}</dd></div><div><dt className="text-xs font-semibold text-muted-foreground">NEXT ACTION</dt><dd className="mt-1 font-semibold text-foreground">{complete ? "No action required" : nextAction}</dd></div></dl>
    </div>
  );
}

export function EngagementExecutionWorkspace({
  activeTab,
  data,
  portal,
  principal,
  query,
  teamCandidates = [],
}: {
  activeTab: EngagementWorkspaceTab;
  data: EngagementExecutionData;
  portal: "admin" | "staff" | "client";
  principal: { id: string; roleKeys: AppRole[] };
  query: { error?: string; saved?: string; missing?: string; team?: string; note?: string; replace?: string; transitionError?: string; transitioned?: string };
  teamCandidates?: EngagementTeamCandidate[];
}) {
  const { workflow } = data;
  const basePath = portal === "admin"
    ? `/admin/active-engagements/${workflow.id}`
    : `/${portal}/engagements/${workflow.id}`;
  const backPath = portal === "admin"
    ? workflow.status === "completed"
      ? "/admin/completed-engagements"
      : workflow.status === "archived"
        ? "/admin/archive"
        : "/admin/active-engagements"
    : `/${portal}/engagements`;
  const isAdmin = portal === "admin";
  const isClient = portal === "client";
  const visibleTabs = isClient
    ? tabMeta
        .filter((tab) => tab.key !== "tasks")
        .map((tab) => ({
          ...tab,
          label: ({ overview: "Summary", documents: "Files", deliverables: "Results", finance: "Invoices", timeline: "Updates", completion: "Completion" } as Partial<Record<EngagementWorkspaceTab, string>>)[tab.key] ?? tab.label,
        }))
    : tabMeta;
  const consultant = isAdmin || workflow.team.some((member) => member.userId === principal.id && member.role === "consultant");
  const reviewer = isAdmin || workflow.team.some((member) => member.userId === principal.id && member.role === "reviewer");
  const finance = isAdmin || workflow.team.some((member) => member.userId === principal.id && member.role === "finance_officer");
  const editable = workflow.status === "active";
  const workingDocuments = data.documents.filter((document) =>
    document.documentKind !== "final_deliverable" || document.deliverableStatus === "draft",
  );
  const replaceableDocuments = isClient
    ? data.documents.filter((document) => document.uploadedByUserId === principal.id)
    : data.documents;
  const deliverables = data.documents.filter((document) =>
    document.documentKind === "final_deliverable" && document.deliverableStatus !== "draft",
  );
  const latestDeliverables = deliverables.filter((document) =>
    !deliverables.some((candidate) => candidate.replacesDocumentId === document.id),
  );
  const pendingTasks = workflow.tasks.filter((task) => !["completed", "cancelled"].includes(task.status));
  const outstandingActions = workflow.clientActions.filter((action) => !["approved", "completed"].includes(action.status));
  const pendingDocumentReviews = workingDocuments.filter((document) => document.status === "pending_review");
  const documentsNeedingReplacement = workingDocuments.filter((document) => document.status === "replacement_requested");
  const teamReady = ["consultant", "reviewer", "finance_officer"].every((role) =>
    workflow.team.some((member) => member.role === role && member.userId),
  );
  const tasksComplete = workflow.tasks.length > 0 && pendingTasks.length === 0;
  const documentsComplete = workingDocuments.length > 0 && pendingDocumentReviews.length === 0 && documentsNeedingReplacement.length === 0;
  const deliverablesComplete = latestDeliverables.some((document) => document.deliverableStatus === "released");
  const messagesComplete = data.messages.length > 0;
  const financeComplete = workflow.financial.invoices.length > 0
    && workflow.financial.balanceDue <= 0
    && workflow.financial.invoices.every((invoice) => ["paid", "void", "refunded"].includes(invoice.status));
  const sectionState: Record<EngagementWorkspaceTab, { complete: boolean; doneWhen: string; nextAction: string; purpose: string }> = {
    overview: { complete: teamReady, purpose: "Confirm the client, service, assigned team, current process stage, health, and outstanding client actions.", doneWhen: "The consultant, reviewer, and finance officer are assigned and responsibilities are clear.", nextAction: "Complete the engagement team assignment." },
    tasks: { complete: tasksComplete, purpose: "Break the engagement into owned work, submit completed work for review, and record each reviewer decision.", doneWhen: "Every required task is completed or formally cancelled, including its required review.", nextAction: pendingTasks.length ? `Resolve ${pendingTasks.length} open task${pendingTasks.length === 1 ? "" : "s"}.` : "Create the engagement tasks." },
    documents: { complete: documentsComplete, purpose: "Exchange client evidence, working papers, and draft outputs while preserving review decisions and replacement history.", doneWhen: "At least one working document exists and no document is waiting for review or replacement.", nextAction: pendingDocumentReviews.length ? `Review ${pendingDocumentReviews.length} pending document${pendingDocumentReviews.length === 1 ? "" : "s"}.` : documentsNeedingReplacement.length ? `Replace ${documentsNeedingReplacement.length} returned document${documentsNeedingReplacement.length === 1 ? "" : "s"}.` : "Upload the first engagement document." },
    deliverables: { complete: deliverablesComplete, purpose: "Control the official final outputs that may be released to the client.", doneWhen: "At least one approved final deliverable has been released to the client.", nextAction: latestDeliverables.length ? "Complete approval and release for the final deliverable." : "Upload a final deliverable from Documents." },
    messages: { complete: messagesComplete, purpose: "Keep engagement-specific communication with the client and assigned team in one auditable conversation.", doneWhen: "The engagement conversation has been started.", nextAction: "Send the first engagement message." },
    finance: { complete: financeComplete, purpose: "Create and issue invoices, verify payments, and provide receipts from the engagement record.", doneWhen: "An invoice has been issued and the engagement balance is fully settled.", nextAction: workflow.financial.invoices.length ? "Resolve the outstanding invoice or payment." : "Create the engagement invoice." },
    timeline: { complete: workflow.activity.length > 0, purpose: "Review the chronological audit history generated by tasks, reviews, documents, messages, finance, and stage changes.", doneWhen: "Activity is being recorded automatically against the engagement.", nextAction: "Complete an engagement action to create the first event." },
    completion: { complete: ["completed", "archived"].includes(workflow.status), purpose: "Confirm all mandatory work, approvals, deliverables, client actions, finance, and closure notes before locking the record.", doneWhen: "The engagement is completed and its closure summary has been generated.", nextAction: "Resolve every missing completion requirement." },
  };
  const internalContinueTab: EngagementWorkspaceTab = !sectionState.overview.complete
    ? "overview"
    : !sectionState.tasks.complete
      ? "tasks"
      : !sectionState.documents.complete
        ? "documents"
        : !sectionState.deliverables.complete
          ? "deliverables"
          : !sectionState.finance.complete
            ? "finance"
            : "completion";
  const continueTab: EngagementWorkspaceTab = isClient
    ? outstandingActions.some((action) => Boolean(action.requiredDocumentType))
      ? "documents"
      : "overview"
    : internalContinueTab;
  const initialSelection = Object.fromEntries(["consultant", "reviewer", "finance_officer"].map((role) => [
    role,
    workflow.team.find((member) => member.role === role)?.userId ?? "",
  ])) as Record<EngagementTeamRole, string>;
  const missing = query.missing ? decodeURIComponent(query.missing).split("|") : [];
  const closureSummary = workflow.completion.closureSummary;
  const headerMetrics: Array<[string, string | number]> = isClient
    ? [
        ["Progress", `${workflow.progress.clientVisible}%`],
        ["Files shared", workingDocuments.length + deliverables.length],
        ["Balance", money(workflow.financial.currency, workflow.financial.balanceDue)],
      ]
    : [
        ["Pending tasks", pendingTasks.length],
        ["Documents uploaded", workingDocuments.length],
        ["Deliverables", deliverables.length],
        ["Messages", data.messages.length],
        ["Outstanding balance", money(workflow.financial.currency, workflow.financial.balanceDue)],
        ["Days remaining", data.daysRemaining === null ? "Not set" : data.daysRemaining < 0 ? `${Math.abs(data.daysRemaining)} overdue` : data.daysRemaining],
      ];

  return (
    <div className="grid w-full min-w-0 max-w-full gap-4 overflow-x-clip pb-24 md:pb-8">
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="gap-4 border-b border-border">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={workflow.status === "active" ? "green" : workflow.status === "completed" ? "teal" : "slate"}>{statusLabel(workflow.status)}</Badge>
                {workflow.status === "active" ? <Badge tone={data.health.tone}>{data.health.label}</Badge> : null}
                <span className="font-mono text-xs font-semibold text-primary">{workflow.reference}</span>
              </div>
              <CardTitle className="mt-3 text-2xl">{workflow.clientName}</CardTitle>
              <CardDescription className="mt-1">{workflow.serviceName}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={backPath}><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back</Link>
              <Link className={buttonClassName({ size: "sm" })} href={`${basePath}?tab=${continueTab}`}>Continue working<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className={`grid min-w-0 gap-3 sm:grid-cols-2 ${isClient ? "lg:grid-cols-3" : "xl:grid-cols-6"}`}>
            {headerMetrics.map(([label, value]) => <div className="min-w-0 rounded-md border border-border bg-background px-4 py-3" key={label}><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 break-words text-lg font-bold text-foreground">{value}</p></div>)}
          </div>
        </CardHeader>
        <nav aria-label="Engagement workspace" className="flex min-w-0 gap-1 overflow-x-auto p-2">
          {visibleTabs.map((tab) => {
            const complete = sectionState[tab.key].complete;
            const Icon = complete ? CheckCircle2 : tab.icon;
            return <Link className={`${buttonClassName({ variant: activeTab === tab.key ? "primary" : "ghost", size: "sm" })} whitespace-nowrap`} href={`${basePath}?tab=${tab.key}`} key={tab.key}><Icon aria-hidden="true" className={`h-4 w-4 ${complete && activeTab !== tab.key ? "text-success" : ""}`} />{tab.label}{complete ? <span className="sr-only"> complete</span> : null}</Link>;
          })}
        </nav>
      </Card>

      {query.saved ? <p className="rounded-md border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">Saved successfully. The engagement workspace and relevant notifications were updated.</p> : null}
      {query.error ? <ActionErrorPopup message="Check the information and your assigned role, then try again. Your existing engagement data has not been changed." /> : null}
      {query.team === "saved" ? <p className="rounded-md border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">The complete engagement team was saved and notified.</p> : null}
      {query.transitioned === "1" ? <p className="rounded-md border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">The engagement moved to the next process stage.</p> : null}
      {query.transitionError ? <p className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">The process stage could not advance: {query.transitionError}</p> : null}

      {activeTab === "overview" ? (
        <MobileSection title="Overview">
          <SectionIntro complete={sectionState.overview.complete} doneWhen={sectionState.overview.doneWhen} nextAction={sectionState.overview.nextAction} purpose={sectionState.overview.purpose} title="Overview and responsibility" />
          <div className="mb-4"><EngagementStageProgress canManage={editable && (isAdmin || principal.roleKeys.includes("engagement_manager"))} returnPath={basePath} workflow={workflow} /></div>
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <Card className="min-w-0 overflow-hidden shadow-none">
              <CardHeader><CardTitle>Engagement overview</CardTitle><CardDescription>Current position, responsibility and the next action required.</CardDescription></CardHeader>
              <CardContent className="grid gap-0">
                {[
                  ["Engagement reference", workflow.reference], ["Client name", workflow.clientName], ["Service", workflow.serviceName],
                  ["Current status", statusLabel(workflow.status)], ["Current workflow stage", workflow.currentStageName],
                  ["Engagement health", data.health.label],
                  ["Progress", `${workflow.progress.overall}%`], ["Start date", dateLabel(workflow.startDate)],
                  ["Due date", dateLabel(workflow.dueDate)], ["Last activity", dateLabel(workflow.lastActivityAt, true)],
                  ...(workflow.previousEngagementReference ? [["Previous engagement", workflow.previousEngagementReference]] : []),
                  ["Required next action", workflow.nextAction],
                ].map(([label, value]) => <div className="grid gap-1 border-b border-border py-3 sm:grid-cols-[12rem_minmax(0,1fr)]" key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-words text-sm font-semibold text-foreground">{value}</dd></div>)}
                <div className="mt-4"><div className="mb-2 flex justify-between text-xs font-semibold"><span>Overall progress</span><span>{workflow.progress.overall}%</span></div><div className="h-2 overflow-hidden rounded-sm bg-muted"><div className="h-full bg-primary" style={{ width: `${workflow.progress.overall}%` }} /></div></div>
              </CardContent>
            </Card>
            <div className="grid content-start gap-4">
              <Card className="shadow-none">
                <CardHeader><CardTitle>Assigned team</CardTitle></CardHeader>
                <CardContent className="grid gap-3">
                  {["consultant", "reviewer", "finance_officer"].map((role) => {
                    const member = workflow.team.find((item) => item.role === role);
                    return <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3" key={role}><div><p className="text-xs font-medium capitalize text-muted-foreground">{role.replaceAll("_", " ")}</p><p className="mt-1 font-semibold text-foreground">{member?.name ?? "Not assigned"}</p><p className="text-xs text-muted-foreground">{member?.department ?? ""}</p></div><UsersRound aria-hidden="true" className="h-5 w-5 text-primary" /></div>;
                  })}
                </CardContent>
              </Card>
              <Card className="shadow-none">
                <CardHeader><CardTitle>Client collaboration</CardTitle><CardDescription>Requests for documents, clarification, approval, or signature.</CardDescription></CardHeader>
                <CardContent className="grid gap-3">
                  {outstandingActions.map((action) => <div className="rounded-md border border-border p-3" key={action.key}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-foreground">{action.title}</p><Badge tone="gold">{statusLabel(action.status)}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{action.instructions}</p><p className="mt-2 text-xs text-muted-foreground">Due {dateLabel(action.dueDate)}</p>{isClient && editable ? <form action={respondToClientCollaborationAction} className="mt-3 grid gap-2"><input name="workflowId" type="hidden" value={workflow.id} /><input name="actionKey" type="hidden" value={action.key} /><input name="returnPath" type="hidden" value={basePath} /><Textarea name="response" placeholder="Add your response or confirmation..." required /><SubmitButton pendingText="Sending response..." size="sm"><Send className="h-4 w-4" />Send response</SubmitButton></form> : null}</div>)}
                  {outstandingActions.length === 0 ? <p className="text-sm text-muted-foreground">No client response is currently outstanding.</p> : null}
                  {consultant && editable ? <form action={requestClientCollaborationAction} className="grid gap-3 border-t border-border pt-4"><input name="workflowId" type="hidden" value={workflow.id} /><input name="returnPath" type="hidden" value={basePath} /><div className="grid gap-2"><Label htmlFor="client-action-title">Request</Label><Input id="client-action-title" name="title" placeholder="Upload additional tax records" required /></div><div className="grid gap-2"><Label htmlFor="client-action-instructions">Instructions</Label><Textarea id="client-action-instructions" name="instructions" placeholder="Explain exactly what the client should provide." required /></div><div className="grid gap-2"><Label htmlFor="client-action-due">Due date</Label><Input id="client-action-due" name="dueDate" required type="date" /></div><SubmitButton pendingText="Sending request..."><Send className="h-4 w-4" />Request client action</SubmitButton></form> : null}
                </CardContent>
              </Card>
            </div>
          </div>
          {isAdmin && teamCandidates.length > 0 && editable ? <Card className="mt-4 shadow-none"><CardHeader><CardTitle>Team assignment</CardTitle><CardDescription>Assign or update all delivery roles without leaving the engagement.</CardDescription></CardHeader><CardContent><EngagementTeamAssignmentForm candidates={teamCandidates} initialSelection={initialSelection} workflowId={workflow.id} /></CardContent></Card> : null}
        </MobileSection>
      ) : null}

      {activeTab === "tasks" ? (
        <MobileSection title="Tasks">
          <SectionIntro complete={sectionState.tasks.complete} doneWhen={sectionState.tasks.doneWhen} nextAction={sectionState.tasks.nextAction} purpose={sectionState.tasks.purpose} title="Task execution and review" />
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <Card className="overflow-hidden shadow-none">
              <CardHeader><CardTitle>Engagement tasks</CardTitle><CardDescription>Work moves from To Do to In Progress, Waiting Review, and Completed.</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {workflow.tasks.map((task) => {
                  const action = taskNextAction(task.status);
                  const canUpdate = editable && (isAdmin || task.assignedUserId === principal.id) && action;
                  return <article className="rounded-md border border-border p-4" key={task.key}><div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-foreground">{task.title}</h3><Badge tone={statusTone(task.status)}>{statusLabel(task.status)}</Badge><Badge tone={task.priority === "critical" || task.priority === "high" ? "red" : "slate"}>{statusLabel(task.priority)}</Badge></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>Assigned: {task.assignedUserName || statusLabel(task.assignedRole)}</span><span>Due: {dateLabel(task.dueDate)}</span></div></div>{canUpdate ? <form action={updateEngagementTaskAction}><input name="workflowId" type="hidden" value={workflow.id} /><input name="taskKey" type="hidden" value={task.key} /><input name="status" type="hidden" value={action.status} /><input name="returnPath" type="hidden" value={basePath} /><SubmitButton pendingText="Updating..." size="sm" variant="secondary">{action.label}<ArrowRight className="h-4 w-4" /></SubmitButton></form> : null}</div>{task.reviewHistory.length > 0 ? <div className="mt-3 grid gap-2 border-t border-border pt-3">{task.reviewHistory.map((review, index) => <p className="text-sm text-muted-foreground" key={`${review.reviewedAt}-${index}`}><strong className="text-foreground">{statusLabel(review.decision)}</strong> by {review.reviewerName}: {review.comments}</p>)}</div> : null}{reviewer && editable && task.status === "waiting_for_approval" ? <form action={reviewEngagementTaskAction} className="mt-4 grid gap-3 rounded-md bg-muted/25 p-3"><input name="workflowId" type="hidden" value={workflow.id} /><input name="taskKey" type="hidden" value={task.key} /><input name="returnPath" type="hidden" value={basePath} /><div className="grid gap-2 sm:grid-cols-[12rem_minmax(0,1fr)]"><Select name="decision"><option value="approved">Approve</option><option value="changes_requested">Request changes</option></Select><Textarea className="min-h-20" name="comments" placeholder="Record the review decision and comments..." required /></div><SubmitButton className="justify-self-end" pendingText="Saving review..." size="sm"><ShieldCheck className="h-4 w-4" />Save review decision</SubmitButton></form> : null}</article>;
                })}
                {workflow.tasks.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No tasks have been created for this engagement.</p> : null}
              </CardContent>
            </Card>
            {consultant && editable ? <Card className="h-fit shadow-none"><CardHeader><CardTitle>Create task</CardTitle><CardDescription>Assign a clear piece of work to one team member.</CardDescription></CardHeader><CardContent><form action={createEngagementTaskAction} className="grid gap-3"><input name="workflowId" type="hidden" value={workflow.id} /><input name="returnPath" type="hidden" value={basePath} /><div className="grid gap-2"><Label htmlFor="task-title">Task title</Label><Input id="task-title" name="title" required /></div><div className="grid gap-2"><Label htmlFor="task-description">Description</Label><Textarea id="task-description" name="description" required /></div><div className="grid gap-2"><Label htmlFor="task-assignee">Assigned staff</Label><Select id="task-assignee" name="assignedUserId" required><option value="">Select staff</option>{workflow.team.filter((member) => member.userId).map((member) => <option key={`${member.userId}-${member.role}`} value={member.userId ?? ""}>{member.name} - {statusLabel(member.role)}</option>)}</Select></div><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="task-priority">Priority</Label><Select id="task-priority" name="priority"><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option><option value="low">Low</option></Select></div><div className="grid gap-2"><Label htmlFor="task-due">Due date</Label><Input id="task-due" name="dueDate" required type="date" /></div></div><SubmitButton pendingText="Creating task..."><Plus className="h-4 w-4" />Create task</SubmitButton></form></CardContent></Card> : null}
          </div>
        </MobileSection>
      ) : null}

      {activeTab === "documents" ? (
        <MobileSection title="Documents">
          <SectionIntro complete={sectionState.documents.complete} doneWhen={sectionState.documents.doneWhen} nextAction={sectionState.documents.nextAction} purpose={sectionState.documents.purpose} title="Working documents and evidence" />
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <Card className="shadow-none">
              <CardHeader><CardTitle>Document exchange</CardTitle><CardDescription>Client evidence, working papers, and drafts stay here until their review or replacement is resolved.</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {workingDocuments.map((document) => {
                  const filePath = `/api/engagements/${workflow.id}/documents/${document.id}`;
                  const awaitingReview = document.status === "pending_review";
                  const needsReplacement = document.status === "replacement_requested";
                  return (
                    <article className="rounded-md border border-border p-4" key={document.id}>
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><p className="break-all font-semibold text-foreground">{document.name}</p><Badge tone={statusTone(document.status)}>{statusLabel(document.status)}</Badge><Badge>Version {document.version}</Badge></div>
                          <p className="mt-2 text-xs text-muted-foreground">{statusLabel(document.documentKind)} / Uploaded by {document.uploadedByName} on {dateLabel(document.uploadedAt, true)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2"><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`${filePath}?preview=1`} target="_blank"><Eye className="h-4 w-4" />Preview</Link><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={filePath}><Download className="h-4 w-4" />Download</Link>{needsReplacement && editable && document.uploadedByUserId === principal.id ? <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`${basePath}?tab=documents&replace=${document.id}#document-upload`}><RefreshCw className="h-4 w-4" />Upload replacement</Link> : null}</div>
                      </div>

                      {awaitingReview ? <div className="mt-3 rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-foreground"><strong>Review required.</strong> An assigned reviewer or administrator must inspect this file and record a decision.</div> : null}
                      {needsReplacement ? <div className="mt-3 rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-foreground"><strong>Changes requested.</strong> The uploader should replace this version before review continues.</div> : null}

                      {reviewer && editable && awaitingReview && !isClient ? (
                        <form action={reviewEngagementDocumentAction} className="mt-4 grid gap-3 border-t border-border pt-4">
                          <input name="workflowId" type="hidden" value={workflow.id} /><input name="documentId" type="hidden" value={document.id} /><input name="returnPath" type="hidden" value={basePath} />
                          <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]"><Select name="decision"><option value="approved">Approve document</option><option value="changes_requested">Request changes</option></Select><Textarea className="min-h-20" name="comments" placeholder="Record the checks completed and the reason for this decision..." required /></div>
                          <SubmitButton className="justify-self-end" pendingText="Saving review..." size="sm"><ShieldCheck className="h-4 w-4" />Save document review</SubmitButton>
                        </form>
                      ) : null}

                      {document.comments.length > 0 ? <div className="mt-3 grid gap-2 border-t border-border pt-3">{document.comments.map((comment, index) => <p className="text-sm text-muted-foreground" key={`${comment.createdAt}-${index}`}><strong className="text-foreground">{comment.authorName}</strong>: {comment.body}</p>)}</div> : null}
                      {editable ? <form action={addEngagementDocumentCommentAction} className="mt-3 flex flex-col gap-2 sm:flex-row"><input name="workflowId" type="hidden" value={workflow.id} /><input name="documentId" type="hidden" value={document.id} /><input name="returnPath" type="hidden" value={basePath} /><Input aria-label={`Comment on ${document.name}`} name="body" placeholder="Add a document comment..." required /><SubmitButton pendingText="Adding..." size="sm" variant="secondary">Add comment</SubmitButton></form> : null}
                    </article>
                  );
                })}
                {workingDocuments.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No working documents have been exchanged yet.</p> : null}
              </CardContent>
            </Card>
            {editable ? (
              <Card className="h-fit min-w-0 overflow-hidden shadow-none" id="document-upload">
                <CardHeader><CardTitle>{isClient ? "Send a file" : "Upload document"}</CardTitle><CardDescription>{isClient ? "Choose the requested file and send it securely to your IFTA team." : "Add a working file for review or a final output for controlled release."}</CardDescription></CardHeader>
                <CardContent className="grid gap-4">
                  {!isClient ? <ol className="grid gap-2 text-xs text-muted-foreground"><li className="flex gap-2"><span className="font-semibold text-primary">1.</span><span>Drafts and evidence enter Pending review.</span></li><li className="flex gap-2"><span className="font-semibold text-primary">2.</span><span>The assigned reviewer approves the file or requests a replacement.</span></li><li className="flex gap-2"><span className="font-semibold text-primary">3.</span><span>Final outputs move to Deliverables and are released separately.</span></li></ol> : null}
                  <form action={isClient ? uploadClientDocumentAction : uploadEngagementDocumentAction} className="grid gap-3 border-t border-border pt-4" encType="multipart/form-data">
                    <input name="workflowId" type="hidden" value={workflow.id} /><input name="returnPath" type="hidden" value={basePath} />
                    {!isClient ? <><div className="grid gap-2"><Label htmlFor="document-title">Document title</Label><Input id="document-title" name="title" placeholder="Corporate tax review - draft" required /></div><div className="grid gap-2"><Label htmlFor="document-kind">Document type</Label><Select id="document-kind" name="documentKind"><option value="draft_deliverable">Draft report or deliverable</option><option value="technical_evidence">Working paper or technical evidence</option><option value="final_deliverable">Final deliverable for release</option></Select></div></> : null}
                    {isClient ? (
                      query.replace ? <><input name="replacesDocumentId" type="hidden" value={query.replace} /><p className="rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-foreground">This file will replace the version returned by your reviewer.</p></> : null
                    ) : (
                      <div className="grid gap-2"><Label htmlFor="replace-document">Version</Label><Select defaultValue={query.replace ?? ""} id="replace-document" name="replacesDocumentId"><option value="">Create a new document</option>{replaceableDocuments.map((document) => <option key={document.id} value={document.id}>Replace {document.name} (v{document.version})</option>)}</Select></div>
                    )}
                    <div className="grid min-w-0 gap-2"><Label htmlFor="workspace-document">Choose file</Label><Input className="min-w-0 max-w-full" id="workspace-document" name="document" required type="file" /></div>
                    <SubmitButton className="w-full justify-center" pendingText="Sending file..."><Upload className="h-4 w-4" />{isClient ? "Send file" : "Upload document"}</SubmitButton>
                  </form>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </MobileSection>
      ) : null}

      {activeTab === "deliverables" ? (
        <MobileSection title="Deliverables">
          <SectionIntro complete={sectionState.deliverables.complete} doneWhen={sectionState.deliverables.doneWhen} nextAction={sectionState.deliverables.nextAction} purpose={sectionState.deliverables.purpose} title="Official client deliverables" />
          <Card className="overflow-hidden shadow-none">
            <CardHeader className="border-b border-border">
              <CardTitle>Official deliverables</CardTitle>
              <CardDescription>{isClient ? "Final outputs released to you by the engagement team." : "Final outputs move through review and remain private until they are released."}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-4">
              {latestDeliverables.map((document) => {
                const filePath = `/api/engagements/${workflow.id}/documents/${document.id}`;
                const history = deliverables
                  .filter((candidate) => candidate.name === document.name || candidate.id === document.replacesDocumentId || candidate.replacesDocumentId === document.id)
                  .sort((left, right) => right.version - left.version);
                return (
                  <article className="rounded-md border border-border p-4" key={document.id}>
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words font-semibold text-foreground">{document.name}</h3>
                          <Badge tone={statusTone(document.deliverableStatus)}>{statusLabel(document.deliverableStatus)}</Badge>
                          <Badge>Version {document.version}</Badge>
                        </div>
                        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
                          <div><dt className="text-xs text-muted-foreground">Document type</dt><dd className="mt-1 font-medium text-foreground">{document.contentType}</dd></div>
                          <div><dt className="text-xs text-muted-foreground">Prepared by</dt><dd className="mt-1 font-medium text-foreground">{document.preparedByName}</dd></div>
                          <div><dt className="text-xs text-muted-foreground">Reviewed by</dt><dd className="mt-1 font-medium text-foreground">{document.reviewedByName || "Not reviewed"}</dd></div>
                          <div><dt className="text-xs text-muted-foreground">Uploaded</dt><dd className="mt-1 font-medium text-foreground">{dateLabel(document.uploadedAt, true)}</dd></div>
                          <div><dt className="text-xs text-muted-foreground">Released</dt><dd className="mt-1 font-medium text-foreground">{dateLabel(document.releasedAt, true)}</dd></div>
                        </dl>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`${filePath}?preview=1`} target="_blank"><Eye className="h-4 w-4" />Preview</Link>
                        <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={filePath}><Download className="h-4 w-4" />Download</Link>
                        {!isClient && editable ? <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`${basePath}?tab=documents&replace=${document.id}#document-upload`}><RefreshCw className="h-4 w-4" />Replace version</Link> : null}
                      </div>
                    </div>

                    {history.length > 1 ? (
                      <details className="mt-4 border-t border-border pt-3">
                        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-primary"><History className="h-4 w-4" />Version history ({history.length})</summary>
                        <div className="mt-3 grid gap-2">
                          {history.map((version) => <div className="flex flex-col justify-between gap-2 rounded-md bg-muted/30 px-3 py-2 text-sm sm:flex-row sm:items-center" key={version.id}><span>Version {version.version} - {dateLabel(version.uploadedAt, true)}</span><Link className="font-semibold text-primary" href={`/api/engagements/${workflow.id}/documents/${version.id}`} target="_blank">Open version</Link></div>)}
                        </div>
                      </details>
                    ) : null}

                    {reviewer && editable && document.deliverableStatus === "pending_review" ? (
                      <form action={reviewEngagementDeliverableAction} className="mt-4 grid gap-3 border-t border-border pt-4">
                        <input name="workflowId" type="hidden" value={workflow.id} />
                        <input name="documentId" type="hidden" value={document.id} />
                        <input name="returnPath" type="hidden" value={basePath} />
                        <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
                          <Select name="decision"><option value="approved">Approve deliverable</option><option value="changes_requested">Request changes</option></Select>
                          <Textarea className="min-h-20" name="comments" placeholder="Record the review decision and any instructions..." required />
                        </div>
                        <SubmitButton className="justify-self-end" pendingText="Saving review..." size="sm"><ShieldCheck className="h-4 w-4" />Save review</SubmitButton>
                      </form>
                    ) : null}

                    {consultant && editable && document.deliverableStatus === "approved" ? (
                      <form action={releaseEngagementDeliverableAction} className="mt-4 flex justify-end border-t border-border pt-4">
                        <input name="workflowId" type="hidden" value={workflow.id} />
                        <input name="documentId" type="hidden" value={document.id} />
                        <input name="returnPath" type="hidden" value={basePath} />
                        <SubmitButton pendingText="Releasing..." size="sm"><Send className="h-4 w-4" />Release to client</SubmitButton>
                      </form>
                    ) : null}
                  </article>
                );
              })}
              {latestDeliverables.length === 0 ? <div className="grid justify-items-center gap-2 py-12 text-center"><FileCheck2 className="h-8 w-8 text-muted-foreground" /><p className="font-semibold text-foreground">No official deliverables yet</p><p className="max-w-md text-sm text-muted-foreground">{isClient ? "Released final outputs will appear here." : "Upload a final report from Documents to begin its approval and release process."}</p>{!isClient && editable ? <Link className={buttonClassName({ size: "sm" })} href={`${basePath}?tab=documents`}><Upload className="h-4 w-4" />Upload final document</Link> : null}</div> : null}
            </CardContent>
          </Card>
        </MobileSection>
      ) : null}

      {activeTab === "messages" ? (
        <MobileSection title="Messages">
          <SectionIntro complete={sectionState.messages.complete} doneWhen={sectionState.messages.doneWhen} nextAction={sectionState.messages.nextAction} purpose={sectionState.messages.purpose} title="Engagement conversation" />
          <Card className="overflow-hidden shadow-none"><CardHeader className="border-b border-border"><CardTitle>Engagement conversation</CardTitle><CardDescription>Only the client and assigned engagement participants can access this conversation.</CardDescription></CardHeader><CardContent className="p-0"><div className="grid max-h-[32rem] gap-3 overflow-y-auto p-4">{data.messages.map((message) => { const mine = message.senderUserId === principal.id; return <div className={`max-w-[86%] rounded-md px-4 py-3 ${mine ? "ml-auto bg-primary text-primary-foreground" : "mr-auto border border-border bg-muted/40 text-foreground"}`} key={message.id}><p className={`text-xs font-semibold ${mine ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{message.senderName}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.body}</p>{message.attachments.map((attachment) => <Link className={`mt-2 flex items-center gap-2 text-xs font-semibold underline ${mine ? "text-primary-foreground" : "text-primary"}`} href={attachment.url} key={attachment.url}><FileText className="h-3.5 w-3.5" />{attachment.fileName}</Link>)}<p className={`mt-2 text-[11px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{dateLabel(message.createdAt, true)}</p></div>; })}{data.messages.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Start the engagement conversation below.</p> : null}</div>{data.conversation && workflow.status !== "archived" ? <form action={sendEngagementMessageAction} className="grid gap-3 border-t border-border bg-card p-4"><input name="workflowId" type="hidden" value={workflow.id} /><input name="conversationId" type="hidden" value={data.conversation.id} /><input name="returnPath" type="hidden" value={basePath} /><Textarea name="body" placeholder="Write a message. Use @name to mention a team member..." required /><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div className="grid flex-1 gap-2"><Label htmlFor="message-attachment">Attach an engagement document</Label><Select id="message-attachment" name="attachmentDocumentId"><option value="">No attachment</option>{data.documents.map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}</Select></div><SubmitButton pendingText="Sending..."><Send className="h-4 w-4" />Send message</SubmitButton></div></form> : null}</CardContent></Card>
        </MobileSection>
      ) : null}

      {activeTab === "finance" ? (
        <MobileSection title="Finance">
          <SectionIntro complete={sectionState.finance.complete} doneWhen={sectionState.finance.doneWhen} nextAction={sectionState.finance.nextAction} purpose={sectionState.finance.purpose} title="Invoices and payments" />
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="grid gap-4">
              <Card className="shadow-none"><CardHeader><CardTitle>Invoices</CardTitle><CardDescription>Draft, sent, partially paid, paid, and overdue invoice records.</CardDescription></CardHeader><CardContent className="grid gap-3">{workflow.financial.invoices.map((invoice) => <article className="flex flex-col justify-between gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center" key={invoice.invoiceId}><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{invoice.invoiceNumber}</p><Badge tone={statusTone(invoice.status)}>{statusLabel(invoice.status)}</Badge></div><p className="mt-2 text-sm text-muted-foreground">Issued {dateLabel(invoice.issueDate)} | Due {dateLabel(invoice.dueDate)} | {money(invoice.currency, invoice.amount)}</p></div><div className="flex gap-2"><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/engagements/${workflow.id}/invoices/${invoice.invoiceId}`} target="_blank"><FileText className="h-4 w-4" />View invoice</Link>{finance && editable && invoice.status === "draft" ? <form action={sendEngagementInvoiceAction}><input name="workflowId" type="hidden" value={workflow.id} /><input name="invoiceId" type="hidden" value={invoice.invoiceId} /><input name="returnPath" type="hidden" value={basePath} /><SubmitButton pendingText="Sending..." size="sm"><Send className="h-4 w-4" />Send</SubmitButton></form> : null}</div></article>)}{workflow.financial.invoices.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No invoices have been generated.</p> : null}</CardContent></Card>
              <Card className="shadow-none"><CardHeader><CardTitle>Payments and receipts</CardTitle><CardDescription>Client payment records and finance verification decisions.</CardDescription></CardHeader><CardContent className="grid gap-3">{data.payments.map((payment) => <article className="flex flex-col justify-between gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center" key={payment.id}><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{payment.transactionReference}</p><Badge tone={statusTone(payment.status)}>{statusLabel(payment.status)}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{dateLabel(payment.submittedAt)} | {statusLabel(payment.method)} | {money(payment.currency, payment.amount)}</p></div>{payment.status === "verified" ? <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/engagements/${workflow.id}/payments/${payment.id}/receipt`} target="_blank"><Download className="h-4 w-4" />Receipt</Link> : null}</article>)}{data.payments.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No payments have been recorded.</p> : null}{isClient && editable ? <Link className={buttonClassName()} href={`/client/payments/new?workflowId=${workflow.id}`}>Record a payment<ArrowRight className="h-4 w-4" /></Link> : null}</CardContent></Card>
            </div>
            {finance && editable ? <Card className="h-fit shadow-none"><CardHeader><CardTitle>Generate invoice</CardTitle><CardDescription>Create a draft, then review and send it to the client.</CardDescription></CardHeader><CardContent><form action={createEngagementInvoiceAction} className="grid gap-3"><input name="workflowId" type="hidden" value={workflow.id} /><input name="returnPath" type="hidden" value={basePath} /><div className="grid gap-2"><Label htmlFor="invoice-amount">Amount ({workflow.financial.currency})</Label><Input id="invoice-amount" min="1" name="amount" required step="0.01" type="number" /></div><div className="grid gap-2"><Label htmlFor="invoice-due">Due date</Label><Input id="invoice-due" name="dueDate" required type="date" /></div><div className="grid gap-2"><Label htmlFor="invoice-notes">Notes</Label><Textarea id="invoice-notes" name="notes" placeholder="Scope, billing milestone, or payment instructions..." /></div><SubmitButton pendingText="Creating invoice..."><Plus className="h-4 w-4" />Create draft invoice</SubmitButton></form></CardContent></Card> : null}
          </div>
        </MobileSection>
      ) : null}

      {activeTab === "timeline" ? (
        <MobileSection title="Timeline">
          <SectionIntro complete={sectionState.timeline.complete} doneWhen={sectionState.timeline.doneWhen} nextAction={sectionState.timeline.nextAction} purpose={sectionState.timeline.purpose} title="Timeline and audit history" />
          <Card className="shadow-none"><CardHeader><CardTitle>Engagement timeline</CardTitle><CardDescription>The newest activity appears first and remains part of the permanent record.</CardDescription></CardHeader><CardContent><ol className="grid gap-0">{[...workflow.activity].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).map((event, index, events) => <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3" key={`${event.type}-${event.createdAt}-${index}`}><div className="flex flex-col items-center"><span className="mt-1 h-2.5 w-2.5 rounded-full border-2 border-primary bg-card" />{index < events.length - 1 ? <span className="min-h-14 w-px flex-1 bg-border" /> : null}</div><div className="pb-5"><div className="flex flex-col justify-between gap-1 sm:flex-row"><p className="font-semibold text-foreground">{event.title}</p><time className="text-xs text-muted-foreground">{dateLabel(event.createdAt, true)}</time></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{event.description}</p><p className="mt-1 text-xs text-muted-foreground">{event.actorName}</p></div></li>)}</ol></CardContent></Card>
        </MobileSection>
      ) : null}

      {activeTab === "completion" ? (
        <MobileSection title="Completion">
          <SectionIntro complete={sectionState.completion.complete} doneWhen={sectionState.completion.doneWhen} nextAction={sectionState.completion.nextAction} purpose={sectionState.completion.purpose} title="Completion and closure" />
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <Card className="min-w-0 shadow-none">
              <CardHeader><CardTitle>Completion readiness</CardTitle><CardDescription>Every required item must be complete before the engagement can be locked.</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {missing.length > 0 ? <div className="break-words rounded-md border border-danger/30 bg-danger-soft p-3 text-sm font-semibold text-danger">Completion was blocked: {missing.join(", ")}.</div> : null}
                {data.completionRequirements.map((requirement) => (
                  <div className="flex min-w-0 flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between" key={requirement.key}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words font-semibold text-foreground">{requirement.label}</p>
                        <Badge tone={requirement.complete ? "green" : "gold"}>{requirement.complete ? "Ready" : "Missing"}</Badge>
                      </div>
                      <p className="mt-1 break-words text-sm text-muted-foreground">{requirement.detail}</p>
                    </div>
                    {!requirement.complete && !isClient ? (
                      <Link className={buttonClassName({ className: "shrink-0", size: "sm", variant: "secondary" })} href={`${basePath}?tab=${requirement.actionTab}${requirement.actionHash ? `#${requirement.actionHash}` : ""}`}>
                        {requirement.actionLabel}
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                ))}
                {workflow.completion.summary ? <div className="rounded-md border border-success/30 bg-success-soft p-4"><p className="font-semibold text-success">Completion summary</p><p className="mt-2 text-sm leading-6 text-foreground">{workflow.completion.summary}</p><p className="mt-2 text-xs text-muted-foreground">Completed {dateLabel(workflow.completion.completedAt, true)} by {workflow.completion.completedByName}</p></div> : null}
              </CardContent>
            </Card>
            <Card className="h-fit shadow-none"><CardHeader><CardTitle>{workflow.status === "active" ? "Complete engagement" : workflow.status === "completed" ? "Archive engagement" : "Read-only record"}</CardTitle><CardDescription>{workflow.status === "active" ? "Completion locks tasks, document editing, and review actions." : workflow.status === "completed" ? "Create one ZIP package containing the workflow, files, messages, finance, timeline, approvals, and audit history." : "Archived engagements cannot be edited without administrator restoration."}</CardDescription></CardHeader><CardContent>{isAdmin && workflow.status === "active" ? <form action={completeEngagementAction} className="grid gap-3"><input name="workflowId" type="hidden" value={workflow.id} /><input name="returnPath" type="hidden" value={basePath} /><div className="grid gap-2"><Label htmlFor="completion-notes">Completion notes</Label><Textarea id="completion-notes" minLength={10} name="notes" placeholder="Summarize the completed work, outcome, and final client handover..." required /></div><SubmitButton pendingText="Completing engagement..."><CheckCircle2 className="h-4 w-4" />Complete engagement</SubmitButton></form> : isAdmin && workflow.status === "completed" ? <form action={archiveCompletedEngagementAction}><input name="workflowId" type="hidden" value={workflow.id} /><input name="returnPath" type="hidden" value={basePath} /><SubmitButton pendingText="Creating ZIP archive..."><Archive className="h-4 w-4" />Create ZIP and archive</SubmitButton></form> : <p className="text-sm text-muted-foreground">{workflow.status === "active" ? "Only an administrator can complete the engagement." : "No further editing is available."}</p>}</CardContent></Card>
          </div>
          {closureSummary && isAdmin ? (
            <Card className="mt-4 shadow-none">
              <CardHeader className="flex flex-col justify-between gap-3 border-b border-border md:flex-row md:items-start">
                <div><CardTitle>Closure summary</CardTitle><CardDescription className="mt-1">Generated automatically from the permanent engagement record.</CardDescription></div>
                <div className="flex flex-wrap gap-2">
                  <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/engagements/${workflow.id}/closure-summary`} target="_blank"><Eye className="h-4 w-4" />View PDF</Link>
                  <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/engagements/${workflow.id}/closure-summary?download=1`}><Download className="h-4 w-4" />Download</Link>
                  <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/engagements/${workflow.id}/closure-summary`} target="_blank"><Printer className="h-4 w-4" />Print</Link>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 md:grid-cols-3">
                <details className="rounded-md border border-border p-3" open><summary className="cursor-pointer font-semibold text-foreground">Work summary</summary><dl className="mt-3 grid gap-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Tasks completed</dt><dd className="font-semibold">{closureSummary.totalTasksCompleted}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Documents</dt><dd className="font-semibold">{closureSummary.totalDocumentsUploaded}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Deliverables released</dt><dd className="font-semibold">{closureSummary.totalDeliverablesReleased}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Internal reviews</dt><dd className="font-semibold">{closureSummary.totalInternalReviews}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Messages</dt><dd className="font-semibold">{closureSummary.totalMessages}</dd></div></dl></details>
                <details className="rounded-md border border-border p-3" open><summary className="cursor-pointer font-semibold text-foreground">Financial summary</summary><dl className="mt-3 grid gap-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Total invoiced</dt><dd className="font-semibold">{money(workflow.financial.currency, closureSummary.totalInvoiced)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Total paid</dt><dd className="font-semibold">{money(workflow.financial.currency, closureSummary.totalPaid)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Outstanding</dt><dd className="font-semibold">{money(workflow.financial.currency, closureSummary.outstandingBalance)}</dd></div></dl></details>
                <details className="rounded-md border border-border p-3" open><summary className="cursor-pointer font-semibold text-foreground">Final outcome</summary><dl className="mt-3 grid gap-2 text-sm"><div><dt className="text-muted-foreground">Approved by</dt><dd className="mt-1 font-semibold">{workflow.completion.completedByName}</dd></div><div><dt className="text-muted-foreground">Completed</dt><dd className="mt-1 font-semibold">{dateLabel(workflow.completion.completedAt, true)}</dd></div><div><dt className="text-muted-foreground">Notes</dt><dd className="mt-1 leading-6">{workflow.completion.notes}</dd></div></dl></details>
              </CardContent>
            </Card>
          ) : null}
          {isAdmin && ["completed", "archived"].includes(workflow.status) ? (
            <Card className="mt-4 shadow-none">
              <CardHeader><CardTitle>Create follow-up engagement</CardTitle><CardDescription>Start fresh work for this client while keeping a permanent link to {workflow.reference}. Tasks, messages, finance, and progress are not copied.</CardDescription></CardHeader>
              <CardContent><form action={createFollowUpEngagementAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><input name="workflowId" type="hidden" value={workflow.id} /><input name="returnPath" type="hidden" value={basePath} /><div className="grid gap-2"><Label htmlFor="follow-up-service">Service for the follow-up</Label><Input defaultValue={workflow.serviceName} id="follow-up-service" name="serviceName" required /></div><SubmitButton pendingText="Creating follow-up..."><RefreshCw className="h-4 w-4" />Create follow-up</SubmitButton></form></CardContent>
            </Card>
          ) : null}
        </MobileSection>
      ) : null}

      <Link className={`${buttonClassName()} fixed inset-x-4 bottom-4 z-30 shadow-lg md:hidden`} href={`${basePath}?tab=${continueTab}`}>Continue working<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
    </div>
  );
}
