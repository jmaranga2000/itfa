import Link from "next/link";
import { CheckCircle2, Download, Eye, FilePlus2, FileSignature, FolderOpen, MessageSquareReply, RotateCcw, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { reviewClientDeliverableAction, uploadSignedEngagementLetterAction } from "@/features/client/document-actions";
import type { ClientDocumentRecord } from "@/repositories/client-portal-repository";
import type { EngagementLetterRecord } from "@/repositories/engagement-letter-repository";

function statusTone(status: string) {
  if (["approved", "final"].includes(status)) return "green" as const;
  if (status === "replacement_requested") return "gold" as const;
  return "teal" as const;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(value));
}

const signedUploadErrors: Record<string, string> = {
  "signed-missing": "Choose a signed copy and confirm that all required parties have signed it.",
  "signed-size": "The signed copy must be 10 MB or smaller.",
  "signed-type": "Upload the signed copy as a PDF, JPG or PNG file.",
  "signed-letter": "This engagement letter is not available for signed-copy upload.",
  "signed-upload": "The signed copy could not be stored. Please try again.",
};

export function ClientDocuments({ documents, letters, notice, error }: {
  documents: ClientDocumentRecord[];
  letters: EngagementLetterRecord[];
  notice?: string;
  error?: string;
}) {
  const shared = documents.filter((document) => document.direction === "received").length;
  const feedback = documents.filter((document) => document.status === "replacement_requested").length;
  const clientReviewDocuments = documents.filter((document) => document.reviewRequired && document.workflowId);

  return (
    <div className="grid min-w-0 gap-5">
      {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p> : null}
      {error && signedUploadErrors[error] ? <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{signedUploadErrors[error]}</p> : null}
      <section className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-center">
        <div>
          <Badge tone="teal">Engagement files</Badge>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Documents</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Upload evidence, download files shared by IFTA and respond to review feedback.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={buttonClassName({ variant: "secondary" })} href="/client/documents/shared"><FolderOpen className="h-4 w-4" />Shared files ({shared})</Link>
          <Link className={buttonClassName({ variant: "secondary" })} href="/client/documents/feedback"><MessageSquareReply className="h-4 w-4" />Feedback ({feedback})</Link>
          <Link className={buttonClassName()} href="/client/documents/upload"><FilePlus2 className="h-4 w-4" />Upload document</Link>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-deep"><FileSignature className="h-5 w-5" /></span>
            <div><CardTitle>Engagement letters</CardTitle><CardDescription>Review, download and return the signed agreement before work begins.</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {letters.length === 0 ? (
            <EmptyState title="No engagement letter yet" description="Your letter will appear after IFTA approves your KYC." />
          ) : letters.map((letter) => {
            const clientSigner = letter.signers.find((signer) => signer.role === "client");
            const needsSignedCopy = clientSigner?.status === "pending" && letter.status !== "completed";
            return (
              <div className="border-t border-border py-4 first:border-t-0 first:pt-0" key={letter.id}>
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{letter.subject}</p><Badge tone={letter.status === "completed" ? "green" : "gold"}>{letter.status === "completed" ? "Signed" : "Signature required"}</Badge></div>
                    <p className="mt-1 text-sm text-muted-foreground">{letter.reference} | Issued {dateLabel(letter.generatedAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/client/engagement-letters/${letter.id}`}><Eye className="h-4 w-4" />View</Link>
                    <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/client/engagement-letters/${letter.id}`}><Download className="h-4 w-4" />Download</Link>
                  </div>
                </div>
                {needsSignedCopy ? (
                  <form action={uploadSignedEngagementLetterAction} className="mt-4 grid gap-3 rounded-md border border-border bg-muted/20 p-4" encType="multipart/form-data">
                    <input name="letterId" type="hidden" value={letter.id} />
                    <div><p className="text-sm font-semibold text-foreground">Upload the fully signed copy</p><p className="mt-1 text-xs leading-5 text-muted-foreground">PDF, JPG or PNG, up to 10 MB. You can also sign electronically from View.</p></div>
                    <input accept="application/pdf,image/jpeg,image/png" className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:font-semibold file:text-brand-deep" name="signedCopy" required type="file" />
                    <label className="flex items-start gap-3 text-sm leading-6 text-foreground"><input className="mt-1 h-4 w-4 shrink-0 accent-primary" name="signedConfirmation" required type="checkbox" /><span>I confirm this copy has been signed by all required parties and is ready to activate the engagement.</span></label>
                    <div className="flex justify-end"><SubmitButton pendingText="Uploading signed copy..."><Upload className="h-4 w-4" />Upload signed letter</SubmitButton></div>
                  </form>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {clientReviewDocuments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Drafts waiting for your review</CardTitle>
            <CardDescription>Read each draft, then approve it or clearly describe the changes you need.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {clientReviewDocuments.map((document) => (
              <form action={reviewClientDeliverableAction} className="grid min-w-0 gap-4 p-5" key={document.id}>
                <input name="workflowId" type="hidden" value={document.workflowId ?? ""} />
                <input name="documentId" type="hidden" value={document.id} />
                <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0"><p className="break-words font-semibold text-foreground">{document.name}</p><p className="mt-1 text-sm text-muted-foreground">{document.engagementReference}</p></div>
                  {document.downloadHref ? <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={document.downloadHref}><Download className="h-4 w-4" />Open draft</Link> : null}
                </div>
                <div className="grid gap-2"><label className="text-sm font-semibold text-foreground" htmlFor={`client-review-${document.id}`}>Your review comments</label><Textarea id={`client-review-${document.id}`} name="feedback" placeholder="Confirm that the draft meets your needs, or explain the exact changes required." required /></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <SubmitButton name="decision" pendingText="Sending review..." value="changes_requested" variant="secondary"><RotateCcw className="h-4 w-4" />Request changes</SubmitButton>
                  <SubmitButton name="decision" pendingText="Sending approval..." value="approved"><CheckCircle2 className="h-4 w-4" />Approve draft</SubmitButton>
                </div>
              </form>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>All documents</CardTitle>
          <CardDescription>{documents.length} file{documents.length === 1 ? "" : "s"} across your engagements.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {documents.length === 0 ? (
            <EmptyState title="No documents yet" description="Files you upload or receive from IFTA will appear here." />
          ) : documents.map((document) => (
            <div className="flex flex-col justify-between gap-3 border-t border-border py-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-center" key={document.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{document.name}</p><Badge tone={statusTone(document.status)}>{document.status.replaceAll("_", " ")}</Badge></div>
                <p className="mt-1 text-sm text-muted-foreground">{document.engagementReference} | {document.direction === "sent" ? "Uploaded by you" : "Shared by IFTA"} | {dateLabel(document.uploadedAt)}</p>
              </div>
              {document.downloadHref ? <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={document.downloadHref}><Download className="h-4 w-4" />Download</Link> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
