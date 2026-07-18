import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock3, FileUp, MapPin, Send, ShieldCheck } from "lucide-react";
import { submitClientKycForReviewAction } from "@/features/kyc/client-actions";
import {
  CLIENT_KYC_DOCUMENT_LABELS,
  hasClientKycDocument,
  hasRequiredClientKycDocuments,
  type ClientKycSubmission,
} from "@/repositories/client-kyc-repository";
import type { ClientKycAccess } from "@/repositories/request-onboarding-repository";
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
  access,
  submission,
  submitted,
  uploaded,
}: {
  error?: string;
  access: ClientKycAccess | null;
  submission: ClientKycSubmission;
  submitted: boolean;
  uploaded: boolean;
}) {
  if (!access) {
    return (
      <div className="grid min-w-0 gap-5">
        <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
          <p className="text-sm font-semibold text-primary">Client verification</p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">KYC is not open yet</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            KYC becomes available after IFTA approves your engagement request and assigns the responsible staff member.
          </p>
        </section>
        <Card>
          <CardContent className="flex items-start gap-4 p-5">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
            <div><h2 className="font-bold text-foreground">Waiting for administration setup</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">You will receive an email and a live portal alert when KYC is ready. No questionnaire or upload can be submitted before then.</p><Link className={buttonClassName({ className: "mt-4", variant: "secondary" })} href="/client/engagements">View my requests</Link></div>
          </CardContent>
        </Card>
      </div>
    );
  }
  const requiredDocumentsReady = hasRequiredClientKycDocuments(submission);
  const proofOfLocationReady = hasClientKycDocument(submission, "proof_of_location");
  const documentTypesReceived = [
    hasClientKycDocument(submission, "identity_card"),
    hasClientKycDocument(submission, "tax_pin"),
    proofOfLocationReady,
  ].filter(Boolean).length;
  const readyForReview = submission.questionnaire.complete && requiredDocumentsReady;
  const reviewSubmitted = ["submitted", "under_review", "approved"].includes(submission.status);
  const documentsMissing = !requiredDocumentsReady;

  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Client verification</p>
            <h1 className="mt-2 text-2xl font-bold text-foreground">Complete your KYC</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Complete the questionnaire, upload your identity and Tax PIN documents, then submit everything for review.
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
          Your KYC documents have been uploaded.
        </div>
      ) : null}

      {submitted ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Your KYC has been submitted for review.
        </div>
      ) : null}

      {submission.status === "submitted" || submission.status === "under_review" ? (
        <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
          <Clock3 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="text-sm font-semibold">KYC approval pending</p><p className="mt-1 text-sm leading-6">Your information has been submitted. The assigned reviewer or administrator will notify you after approval.</p></div>
        </div>
      ) : null}

      {submission.status === "approved" ? (
        <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950" role="status">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="text-sm font-semibold">KYC approved</p><p className="mt-1 text-sm leading-6">Your verification is complete. You can now review your engagement letter in Documents.</p></div>
        </div>
      ) : null}

      {error === "complete-questionnaire" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          Complete every required questionnaire answer before submitting for review.
        </div>
      ) : null}

      {error === "required-documents" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          Upload both your identity card and Tax PIN certificate before submitting for review.
        </div>
      ) : null}

      {documentsMissing ? (
        <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950" role="status">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Supporting documents are still needed</p>
            <p className="mt-1 text-sm leading-6">Your identity card and Tax PIN certificate are required before submission. Proof of location is optional but recommended.</p>
            <Link className="mt-2 inline-flex text-sm font-semibold underline underline-offset-4" href="/client/kyc/upload-replacement">
              Upload a document
            </Link>
          </div>
        </div>
      ) : null}

      {!documentsMissing && !proofOfLocationReady ? (
        <div className="flex items-start gap-3 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sky-950" role="status">
          <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="text-sm font-semibold">Proof of location is still recommended</p><p className="mt-1 text-sm leading-6">Your required files are complete. Add a recent utility bill, lease, or similar address document when available.</p></div>
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
            <CardDescription>KYC documents</CardDescription>
            <CardTitle className="text-2xl font-bold">{documentTypesReceived}/3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {requiredDocumentsReady
                ? proofOfLocationReady
                  ? "All three document types have been received."
                  : "Required documents received. Proof of location is still recommended."
                : "Identity and Tax PIN documents are required."}
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
              {submission.status === "approved"
                ? "Your KYC has been approved."
                : reviewSubmitted
                ? documentsMissing
                  ? "Submitted. Supporting documents are still outstanding."
                  : "Your KYC is with the review team."
                : readyForReview
                  ? "Your questionnaire is ready to submit."
                  : "Complete the questionnaire to submit for review."}
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
                <p className="text-sm font-semibold text-foreground">2. Upload your KYC documents</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Provide your identity card, Tax PIN certificate, and proof of location where available.</p>
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
              Upload KYC documents
            </Link>
            <form action={submitClientKycForReviewAction}>
              <SubmitButton
                className="w-full"
                disabled={!readyForReview || reviewSubmitted}
                pendingText="Submitting for review..."
                title={!readyForReview ? "Complete the questionnaire and upload the required documents first." : undefined}
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
                  <p className="mt-1 text-sm text-muted-foreground">{CLIENT_KYC_DOCUMENT_LABELS[document.documentType]} | Version {document.version}</p>
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
