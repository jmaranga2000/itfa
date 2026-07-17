import { Types } from "mongoose";
import { getQuestionnaireProgress } from "@/features/kyc/client-questionnaire";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientKycSubmissionModel } from "@/models/client-kyc-submission";

export type ClientKycDocument = {
  id: string;
  r2Key: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
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

export async function addClientKycDocument(
  userId: string,
  document: Omit<ClientKycDocument, "id" | "uploadedAt">,
) {
  await ensureSubmission(userId);

  await ClientKycSubmissionModel.updateOne(
    { userId: asObjectId(userId) },
    {
      $push: {
        documents: {
          r2Key: document.r2Key,
          filename: document.filename,
          contentType: document.contentType,
          size: document.size,
          uploadedAt: new Date(),
        },
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

  if (["submitted", "under_review", "approved"].includes(submission.status)) {
    return {
      submitted: true,
      reason: "already-submitted" as const,
      documentsMissing: submission.documents.length === 0,
    };
  }

  await ClientKycSubmissionModel.updateOne(
    { userId: asObjectId(userId) },
    { $set: { status: "submitted", submittedAt: new Date() } },
  ).exec();

  return {
    submitted: true,
    reason: "submitted" as const,
    documentsMissing: submission.documents.length === 0,
  };
}
