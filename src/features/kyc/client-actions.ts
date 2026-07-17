"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server";
import { CLIENT_KYC_QUESTIONS } from "@/features/kyc/client-questionnaire";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import {
  addClientKycDocument,
  saveClientKycAnswers,
  submitClientKycForReview,
} from "@/repositories/client-kyc-repository";

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
  const document = formData.get("replacementDocument");

  if (!(document instanceof File) || document.size === 0) {
    redirect("/client/kyc/upload-replacement?error=missing-file");
  }

  if (document.size > MAX_DOCUMENT_SIZE) {
    redirect("/client/kyc/upload-replacement?error=file-too-large");
  }

  if (!allowedDocumentTypes.has(document.type)) {
    redirect("/client/kyc/upload-replacement?error=unsupported-file");
  }

  const filename = document.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "replacement-document";
  const key = `kyc/${principal.id}/replacements/${randomUUID()}-${filename}`;

  try {
    const configuration = getR2Configuration();
    const content = Buffer.from(await document.arrayBuffer());

    await getR2Client().send(
      new PutObjectCommand({
        Bucket: configuration.bucketName,
        Key: key,
        Body: content,
        ContentType: document.type,
        ContentDisposition: `attachment; filename="${filename}"`,
      }),
    );

    await addClientKycDocument(principal.id, {
      r2Key: key,
      filename,
      contentType: document.type,
      size: document.size,
    });
  } catch (error) {
    console.error("Unable to upload the client KYC replacement document.", error);
    redirect("/client/kyc/upload-replacement?error=upload-failed");
  }

  redirect("/client/kyc?uploaded=1");
}

export async function submitClientKycForReviewAction() {
  const principal = await requireClientKycUser();
  const result = await submitClientKycForReview(principal.id);

  if (!result.submitted) {
    redirect("/client/kyc?error=complete-questionnaire");
  }

  redirect(`/client/kyc?submitted=1${result.documentsMissing ? "&documents=missing" : ""}`);
}
