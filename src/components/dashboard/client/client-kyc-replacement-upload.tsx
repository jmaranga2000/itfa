import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, FileCheck2, FileUp, MapPin, ShieldCheck, UploadCloud } from "lucide-react";
import { uploadClientKycReplacementAction } from "@/features/kyc/client-actions";
import {
  CLIENT_KYC_DOCUMENT_LABELS,
  hasClientKycDocument,
  resolveClientKycDocumentType,
  type ClientKycDocumentType,
  type ClientKycSubmission,
} from "@/repositories/client-kyc-repository";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const errorMessages: Record<string, string> = {
  "missing-file": "Choose at least one new document before uploading.",
  "identity-required": "Upload a valid identity card or passport before continuing.",
  "tax-required": "Upload your KRA Tax PIN certificate before continuing.",
  "file-too-large": "One of the files is larger than the 10 MB limit.",
  "unsupported-file": "Use PDF, JPG, or PNG documents only.",
  "upload-failed": "The documents could not be saved. Confirm the R2 settings and try again.",
};

const uploadFields: Array<{
  type: ClientKycDocumentType;
  field: string;
  description: string;
  required: boolean;
  icon: typeof ShieldCheck;
}> = [
  {
    type: "identity_card",
    field: "identityDocument",
    description: "National identity card or passport. Upload a clear copy showing all details.",
    required: true,
    icon: ShieldCheck,
  },
  {
    type: "tax_pin",
    field: "taxPinDocument",
    description: "Your KRA PIN certificate with the PIN and registered name visible.",
    required: true,
    icon: FileCheck2,
  },
  {
    type: "proof_of_location",
    field: "locationDocument",
    description: "Utility bill, tenancy document, or other recent proof of your address.",
    required: false,
    icon: MapPin,
  },
];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClientKycReplacementUpload({ error, submission }: {
  error?: string;
  submission: ClientKycSubmission;
}) {
  const latestDocuments = uploadFields.flatMap((field) => {
    const matches = submission.documents
      .filter((document) => resolveClientKycDocumentType(document) === field.type)
      .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
    return matches[0] ? [{ field, document: matches[0] }] : [];
  });

  return (
    <div className="grid min-w-0 gap-5">
      <section className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Client verification</p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">KYC documents</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Add the documents used to verify your identity, tax registration, and location. Files are stored in the protected document vault.
          </p>
        </div>
        <Link className={buttonClassName({ variant: "secondary" })} href="/client/kyc">Back to KYC</Link>
      </section>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {errorMessages[error] ?? "The documents could not be uploaded."}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Upload verification documents</CardTitle>
          <CardDescription>PDF, JPG, or PNG. Maximum 10 MB per file.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={uploadClientKycReplacementAction} className="grid gap-0" encType="multipart/form-data">
            {uploadFields.map((field) => {
              const uploaded = hasClientKycDocument(submission, field.type);
              const Icon = field.icon;
              return (
                <div className="grid gap-4 border-t border-border py-5 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] md:items-center" key={field.type}>
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-deep">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Label className="font-bold" htmlFor={field.field}>{CLIENT_KYC_DOCUMENT_LABELS[field.type]}</Label>
                        <Badge tone={field.required ? "red" : "slate"}>{field.required ? "Required" : "Optional"}</Badge>
                        {uploaded ? <Badge tone="green">Received</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{field.description}</p>
                    </div>
                  </div>
                  <Input
                    accept="application/pdf,image/jpeg,image/png"
                    id={field.field}
                    name={field.field}
                    required={field.required && !uploaded}
                    type="file"
                  />
                </div>
              );
            })}
            <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
              <Link className={buttonClassName({ variant: "secondary" })} href="/client/kyc/questionnaire">Continue questionnaire</Link>
              <SubmitButton pendingText="Uploading documents...">
                <UploadCloud aria-hidden="true" className="h-4 w-4" />
                Upload documents
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents received</CardTitle>
          <CardDescription>The latest version received for each KYC requirement.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {latestDocuments.length ? latestDocuments.map(({ field, document }) => (
            <div className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center" key={field.type}>
              <div className="flex min-w-0 items-center gap-3">
                <FileUp aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{document.filename}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {CLIENT_KYC_DOCUMENT_LABELS[field.type]} | Version {document.version} | {format(new Date(document.uploadedAt), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatFileSize(document.size)}</span>
                <Badge tone={document.reviewStatus === "approved" ? "green" : "gold"}>
                  {document.reviewStatus === "approved" ? "Approved" : "Awaiting review"}
                </Badge>
              </div>
            </div>
          )) : (
            <div className="p-6 text-center">
              <CheckCircle2 aria-hidden="true" className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No KYC documents have been received yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
