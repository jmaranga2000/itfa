import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientKycSubmissionModel } from "@/models/client-kyc-submission";

export type KycStoredDocument = {
  id: string;
  submissionId: string;
  clientUserId: string;
  assignedReviewerUserId: string | null;
  r2Key: string;
  filename: string;
  contentType: string;
};

export async function getKycStoredDocument(documentId: string): Promise<KycStoredDocument | null> {
  if (!Types.ObjectId.isValid(documentId)) return null;
  await connectToDatabase();
  const submission = await ClientKycSubmissionModel.findOne({ "documents._id": documentId })
    .select("userId assignedReviewerUserId documents")
    .lean()
    .exec();
  if (!submission) return null;
  const document = submission.documents.find((item) => item._id?.toString() === documentId);
  if (!document) return null;
  return {
    id: documentId,
    submissionId: submission._id.toString(),
    clientUserId: submission.userId.toString(),
    assignedReviewerUserId: submission.assignedReviewerUserId?.toString() ?? null,
    r2Key: document.r2Key,
    filename: document.filename,
    contentType: document.contentType,
  };
}
