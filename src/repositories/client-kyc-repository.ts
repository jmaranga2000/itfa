import { Types } from "mongoose";
import { getQuestionnaireProgress } from "@/features/kyc/client-questionnaire";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientKycSubmissionModel } from "@/models/client-kyc-submission";

export const CLIENT_KYC_DOCUMENT_TYPES = [
  "identity_card",
  "tax_pin",
  "proof_of_location",
] as const;

export type ClientKycDocumentType = (typeof CLIENT_KYC_DOCUMENT_TYPES)[number];

export const CLIENT_KYC_DOCUMENT_LABELS: Record<ClientKycDocumentType, string> = {
  identity_card: "Identity card",
  tax_pin: "Tax PIN certificate",
  proof_of_location: "Proof of location",
};

export type ClientKycDocument = {
  id: string;
  r2Key: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  documentType: ClientKycDocumentType;
  version: number;
  reviewStatus: "submitted" | "approved" | "replacement_requested" | "rejected";
};

export type ClientKycSubmission = {
  answers: Record<string, string>;
  questionnaire: {
    answered: number;
    total: number;
    complete: boolean;
  };
  documents: ClientKycDocument[];
  status: "draft" | "submitted" | "under_review" | "changes_requested" | "approved";
  submittedAt: string | null;
};

type StoredSubmission = {
  answers?: unknown;
  questionnaireComplete?: boolean;
  documents?: Array<{
    _id?: unknown;
    r2Key?: string;
    filename?: string;
    contentType?: string;
    size?: number;
    uploadedAt?: Date;
    documentType?: string;
    version?: number;
    reviewStatus?: ClientKycDocument["reviewStatus"];
  }>;
  status?: ClientKycSubmission["status"];
  submittedAt?: Date | null;
};

function asObjectId(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid client KYC user.");
  }

  return new Types.ObjectId(userId);
}

function asAnswers(value: unknown): Record<string, string> {
  if (value instanceof Map) {
    return Object.fromEntries(value.entries()) as Record<string, string>;
  }

  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

export function resolveClientKycDocumentType(
  document: Pick<ClientKycDocument, "documentType" | "filename"> | { documentType?: string; filename?: string },
): ClientKycDocumentType {
  const value = `${document.documentType ?? ""} ${document.filename ?? ""}`.toLowerCase();
  if (value.includes("tax") || value.includes("kra") || value.includes("pin")) return "tax_pin";
  if (value.includes("location") || value.includes("address") || value.includes("utility")) return "proof_of_location";
  return "identity_card";
}

export function hasClientKycDocument(
  submission: Pick<ClientKycSubmission, "documents">,
  documentType: ClientKycDocumentType,
) {
  return submission.documents.some((document) => resolveClientKycDocumentType(document) === documentType);
}

export function hasRequiredClientKycDocuments(submission: Pick<ClientKycSubmission, "documents">) {
  return hasClientKycDocument(submission, "identity_card")
    && hasClientKycDocument(submission, "tax_pin");
}

function emptySubmission(): ClientKycSubmission {
  const answers = {};
  const questionnaire = getQuestionnaireProgress(answers);

  return {
    answers,
    questionnaire,
    documents: [],
    status: "draft",
    submittedAt: null,
  };
}

function toSubmission(record: StoredSubmission | null): ClientKycSubmission {
  if (!record) {
    return emptySubmission();
  }

  const answers = asAnswers(record.answers);
  const questionnaire = getQuestionnaireProgress(answers);

  return {
    answers,
    questionnaire: {
      ...questionnaire,
      complete: record.questionnaireComplete ?? questionnaire.complete,
    },
    documents: (record.documents ?? []).map((document) => ({
      id: String(document._id ?? ""),
      r2Key: document.r2Key ?? "",
      filename: document.filename ?? "Uploaded document",
      contentType: document.contentType ?? "application/octet-stream",
      size: document.size ?? 0,
      uploadedAt: document.uploadedAt?.toISOString() ?? new Date(0).toISOString(),
      documentType: resolveClientKycDocumentType(document),
      version: document.version ?? 1,
      reviewStatus: document.reviewStatus ?? "submitted",
    })),
    status: record.status ?? "draft",
    submittedAt: record.submittedAt?.toISOString() ?? null,
  };
}

async function ensureSubmission(userId: string) {
  await connectToDatabase();

  await ClientKycSubmissionModel.findOneAndUpdate(
    { userId: asObjectId(userId) },
    {
      $setOnInsert: {
        userId: asObjectId(userId),
        questionnaireVersion: "individual-v1",
        answers: {},
        questionnaireComplete: false,
        documents: [],
        status: "draft",
        submittedAt: null,
      },
    },
    { new: true, upsert: true },
  ).exec();
}

export async function getClientKycSubmission(userId: string) {
  await connectToDatabase();

  const record = (await ClientKycSubmissionModel.findOne({ userId: asObjectId(userId) })
    .lean()
    .exec()) as StoredSubmission | null;

  return toSubmission(record);
}

export async function saveClientKycAnswers(userId: string, answers: Record<string, string>) {
  await ensureSubmission(userId);

  const current = await getClientKycSubmission(userId);
  const mergedAnswers = { ...current.answers, ...answers };
  const questionnaire = getQuestionnaireProgress(mergedAnswers);

  await ClientKycSubmissionModel.updateOne(
    { userId: asObjectId(userId) },
    {
      $set: {
        answers: mergedAnswers,
        questionnaireComplete: questionnaire.complete,
      },
    },
  ).exec();

  return getClientKycSubmission(userId);
}

export async function addClientKycDocuments(
  userId: string,
  documents: Array<Pick<ClientKycDocument, "r2Key" | "filename" | "contentType" | "size" | "documentType">>,
) {
  await ensureSubmission(userId);

  const current = await getClientKycSubmission(userId);
  const nextDocuments = documents.map((document) => ({
    r2Key: document.r2Key,
    filename: document.filename,
    contentType: document.contentType,
    size: document.size,
    documentType: document.documentType,
    version: current.documents.filter(
      (item) => resolveClientKycDocumentType(item) === document.documentType,
    ).length + 1,
    uploadedAt: new Date(),
    reviewStatus: "submitted" as const,
    rejectionReason: "",
  }));

  await ClientKycSubmissionModel.updateOne(
    { userId: asObjectId(userId) },
    {
      $push: {
        documents: { $each: nextDocuments },
      },
    },
  ).exec();

  return getClientKycSubmission(userId);
}

export async function submitClientKycForReview(userId: string) {
  const submission = await getClientKycSubmission(userId);

  if (!submission.questionnaire.complete) {
    return { submitted: false, reason: "incomplete" as const };
  }

  if (!hasRequiredClientKycDocuments(submission)) {
    return { submitted: false, reason: "missing-required-documents" as const };
  }

  if (["submitted", "under_review", "approved"].includes(submission.status)) {
    return {
      submitted: true,
      reason: "already-submitted" as const,
      documentsMissing: !hasClientKycDocument(submission, "proof_of_location"),
    };
  }

  await ClientKycSubmissionModel.updateOne(
    { userId: asObjectId(userId) },
    { $set: { status: "submitted", submittedAt: new Date() } },
  ).exec();

  return {
    submitted: true,
    reason: "submitted" as const,
    documentsMissing: !hasClientKycDocument(submission, "proof_of_location"),
  };
}
