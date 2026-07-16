import Link from "next/link";
import { FileUp, UploadCloud } from "lucide-react";
import { uploadClientKycReplacementAction } from "@/features/kyc/client-actions";
import type { ClientKycSubmission } from "@/repositories/client-kyc-repository";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const errorMessages: Record<string, string> = {
  "missing-file": "Choose a document before uploading.",
  "file-too-large": "The file is larger than the 10 MB limit.",
  "unsupported-file": "Upload a PDF, JPG, or PNG document.",
  "upload-failed": "The file could not be saved. Confirm the R2 settings and try again.",
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClientKycReplacementUpload({
  error,
  submission,
}: {
  error?: string;
  submission: ClientKycSubmission;
}) {
  return (
    <div className="grid min-w-0 gap-5">
      <section className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Client verification</p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Upload replacement document</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Upload a clear, current document for your KYC review. Files are stored in the protected document vault.
          </p>
        </div>
        <Link className={buttonClassName({ variant: "secondary" })} href="/client/kyc">
          Back to KYC
        </Link>
      </section>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">
          {errorMessages[error] ?? "The document could not be uploaded."}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Replacement document</CardTitle>
          <CardDescription>PDF, JPG, or PNG. Maximum file size: 10 MB.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={uploadClientKycReplacementAction} className="grid gap-5" encType="multipart/form-data">
            <div className="grid gap-2">
              <Label htmlFor="replacementDocument">Document file</Label>
              <Input
                accept="application/pdf,image/jpeg,image/png"
                id="replacementDocument"
                name="replacementDocument"
                required
                type="file"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Link className={buttonClassName({ variant: "secondary" })} href="/client/kyc/questionnaire">
                Continue questionnaire
              </Link>
              <SubmitButton pendingText="Uploading document...">
                <UploadCloud aria-hidden="true" className="h-4 w-4" />
                Upload replacement
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded documents</CardTitle>
          <CardDescription>Each replacement is retained as a separate KYC document version.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {submission.documents.length ? (
            submission.documents.map((document) => (
              <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-3" key={document.id}>
                <div className="flex min-w-0 items-center gap-3">
                  <FileUp aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
                  <p className="truncate text-sm font-medium text-foreground">{document.filename}</p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{formatFileSize(document.size)}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No replacement document has been uploaded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
