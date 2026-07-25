import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AccountClosureRequestModel, type AccountClosureRequestDocument } from "@/models/account-closure-request";
import type { AccountClosureRequestStatus } from "@/models/account-closure-request";

type AccountClosureRequestLean = AccountClosureRequestDocument & { _id: Types.ObjectId };

export type AccountClosureRequestRecord = {
  id: string;
  requestReference: string;
  clientUserId: string;
  requestedByUserId: string | null;
  requestedByName: string;
  requestedAt: string;
  reason: string;
  status: AccountClosureRequestStatus;
  reviewNotes: string;
  reviewedByUserId: string | null;
  reviewedByName: string;
  reviewedAt: string | null;
  completedAt: string | null;
};

function serializeRequest(request: AccountClosureRequestLean): AccountClosureRequestRecord {
  return {
    id: request._id.toString(),
    requestReference: request.requestReference,
    clientUserId: request.clientUserId.toString(),
    requestedByUserId: request.requestedByUserId?.toString() ?? null,
    requestedByName: request.requestedByName,
    requestedAt: request.requestedAt.toISOString(),
    reason: request.reason,
    status: request.status,
    reviewNotes: request.reviewNotes,
    reviewedByUserId: request.reviewedByUserId?.toString() ?? null,
    reviewedByName: request.reviewedByName,
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
    completedAt: request.completedAt?.toISOString() ?? null,
  };
}

export async function createAccountClosureRequest(input: {
  requestReference: string;
  clientUserId: string;
  requestedByUserId: string | null;
  requestedByName: string;
  reason: string;
}) {
  await connectToDatabase();

  const result = await AccountClosureRequestModel.create({
    requestReference: input.requestReference,
    clientUserId: new Types.ObjectId(input.clientUserId),
    requestedByUserId: input.requestedByUserId ? new Types.ObjectId(input.requestedByUserId) : null,
    requestedByName: input.requestedByName,
    reason: input.reason,
  });

  return result;
}

export async function getAccountClosureRequestByClient(clientUserId: string) {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(clientUserId)) {
    return null;
  }

  const request = await AccountClosureRequestModel.findOne({
    clientUserId: new Types.ObjectId(clientUserId),
  })
    .sort({ requestedAt: -1 })
    .lean()
    .exec();

  return request ? serializeRequest(request as unknown as AccountClosureRequestLean) : null;
}

export async function getAccountClosureRequestById(requestId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(requestId)) {
    return null;
  }

  const request = await AccountClosureRequestModel.findById(requestId).lean().exec();
  return request ? serializeRequest(request as unknown as AccountClosureRequestLean) : null;
}

export async function listAccountClosureRequests() {
  await connectToDatabase();

  const requests = await AccountClosureRequestModel.find({})
    .sort({ requestedAt: -1 })
    .lean()
    .exec();

  return requests.map((request) => serializeRequest(request as unknown as AccountClosureRequestLean));
}

export async function updateAccountClosureRequestStatus(
  requestId: string,
  status: AccountClosureRequestStatus,
  reviewNotes: string,
  reviewedByUserId: string,
  reviewedByName: string,
) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(requestId)) {
    return null;
  }

  const update: Record<string, unknown> = {
    status,
    reviewNotes,
    reviewedByUserId: new Types.ObjectId(reviewedByUserId),
    reviewedByName,
    reviewedAt: new Date(),
  };

  

  if (status === "completed") {
    update.completedAt = new Date();
  }

  const request = await AccountClosureRequestModel.findByIdAndUpdate(requestId, update, {
    new: true,
  }).lean();

  return request ? serializeRequest(request as unknown as AccountClosureRequestLean) : null;
}
