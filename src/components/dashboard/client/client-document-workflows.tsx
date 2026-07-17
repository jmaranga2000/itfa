import Link from "next/link";
import { ArrowLeft, Download, FileUp, MessageSquareReply } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  respondToDocumentFeedbackAction,
  uploadClientDocumentAction,
} from "@/features/client/document-actions";
import type { ClientDocumentRecord } from "@/repositories/client-portal-repository";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

function BackToDocuments() {
  return <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/client/documents"><ArrowLeft className="h-4 w-4" />Documents</Link>;
}

export function ClientDocumentUpload({ workflows, error }: { workflows: WorkflowInstanceRecord[]; error?: string }) {
  const errorMessage = error === "size" ? "The file must be 10 MB or smaller." : error === "type" ? "Use a PDF, image or Word document." : error ? "Choose an engagement and a valid file, then try again." : null;
  return (
    <div className="grid max-w-3xl gap-5">
      <div><BackToDocuments /></div>
      <Card>
        <CardHeader><CardTitle>Upload a document</CardTitle><CardDescription>Send a file securely to the team working on the selected engagement.</CardDescription></CardHeader>
        <CardContent>
          {errorMessage ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{errorMessage}</p> : null}
          {workflows.length === 0 ? <EmptyState title="No active engagement" description="A document can be uploaded once the administration team creates your engagement." action={<Link className={buttonClassName()} href="/client/services">Browse services</Link>} /> : (
            <form action={uploadClientDocumentAction} className="grid gap-5" encType="multipart/form-data">
              <div className="grid gap-2"><Label htmlFor="workflowId">Engagement</Label><Select id="workflowId" name="workflowId" required><option value="">Select an engagement</option>{workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.reference} - {workflow.serviceName}</option>)}</Select></div>
              <div className="grid gap-2"><Label htmlFor="document">File</Label><input className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground" id="document" name="document" required type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" /><p className="text-xs text-muted-foreground">PDF, JPG, PNG or Word. Maximum 10 MB.</p></div>
              <SubmitButton className="w-fit" pendingText="Uploading..."><FileUp className="h-4 w-4" />Upload document</SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ClientSharedDocuments({ documents }: { documents: ClientDocumentRecord[] }) {
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-foreground">Files shared with you</h1><p className="mt-1 text-sm text-muted-foreground">Documents sent by your IFTA team.</p></div><BackToDocuments /></div>
      <Card><CardContent className="grid gap-2 p-5">{documents.length === 0 ? <EmptyState title="No shared files" description="Files sent by your consulting team will appear here." /> : documents.map((document) => <div className="flex flex-col justify-between gap-3 border-t border-border py-4 first:border-0 first:pt-0 sm:flex-row sm:items-center" key={document.id}><div><p className="font-semibold text-foreground">{document.name}</p><p className="mt-1 text-sm text-muted-foreground">{document.engagementReference}</p></div><div className="flex items-center gap-2"><Badge tone="teal">{document.status.replaceAll("_", " ")}</Badge>{document.downloadHref ? <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={document.downloadHref}><Download className="h-4 w-4" />Download</Link> : null}</div></div>)}</CardContent></Card>
    </div>
  );
}

export function ClientDocumentFeedback({ documents, notice }: { documents: ClientDocumentRecord[]; notice?: string }) {
  return (
    <div className="grid gap-5">
      {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-foreground">Document feedback</h1><p className="mt-1 text-sm text-muted-foreground">Reply to file review notes from your consulting team.</p></div><BackToDocuments /></div>
      {documents.length === 0 ? <EmptyState title="No feedback to answer" description="Any requested corrections or replacement notes will appear here." /> : documents.map((document) => <Card key={document.id}><CardHeader><div className="flex flex-wrap items-center gap-2"><CardTitle>{document.name}</CardTitle><Badge tone="gold">Replacement requested</Badge></div><CardDescription>{document.engagementReference}</CardDescription></CardHeader><CardContent className="grid gap-4"><div className="rounded-md border border-border bg-muted/30 p-3"><p className="text-xs font-bold uppercase text-muted-foreground">Reviewer feedback</p><p className="mt-2 text-sm leading-6 text-foreground">{document.feedback || "Please provide a corrected version or explain the update."}</p></div><form action={respondToDocumentFeedbackAction} className="grid gap-3"><input name="documentId" type="hidden" value={document.id} /><div className="grid gap-2"><Label htmlFor={`response-${document.id}`}>Your response</Label><Textarea id={`response-${document.id}`} name="response" placeholder="Explain the correction or when the replacement will be uploaded." required /></div><div className="flex flex-wrap gap-2"><SubmitButton pendingText="Sending response..."><MessageSquareReply className="h-4 w-4" />Send response</SubmitButton><Link className={buttonClassName({ variant: "secondary" })} href="/client/documents/upload">Upload replacement</Link></div></form></CardContent></Card>)}
    </div>
  );
}
