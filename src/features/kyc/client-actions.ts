"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server";
import { CLIENT_KYC_QUESTIONS } from "@/features/kyc/client-questionnaire";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import {
  CLIENT_KYC_DOCUMENT_LABELS,
  addClientKycDocuments,
  getClientKycSubmission,
  hasClientKycDocument,
  saveClientKycAnswers,
  submitClientKycForReview,
  type ClientKycDocumentType,
} from "@/repositories/client-kyc-repository";
import { getClientKycAccess, notifyKycSubmitted } from "@/repositories/request-onboarding-repository";

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const allowedDocumentTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

async function requireClientKycUser() {
  const principal = await getCurrentUser();

  if (!principal) {
    redirect("/sign-in");
  }

  if (!principal.roleKeys.includes("client") && !principal.roleKeys.includes("client_representative")) {
    redirect("/client");
  }

  if (!(await getClientKycAccess(principal.id))) {
    redirect("/client/kyc?error=locked");
  }

  return principal;
}

export async function saveClientKycQuestionnaireAction(formData: FormData) {
  const principal = await requireClientKycUser();
  const answers = Object.fromEntries(
    CLIENT_KYC_QUESTIONS.map((question) => [question.id, String(formData.get(question.id) ?? "").trim()]),
  );

  await saveClientKycAnswers(principal.id, answers);
  redirect("/client/kyc/questionnaire?saved=1");
}

export async function uploadClientKycReplacementAction(formData: FormData) {
  const principal = await requireClientKycUser();
  const submission = await getClientKycSubmission(principal.id);
  const inputs: Array<{ field: string; type: ClientKycDocumentType; required: boolean }> = [
    { field: "identityDocument", type: "identity_card", required: true },
    { field: "taxPinDocument", type: "tax_pin", required: true },
    { field: "locationDocument", type: "proof_of_location", required: false },
  ];
  const uploads = inputs.flatMap((input) => {
    const value = formData.get(input.field);
    return value instanceof File && value.size > 0 ? [{ ...input, file: value }] : [];
  });

  for (const input of inputs.filter((item) => item.required)) {
    const included = uploads.some((upload) => upload.type === input.type);
    if (!included && !hasClientKycDocument(submission, input.type)) {
      redirect(`/client/kyc/upload-replacement?error=${input.type === "identity_card" ? "identity-required" : "tax-required"}`);
    }
  }
  if (uploads.length === 0) redirect("/client/kyc/upload-replacement?error=missing-file");
  if (uploads.some((upload) => upload.file.size > MAX_DOCUMENT_SIZE)) {
    redirect("/client/kyc/upload-replacement?error=file-too-large");
  }
  if (uploads.some((upload) => !allowedDocumentTypes.has(upload.file.type))) {
    redirect("/client/kyc/upload-replacement?error=unsupported-file");
  }

  try {
    const configuration = getR2Configuration();
    const storedDocuments = await Promise.all(uploads.map(async ({ file, type }) => {
      const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || `${type}-document`;
      const key = `kyc/${principal.id}/${type}/${randomUUID()}-${filename}`;
      await getR2Client().send(new PutObjectCommand({
        Bucket: configuration.bucketName,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
        ContentDisposition: `attachment; filename="${filename}"`,
        Metadata: { documentType: type, documentLabel: CLIENT_KYC_DOCUMENT_LABELS[type] },
      }));
      return { r2Key: key, filename, contentType: file.type, size: file.size, documentType: type };
    }));
    await addClientKycDocuments(principal.id, storedDocuments);
  } catch (error) {
    console.error("Unable to upload the client KYC documents.", error);
    redirect("/client/kyc/upload-replacement?error=upload-failed");
  }

  redirect("/client/kyc?uploaded=1");
}

export async function submitClientKycForReviewAction() {
  const principal = await requireClientKycUser();
  const result = await submitClientKycForReview(principal.id);

  if (!result.submitted) {
    redirect(`/client/kyc?error=${result.reason === "missing-required-documents" ? "required-documents" : "complete-questionnaire"}`);
  }

  if (result.reason === "submitted") {
    await notifyKycSubmitted(principal.id, principal);
  }

  redirect(`/client/kyc?submitted=1${result.documentsMissing ? "&documents=missing" : ""}`);
}
