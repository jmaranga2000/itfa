import Link from "next/link";
import { CheckCircle2, ClipboardList, FileUp, Send, ShieldCheck } from "lucide-react";
import { submitClientKycForReviewAction } from "@/features/kyc/client-actions";
import type { ClientKycSubmission } from "@/repositories/client-kyc-repository";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

const statusLabels: Record<ClientKycSubmission["status"], string> = {
  draft: "In progress",
  submitted: "Submitted for review",
  under_review: "Under review",
  changes_requested: "Changes requested",
  approved: "Approved",
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClientKyc({
  error,
  submission,
  submitted,
  uploaded,
}: {
  error?: string;
  submission: ClientKycSubmission;
  submitted: boolean;
  uploaded: boolean;
}) {
  const readyForReview = submission.questionnaire.complete && submission.documents.length > 0;
  const reviewSubmitted = submission.status === "submitted" || submission.status === "under_review";

  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Client verification</p>
            <h1 className="mt-2 text-2xl font-bold text-foreground">Complete your KYC</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Answer the questionnaire, upload a clear supporting document, then send everything to our review team.
            </p>
          </div>
          <Link className={buttonClassName({ className: "shrink-0" })} href="/client/kyc/questionnaire">
            <ClipboardList aria-hidden="true" className="h-4 w-4" />
            Continue to questionnaire
          </Link>
        </div>
      </section>

      {uploaded ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Your replacement document has been uploaded.
        </div>
      ) : null}

      {submitted ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Your KYC has been submitted for review.
        </div>
      ) : null}

      {error === "complete-questionnaire-and-upload" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          Complete every required questionnaire answer and upload a document before submitting for review.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Questionnaire</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {submission.questionnaire.answered}/{submission.questionnaire.total}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {submission.questionnaire.complete ? "All required questions are complete." : "Complete the remaining required answers."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Supporting document</CardDescription>
            <CardTitle className="text-2xl font-bold">{submission.documents.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {submission.documents.length ? "Document uploaded to the protected vault." : "Upload one PDF, JPG, or PNG document."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Review status</CardDescription>
            <CardTitle className="text-2xl font-bold">{statusLabels[submission.status]}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {readyForReview ? "Your KYC is ready to submit." : "Finish both required steps to submit for review."}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>What to do next</CardTitle>
            <CardDescription>Complete these steps in order.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex gap-3 border-l-2 border-primary pl-4">
              <ClipboardList aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">1. Answer the questionnaire</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Provide the personal, tax, and declaration details requested.</p>
              </div>
            </div>
            <div className="flex gap-3 border-l-2 border-primary pl-4">
              <FileUp aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">2. Upload a supporting document</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Upload a clear replacement PDF, JPG, or PNG file.</p>
              </div>
            </div>
            <div className="flex gap-3 border-l-2 border-primary pl-4">
              <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">3. Submit for review</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Our compliance team will review the completed KYC submission.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KYC actions</CardTitle>
            <CardDescription>Choose the next step for your submission.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link className={buttonClassName({ className: "w-full" })} href="/client/kyc/questionnaire">
              <ClipboardList aria-hidden="true" className="h-4 w-4" />
              Continue questionnaire
            </Link>
            <Link className={buttonClassName({ variant: "secondary", className: "w-full" })} href="/client/kyc/upload-replacement">
              <FileUp aria-hidden="true" className="h-4 w-4" />
              Upload replacement
            </Link>
            <form action={submitClientKycForReviewAction}>
              <SubmitButton
                className="w-full"
                disabled={!readyForReview || reviewSubmitted}
                pendingText="Submitting for review..."
                title={!readyForReview ? "Complete the questionnaire and upload a document first." : undefined}
              >
                <Send aria-hidden="true" className="h-4 w-4" />
                {reviewSubmitted ? "Submitted for review" : "Submit for review"}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded documents</CardTitle>
          <CardDescription>Your latest files are stored securely for the KYC review team.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {submission.documents.length ? (
            submission.documents.map((document) => (
              <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-3" key={document.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{document.filename}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{document.contentType}</p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{formatFileSize(document.size)}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No supporting document uploaded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
