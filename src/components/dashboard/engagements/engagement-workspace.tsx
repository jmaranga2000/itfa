import Link from "next/link";
import { ArrowRight, CheckCircle2, Download, FileCheck2, FileUp, ListChecks, MessageSquareText, NotebookPen, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { reviewEngagementDocumentAction, updateEngagementTaskAction, uploadEngagementDocumentAction } from "@/features/engagement-workspace/actions";
import type { WorkflowTaskStatus } from "@/features/workflows/types";
import type { EngagementDocumentRecord } from "@/repositories/engagement-workspace-repository";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

function statusTone(status: string) {
  if (["completed", "approved", "final"].includes(status)) return "green" as const;
  if (["blocked", "rejected", "replacement_requested", "overdue"].includes(status)) return "red" as const;
  if (["waiting_for_approval", "pending_review", "changes_requested"].includes(status)) return "gold" as const;
  return "slate" as const;
}

function nextTaskAction(status: WorkflowTaskStatus) {
  if (["completed", "cancelled"].includes(status)) return null;
  if (status === "in_progress") return { label: "Submit for review", status: "waiting_for_approval" as const };
  if (status === "waiting_for_approval") return { label: "Complete task", status: "completed" as const };
  if (status === "blocked") return { label: "Resume task", status: "in_progress" as const };
  return { label: "Start task", status: "in_progress" as const };
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function sizeLabel(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

const notices: Record<string, string> = {
  task: "Task status updated.",
  review: "Technical review recorded.",
  document: "Engagement document uploaded.",
};

const errors: Record<string, string> = {
  task: "Choose a valid task action.",
  "task-access": "You cannot update that task.",
  review: "Choose a document, decision, and add review comments.",
  "review-access": "The technical review could not be recorded.",
  document: "Add a title, document type, and file.",
  "document-size": "The file must be 20 MB or smaller.",
  "document-type": "Upload a PDF, Word, Excel, CSV, JPG, or PNG file.",
  "document-upload": "The document could not be stored. Please try again.",
};

export function EngagementWorkspace({
  documents,
  error,
  notice,
  portal,
  workflow,
}: {
  documents: EngagementDocumentRecord[];
  error?: string;
  notice?: string;
  portal: "admin" | "staff";
  workflow: WorkflowInstanceRecord;
}) {
  const returnPath = portal === "admin" ? `/admin/workflows/${workflow.id}` : `/staff/engagements/${workflow.id}`;
  const taskHref = `${portal === "admin" ? "/admin/tasks" : "/staff/tasks"}?returnTo=${encodeURIComponent(returnPath)}`;
  const pendingReview = documents.filter((document) => ["pending_review", "replacement_requested"].includes(document.status));
  const downloadBase = portal === "admin" ? "/api/admin/documents" : "/api/staff/documents";

  return (
    <section className="grid min-w-0 gap-5" id="engagement-workspace">
      {notice && notices[notice] ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notices[notice]}</p> : null}
      {error && errors[error] ? <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{errors[error]}</p> : null}

      <div className="flex flex-col justify-between gap-4 border-y border-border bg-brand-soft px-5 py-5 sm:flex-row sm:items-center">
        <div><p className="text-xs font-bold text-brand-deep">LIVE ENGAGEMENT</p><h2 className="mt-1 text-xl font-bold text-brand-deep">Engagement workspace</h2><p className="mt-1 text-sm text-brand-deep/75">Complete tasks, review technical work, and exchange controlled documents with the client.</p></div>
        <div className="flex flex-wrap gap-2">
          <Link className={buttonClassName({ variant: "secondary" })} href={taskHref}><ListChecks className="h-4 w-4" />Task queue</Link>
          {portal === "staff" ? <Link className={buttonClassName({ variant: "secondary" })} href={`/staff/notes/new?workflowId=${workflow.id}`}><NotebookPen className="h-4 w-4" />Add note</Link> : null}
        </div>
      </div>

      <Card className="min-w-0 max-w-full overflow-hidden">
        <CardHeader><CardTitle>Task execution</CardTitle><CardDescription>Move assigned work from start through review and completion.</CardDescription></CardHeader>
        <CardContent className="block w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain p-0 [scrollbar-gutter:stable]">
          <Table className="min-w-[940px]">
            <TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead><TableHead>Due</TableHead><TableHead>Next step</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {workflow.tasks.map((task) => {
                const action = nextTaskAction(task.status);
                return <TableRow key={task.key}><TableCell><p className="font-semibold text-foreground">{task.title}</p><p className="mt-1 max-w-80 text-xs text-muted-foreground">{task.description}</p></TableCell><TableCell>{task.assignedUserName || task.assignedRole}</TableCell><TableCell><Badge tone={statusTone(task.status)}>{task.status.replaceAll("_", " ")}</Badge></TableCell><TableCell>{task.dueDate ? dateLabel(task.dueDate) : "Not set"}</TableCell><TableCell>{task.blockerReason || (task.approvalRequired ? "Approval required" : "Continue engagement work")}</TableCell><TableCell className="text-right">{action ? <form action={updateEngagementTaskAction}><input name="workflowId" type="hidden" value={workflow.id} /><input name="taskKey" type="hidden" value={task.key} /><input name="status" type="hidden" value={action.status} /><input name="returnPath" type="hidden" value={returnPath} /><SubmitButton pendingText="Updating..." size="sm" variant="secondary">{action.label}<ArrowRight className="h-4 w-4" /></SubmitButton></form> : <Badge tone="green"><CheckCircle2 className="mr-1 h-3 w-3" />Done</Badge>}</TableCell></TableRow>;
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader><CardTitle>Technical review</CardTitle><CardDescription>Approve a draft for client release or return it for changes.</CardDescription></CardHeader>
          <CardContent>
            <form action={reviewEngagementDocumentAction} className="grid gap-4">
              <input name="workflowId" type="hidden" value={workflow.id} /><input name="returnPath" type="hidden" value={returnPath} />
              <div className="grid gap-2"><Label htmlFor={`review-document-${portal}`}>Document</Label><Select disabled={!pendingReview.length} id={`review-document-${portal}`} name="documentId" required><option value="">{pendingReview.length ? "Choose a document" : "No documents awaiting review"}</option>{pendingReview.map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}</Select></div>
              <div className="grid gap-2"><Label htmlFor={`review-decision-${portal}`}>Decision</Label><Select disabled={!pendingReview.length} id={`review-decision-${portal}`} name="decision" required><option value="approved">Approve and release draft</option><option value="changes_requested">Request technical changes</option></Select></div>
              <div className="grid gap-2"><Label htmlFor={`review-comments-${portal}`}>Review comments</Label><Textarea className="min-h-28" disabled={!pendingReview.length} id={`review-comments-${portal}`} name="comments" placeholder="Record the checks completed, findings, and any required changes." required /></div>
              <SubmitButton disabled={!pendingReview.length} pendingText="Recording review..."><ShieldCheck className="h-4 w-4" />Complete technical review</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader><CardTitle>Upload engagement document</CardTitle><CardDescription>Drafts wait for technical approval. Final deliverables are released to the client immediately.</CardDescription></CardHeader>
          <CardContent>
            <form action={uploadEngagementDocumentAction} className="grid gap-4" encType="multipart/form-data">
              <input name="workflowId" type="hidden" value={workflow.id} /><input name="returnPath" type="hidden" value={returnPath} />
              <div className="grid gap-2"><Label htmlFor={`document-title-${portal}`}>Document title</Label><Input id={`document-title-${portal}`} maxLength={180} name="title" placeholder="Tax assessment review - draft" required /></div>
              <div className="grid gap-2"><Label htmlFor={`document-kind-${portal}`}>Document type</Label><Select id={`document-kind-${portal}`} name="documentKind" required><option value="draft_deliverable">Draft deliverable</option><option value="final_deliverable">Final deliverable</option><option value="technical_evidence">Internal technical evidence</option></Select></div>
              <div className="grid gap-2"><Label htmlFor={`engagement-document-${portal}`}>File</Label><input accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png" className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:font-semibold file:text-brand-deep" id={`engagement-document-${portal}`} name="document" required type="file" /><p className="text-xs text-muted-foreground">PDF, Word, Excel, CSV, JPG, or PNG. Maximum 20 MB.</p></div>
              <SubmitButton pendingText="Uploading document..."><FileUp className="h-4 w-4" />Upload document</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader><CardTitle>Document exchange</CardTitle><CardDescription>Files received from the client and controlled deliverables prepared by the team.</CardDescription></CardHeader>
        <CardContent className="grid gap-0 p-0">
          {documents.length ? documents.map((document) => <div className="flex flex-col justify-between gap-3 border-t border-border px-5 py-4 first:border-t-0 sm:flex-row sm:items-center" key={document.id}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{document.name}</p><Badge tone={statusTone(document.status)}>{document.status.replaceAll("_", " ")}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{document.documentKind.replaceAll("_", " ")} / {sizeLabel(document.size)} / {dateLabel(document.uploadedAt)}</p></div><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`${downloadBase}/${document.id}`}><Download className="h-4 w-4" />Download</Link></div>) : <div className="grid justify-items-center gap-2 px-5 py-12 text-center"><FileCheck2 className="h-8 w-8 text-muted-foreground" /><p className="font-semibold text-foreground">No engagement files yet</p><p className="text-sm text-muted-foreground">Client uploads and team deliverables will appear here.</p></div>}
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-md border border-border bg-muted/20 p-4 text-sm text-muted-foreground"><MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Client-facing releases create an in-app alert and email. Sensitive files remain available only through authenticated portal downloads.</p></div>
    </section>
  );
}
