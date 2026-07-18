import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { assertPermission } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { sendClientJourneyEmail } from "@/features/engagements/client-journey-email";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientKycSubmissionModel } from "@/models/client-kyc-submission";
import { EngagementRequestModel } from "@/models/engagement-request";
import { RequestStaffAssignmentModel } from "@/models/request-staff-assignment";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { createCommunicationNotification } from "@/repositories/communication-repository";
import { ensureEngagementLetterForRequest, sendEngagementLetter } from "@/repositories/engagement-letter-repository";

export type ClientKycAccess = {
  requestId: string;
  reference: string;
  serviceNames: string[];
  assignedStaffUserId: string;
  unlockedAt: string;
  approvedAt: string;
};

async function notifyClient(input: {
  request: { _id: Types.ObjectId; clientUserId: Types.ObjectId; clientName: string; clientEmail: string; reference: string };
  actor: Principal;
  title: string;
  description: string;
  actionPath: string;
  actionLabel: string;
}) {
  await Promise.all([
    createCommunicationNotification({
      recipientUserId: input.request.clientUserId.toString(),
      type: "engagement_update",
      title: input.title,
      description: input.description,
      relatedModule: "engagements",
      relatedRecordId: input.request._id.toString(),
      actionUrl: input.actionPath,
      createdByUserId: input.actor.id,
    }),
    sendClientJourneyEmail({
      recipientEmail: input.request.clientEmail,
      recipientName: input.request.clientName,
      title: input.title,
      summary: input.description,
      actionLabel: input.actionLabel,
      actionPath: input.actionPath,
    }),
  ]);
}

export async function unlockClientKycIfReady(requestId: string, actor: Principal) {
  if (!Types.ObjectId.isValid(requestId)) return { unlocked: false as const, reason: "invalid" as const };
  await connectToDatabase();
  const request = await EngagementRequestModel.findById(requestId).exec();
  if (!request || !request.adminApprovedAt || request.status !== "approved") {
    return { unlocked: false as const, reason: "approval" as const, request: request ?? null };
  }
  const assignment = await RequestStaffAssignmentModel.findOne({ requestId }).lean().exec();
  if (!assignment) return { unlocked: false as const, reason: "assignment" as const, request };
  if (request.kycUnlockedAt) return { unlocked: false as const, reason: "already" as const, request };

  const now = new Date();
  request.kycUnlockedAt = now;
  request.timeline.push({
    at: now,
    title: "KYC opened",
    detail: "The request was approved and a staff member was assigned. Client verification is now available.",
    clientVisible: true,
  });
  await request.save();
  await ClientKycSubmissionModel.findOneAndUpdate(
    { userId: request.clientUserId },
    { $setOnInsert: { userId: request.clientUserId, status: "draft", answers: {}, documents: [], questionnaireComplete: false } },
    { upsert: true, returnDocument: "after" },
  ).exec();
  await notifyClient({
    request,
    actor,
    title: "Your request is approved, complete KYC",
    description: `${request.reference} has been approved and assigned to the IFTA team. Complete your KYC questionnaire and upload the requested information to continue.`,
    actionPath: "/client/kyc",
    actionLabel: "Complete KYC",
  });
  await writeAuditLog({
    actor,
    action: "request.kyc_unlocked",
    resourceType: "EngagementRequest",
    resourceId: requestId,
    newValues: { kycUnlockedAt: now.toISOString(), assignedStaffUserId: assignment.staffUserId.toString() },
  });
  return { unlocked: true as const, request };
}

export async function approveEngagementRequest(requestId: string, actor: Principal) {
  assertPermission(actor, "engagements.accept");
  if (!Types.ObjectId.isValid(requestId)) return false;
  await connectToDatabase();
  const now = new Date();
  const request = await EngagementRequestModel.findOne({
    _id: requestId,
    status: { $in: ["admin_review", "approved"] },
  }).exec();
  if (!request) return false;
  const firstApproval = !request.adminApprovedAt;
  if (firstApproval) {
    request.status = "approved";
    request.adminApprovedAt = now;
    request.reviewedAt = now;
    request.timeline.push({
      at: now,
      title: "Request approved",
      detail: "The administration review is complete. KYC will open after staff assignment.",
      clientVisible: true,
    });
    await request.save();
    await writeAuditLog({
      actor,
      action: "request.approved",
      resourceType: "EngagementRequest",
      resourceId: requestId,
      newValues: { status: "approved", adminApprovedAt: now.toISOString() },
    });
  }
  const readiness = await unlockClientKycIfReady(requestId, actor);
  if (firstApproval && !readiness.unlocked) {
    await notifyClient({
      request,
      actor,
      title: "Your engagement request was approved",
      description: `${request.reference} passed administration review. We are assigning the responsible consultant before KYC opens.`,
      actionPath: "/client/engagements",
      actionLabel: "View request",
    });
  }
  return true;
}

export async function notifyClientOfStaffAssignment(requestId: string, actor: Principal, staffName: string) {
  if (!Types.ObjectId.isValid(requestId)) return;
  await connectToDatabase();
  const request = await EngagementRequestModel.findById(requestId).exec();
  if (!request) return;
  const readiness = await unlockClientKycIfReady(requestId, actor);
  if (!readiness.unlocked && readiness.reason === "already") {
    await notifyClient({
      request,
      actor,
      title: "Your assigned consultant was updated",
      description: `${staffName} is now responsible for ${request.reference}. Your KYC access remains open.`,
      actionPath: "/client/kyc",
      actionLabel: "Open KYC",
    });
  } else if (!readiness.unlocked) {
    await notifyClient({
      request,
      actor,
      title: "A consultant was assigned to your request",
      description: `${staffName} has been assigned to ${request.reference}. KYC will open as soon as the administration approval is complete.`,
      actionPath: "/client/engagements",
      actionLabel: "View request",
    });
  }
}

export async function getClientKycAccess(clientUserId: string): Promise<ClientKycAccess | null> {
  if (!Types.ObjectId.isValid(clientUserId)) return null;
  await connectToDatabase();
  const request = await EngagementRequestModel.findOne({
    clientUserId,
    kycUnlockedAt: { $ne: null },
    status: { $in: ["approved", "converted"] },
  }).sort({ kycUnlockedAt: -1 }).lean().exec();
  if (!request?.kycUnlockedAt || !request.adminApprovedAt) return null;
  const assignment = await RequestStaffAssignmentModel.findOne({ requestId: request._id.toString() }).lean().exec();
  if (!assignment) return null;
  return {
    requestId: request._id.toString(),
    reference: request.reference,
    serviceNames: request.items.map((item) => item.serviceTitle),
    assignedStaffUserId: assignment.staffUserId.toString(),
    unlockedAt: request.kycUnlockedAt.toISOString(),
    approvedAt: request.adminApprovedAt.toISOString(),
  };
}

export async function notifyKycSubmitted(clientUserId: string, actor: Principal) {
  const access = await getClientKycAccess(clientUserId);
  if (!access) return;
  const submission = await ClientKycSubmissionModel.findOne({ userId: clientUserId }).select("_id").lean().exec();
  if (!submission) return;
  const submissionId = `client-kyc-${submission._id.toString()}`;
  const recipients = new Set<string>([access.assignedStaffUserId]);
  const administrators = await UserModel.find({
    roleKeys: { $in: ["admin", "super_admin", "reviewer"] },
    status: "active",
  }).select("_id").lean().exec();
  administrators.forEach((administrator) => recipients.add(administrator._id.toString()));
  await Promise.all([...recipients].map((recipientUserId) => createCommunicationNotification({
    recipientUserId,
    type: "task_assigned",
    title: "KYC submitted for review",
    description: `${access.reference} is ready for KYC review and approval.`,
    relatedModule: "kyc",
    relatedRecordId: submission._id.toString(),
    actionUrl: recipientUserId === access.assignedStaffUserId
      ? `/staff/kyc/${submissionId}`
      : `/admin/kyc/${submissionId}`,
    createdByUserId: actor.id,
  })));
}

function kycObjectId(submissionId: string) {
  const value = submissionId.startsWith("client-kyc-")
    ? submissionId.slice("client-kyc-".length)
    : submissionId;
  return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
}

export async function canStaffAccessKycSubmission(submissionId: string, staffUserId: string) {
  const submissionObjectId = kycObjectId(submissionId);
  if (!submissionObjectId || !Types.ObjectId.isValid(staffUserId)) return false;
  await connectToDatabase();
  const submission = await ClientKycSubmissionModel.findById(submissionObjectId).select("userId assignedReviewerUserId").lean().exec();
  if (!submission) return false;
  if (submission.assignedReviewerUserId?.toString() === staffUserId) return true;
  const requestIds = await EngagementRequestModel.find({
    clientUserId: submission.userId,
    kycUnlockedAt: { $ne: null },
    status: { $in: ["approved", "converted"] },
  }).distinct("_id").exec();
  return Boolean(await RequestStaffAssignmentModel.exists({
    requestId: { $in: requestIds.map((requestId) => requestId.toString()) },
    staffUserId: new Types.ObjectId(staffUserId),
  }));
}

export async function approveClientKycSubmission(submissionId: string, actor: Principal) {
  const submissionObjectId = kycObjectId(submissionId);
  if (!submissionObjectId) return { ok: false as const, reason: "invalid" as const };
  await connectToDatabase();
  const submission = await ClientKycSubmissionModel.findById(submissionObjectId).exec();
  if (!submission) return { ok: false as const, reason: "missing" as const };
  if (!submission.questionnaireComplete || !["submitted", "under_review"].includes(submission.status)) {
    return { ok: false as const, reason: "not-ready" as const };
  }
  const requests = await EngagementRequestModel.find({
    clientUserId: submission.userId,
    status: { $in: ["approved", "converted"] },
    adminApprovedAt: { $ne: null },
    kycUnlockedAt: { $ne: null },
  }).exec();
  const hasApprovalPermission = actor.permissions.includes("kyc.approve");
  if (!hasApprovalPermission) {
    if (requests.length === 0) return { ok: false as const, reason: "request" as const };
    const assigned = await RequestStaffAssignmentModel.exists({
      requestId: { $in: requests.map((request) => request._id.toString()) },
      staffUserId: Types.ObjectId.isValid(actor.id) ? new Types.ObjectId(actor.id) : null,
    });
    if (!assigned) return { ok: false as const, reason: "forbidden" as const };
  }

  const now = new Date();
  submission.status = "approved";
  await submission.save();
  const workflowIds = requests
    .map((request) => request.workflowId)
    .filter((workflowId): workflowId is NonNullable<typeof workflowId> => Boolean(workflowId));
  if (workflowIds.length > 0) {
    await WorkflowInstanceModel.updateMany(
      { _id: { $in: workflowIds } },
      {
        $set: {
          "tasks.$[kycTask].status": "completed",
          "tasks.$[kycTask].completedAt": now,
          "tasks.$[kycTask].completedByUserId": actor.id,
          "approvals.$[kycApproval].status": "approved",
          "approvals.$[kycApproval].approvalDate": now,
          "approvals.$[kycApproval].approverUserId": actor.id,
          "approvals.$[kycApproval].approverName": actor.email,
          "stages.$[kycStage].status": "completed",
          "stages.$[kycStage].completedAt": now,
          "milestones.$[kycMilestone].status": "completed",
          "milestones.$[kycMilestone].date": now,
          lastActivityAt: now,
        },
        $push: {
          activity: {
            type: "approval_decision",
            title: "KYC approved",
            actorName: actor.email,
            actorUserId: actor.id,
            description: "The client KYC submission was approved.",
            relatedResource: submission._id.toString(),
            clientVisible: true,
            createdAt: now,
          },
        },
      },
      {
        arrayFilters: [
          { "kycTask.stageKey": "kyc" },
          { "kycApproval.stageKey": "kyc" },
          { "kycStage.key": "kyc" },
          { "kycMilestone.key": { $in: ["kyc_approved", "kyc-approved"] } },
        ],
      },
    ).exec();
  }
  const generatedLetterIds: string[] = [];
  for (const request of requests) {
    if (!request.kycApprovedAt) {
      request.kycApprovedAt = now;
      request.timeline.push({
        at: now,
        title: "KYC approved",
        detail: "Client verification was approved. The engagement letter is being prepared.",
        clientVisible: true,
      });
      await request.save();
    }
    const prepared = await ensureEngagementLetterForRequest(request._id.toString(), actor);
    if (prepared) {
      const letter = prepared.letter.status === "draft"
        ? await sendEngagementLetter(prepared.letter.id, actor)
        : prepared.letter;
      if (letter) generatedLetterIds.push(letter.id);
    }
  }
  const client = await UserModel.findById(submission.userId).select("email firstName lastName").lean().exec();
  if (client) {
    const clientName = `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || client.email;
    await Promise.all([
      createCommunicationNotification({
        recipientUserId: submission.userId.toString(),
        type: "engagement_update",
        title: "KYC approved, your engagement letter is ready",
        description: "Your KYC review is complete. Review and sign the generated engagement letter in Documents to begin the engagement.",
        relatedModule: "kyc",
        relatedRecordId: submission._id.toString(),
        actionUrl: "/client/documents",
        createdByUserId: actor.id,
      }),
      sendClientJourneyEmail({
        recipientEmail: client.email,
        recipientName: clientName,
        title: "KYC approved, your engagement letter is ready",
        summary: "Your KYC review is complete. Review and sign the generated engagement letter in Documents to begin the engagement.",
        actionLabel: "Review engagement letter",
        actionPath: "/client/documents",
      }),
    ]);
  }
  await writeAuditLog({
    actor,
    action: "kyc.submission_approved",
    resourceType: "ClientKycSubmission",
    resourceId: submission._id.toString(),
    newValues: { status: "approved", requestIds: requests.map((request) => request._id.toString()), generatedLetterIds },
  });
  return { ok: true as const, generatedLetterIds };
}
