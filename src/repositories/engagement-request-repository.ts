import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { createCommunicationNotification } from "@/repositories/communication-repository";
import { connectToDatabase } from "@/lib/db/mongoose";
import { EngagementRequestModel } from "@/models/engagement-request";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { WorkflowTemplateModel } from "@/models/workflow-template";
import { completeCart, getClientCart, type CommerceIdentity } from "@/repositories/client-commerce-repository";
import type { AdminRequest } from "@/content/admin-requests";

export type EngagementRequestStatus =
  | "admin_review"
  | "quotation_requested"
  | "quotation_preparing"
  | "quotation_sent"
  | "clarification"
  | "approved"
  | "rejected"
  | "converted";

export type EngagementRequestRecord = {
  id: string;
  reference: string;
  clientUserId: string;
  clientName: string;
  clientEmail: string;
  requestType: "checkout" | "quotation";
  items: Array<{
    serviceId: string;
    serviceTitle: string;
    serviceSummary: string;
    priceLabel: string;
    cadence: string;
    quantity: number;
  }>;
  status: EngagementRequestStatus;
  priority: "medium" | "high";
  clientNotes: string;
  expectedOutcome: string;
  quotationAmount: number | null;
  quotationCurrency: string;
  workflowId: string | null;
  isNew: boolean;
  adminApprovedAt: string | null;
  kycUnlockedAt: string | null;
  kycApprovedAt: string | null;
  submittedAt: string;
  timeline: Array<{ at: string; title: string; detail: string; clientVisible: boolean }>;
};

type RawRequest = {
  _id: Types.ObjectId;
  reference: string;
  clientUserId: Types.ObjectId;
  clientName: string;
  clientEmail: string;
  requestType: "checkout" | "quotation";
  items: Array<{
    serviceId: Types.ObjectId;
    serviceTitle: string;
    serviceSummary?: string;
    priceLabel?: string;
    cadence?: string;
    quantity?: number;
  }>;
  status: EngagementRequestStatus;
  priority?: "medium" | "high";
  clientNotes?: string;
  expectedOutcome?: string;
  quotationAmount?: number | null;
  quotationCurrency?: string;
  workflowId?: Types.ObjectId | null;
  adminViewedAt?: Date | null;
  adminApprovedAt?: Date | null;
  kycUnlockedAt?: Date | null;
  kycApprovedAt?: Date | null;
  submittedAt: Date;
  timeline?: Array<{ at: Date; title: string; detail?: string; clientVisible?: boolean }>;
};

function serialize(request: RawRequest): EngagementRequestRecord {
  return {
    id: request._id.toString(),
    reference: request.reference,
    clientUserId: request.clientUserId.toString(),
    clientName: request.clientName,
    clientEmail: request.clientEmail,
    requestType: request.requestType,
    items: request.items.map((item) => ({
      serviceId: item.serviceId.toString(),
      serviceTitle: item.serviceTitle,
      serviceSummary: item.serviceSummary ?? "",
      priceLabel: item.priceLabel ?? "Quotation required",
      cadence: item.cadence ?? "Scoped engagement",
      quantity: item.quantity ?? 1,
    })),
    status: request.status,
    priority: request.priority ?? "medium",
    clientNotes: request.clientNotes ?? "",
    expectedOutcome: request.expectedOutcome ?? "",
    quotationAmount: request.quotationAmount ?? null,
    quotationCurrency: request.quotationCurrency ?? "KES",
    workflowId: request.workflowId?.toString() ?? null,
    isNew: !request.adminViewedAt,
    adminApprovedAt: request.adminApprovedAt?.toISOString() ?? null,
    kycUnlockedAt: request.kycUnlockedAt?.toISOString() ?? null,
    kycApprovedAt: request.kycApprovedAt?.toISOString() ?? null,
    submittedAt: request.submittedAt.toISOString(),
    timeline: (request.timeline ?? []).map((item) => ({
      at: item.at.toISOString(), title: item.title, detail: item.detail ?? "", clientVisible: item.clientVisible ?? true,
    })),
  };
}

function requestReference() {
  return `REQ-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function statusLabel(status: EngagementRequestStatus): AdminRequest["status"] {
  const labels: Record<EngagementRequestStatus, AdminRequest["status"]> = {
    admin_review: "Admin review",
    quotation_requested: "Quotation requested",
    quotation_preparing: "Quotation preparing",
    quotation_sent: "Quotation sent",
    clarification: "Clarification",
    approved: "Ready to convert",
    rejected: "Clarification",
    converted: "Converted",
  };
  return labels[status];
}

export function engagementRequestToAdminRecord(request: EngagementRequestRecord): AdminRequest {
  const serviceNames = request.items.map((item) => item.serviceTitle);
  const workflowStatus = request.status === "approved"
    ? request.kycApprovedAt ? "Letter signature" : "KYC required"
    : statusLabel(request.status);
  return {
    id: request.id,
    reference: request.reference,
    client: request.clientName,
    clientContact: request.clientEmail,
    service: serviceNames.join(", "),
    status: workflowStatus,
    priority: request.priority === "high" ? "High" : "Medium",
    owner: "Engagement manager",
    submitted: new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(request.submittedAt)),
    nextAction: request.status.startsWith("quotation")
      ? "Prepare and send pricing quotation"
      : request.status === "converted"
        ? "Continue in the active engagement"
        : request.status === "approved" && request.kycApprovedAt
          ? "Collect the completed engagement letter"
          : request.status === "approved"
            ? "Complete the client KYC review"
            : "Confirm scope and assign staff",
    requestSummary: request.clientNotes || `The client selected ${serviceNames.join(", ")}.`,
    requestedOutcome: request.expectedOutcome || "Confirm a responsible scope, fee and delivery plan.",
    scope: request.items.flatMap((item) => [item.serviceTitle, ...item.serviceSummary ? [item.serviceSummary] : []]),
    documents: [],
    timeline: request.timeline.map((item) => ({
      at: new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.at)),
      title: item.title,
      detail: item.detail,
    })),
    source: "database",
    workflowId: request.workflowId,
    isNew: request.isNew,
    adminApproved: Boolean(request.adminApprovedAt),
  };
}

export async function createEngagementRequestFromCart(input: {
  principal: Principal;
  identity: CommerceIdentity;
  requestType: "checkout" | "quotation";
  clientNotes?: string;
  expectedOutcome?: string;
}) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(input.principal.id)) throw new Error("A client account is required.");
  const cart = await getClientCart({ ...input.identity, clientUserId: input.principal.id });
  if (cart.empty) throw new Error("The cart is empty.");
  const client = await UserModel.findById(input.principal.id).select("email firstName lastName").lean().exec();
  if (!client) throw new Error("The client account is not available.");
  const clientName = `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || client.email;
  const status = input.requestType === "quotation" ? "quotation_requested" : "admin_review";
  const request = await EngagementRequestModel.create({
    reference: requestReference(),
    clientUserId: client._id,
    clientName,
    clientEmail: client.email,
    requestType: input.requestType,
    items: cart.items.map((item) => ({
      serviceId: new Types.ObjectId(item.serviceId),
      serviceTitle: item.title,
      serviceSummary: item.summary,
      pricingPlanId: item.pricingPlanId ? new Types.ObjectId(item.pricingPlanId) : null,
      priceLabel: item.priceLabel,
      cadence: item.cadence,
      quantity: item.quantity,
    })),
    status,
    priority: "medium",
    clientNotes: input.clientNotes ?? "",
    expectedOutcome: input.expectedOutcome ?? "",
    submittedAt: new Date(),
    timeline: [{
      at: new Date(),
      title: input.requestType === "quotation" ? "Quotation requested" : "Engagement request submitted",
      detail: input.requestType === "quotation"
        ? "The selected services were sent to IFTA for pricing."
        : "The selected services were sent to the administration team for scope review.",
      clientVisible: true,
    }],
  });
  await completeCart(
    { ...input.identity, clientUserId: input.principal.id },
    request._id.toString(),
    input.requestType === "quotation" ? "quotation_requested" : "submitted",
  );
  await createCommunicationNotification({
    recipientUserId: input.principal.id,
    type: "engagement_update",
    title: input.requestType === "quotation" ? "Quotation request received" : "Engagement request received",
    description: `${request.reference} is now with the IFTA administration team.`,
    relatedModule: "engagements",
    relatedRecordId: request._id.toString(),
    actionUrl: "/client/engagements",
    createdByUserId: input.principal.id,
  });
  const administrators = await UserModel.find({
    roleKeys: { $in: ["admin", "super_admin", "engagement_manager"] },
    status: "active",
  }).select("_id").lean().exec();
  await Promise.all(administrators.map((administrator) => createCommunicationNotification({
    recipientUserId: administrator._id.toString(),
    type: "engagement_update",
    title: input.requestType === "quotation" ? "New quotation request" : "New engagement request",
    description: `${clientName} submitted ${request.reference} for ${cart.items.map((item) => item.title).join(", ")}.`,
    relatedModule: "engagements",
    relatedRecordId: request._id.toString(),
    actionUrl: `/admin/requests/${request._id}`,
    createdByUserId: input.principal.id,
  })));
  await writeAuditLog({
    actor: input.principal,
    action: input.requestType === "quotation" ? "request.quotation_submitted" : "request.checkout_submitted",
    resourceType: "EngagementRequest",
    resourceId: request._id.toString(),
    newValues: { reference: request.reference, services: cart.items.map((item) => item.title) },
  });
  return request._id.toString();
}

export async function listClientEngagementRequests(clientUserId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(clientUserId)) return [];
  const requests = await EngagementRequestModel.find({ clientUserId: new Types.ObjectId(clientUserId) })
    .sort({ submittedAt: -1 }).lean().exec();
  return (requests as unknown as RawRequest[]).map(serialize);
}

export async function getClientEngagementRequest(clientUserId: string, requestId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(clientUserId) || !Types.ObjectId.isValid(requestId)) return null;
  const request = await EngagementRequestModel.findOne({ _id: requestId, clientUserId }).lean().exec();
  return request ? serialize(request as unknown as RawRequest) : null;
}

export async function listEngagementRequestsForAdmin() {
  await connectToDatabase();
  const requests = await EngagementRequestModel.find({ status: { $ne: "rejected" } }).sort({ submittedAt: -1 }).lean().exec();
  return (requests as unknown as RawRequest[]).map(serialize);
}

export async function countNewEngagementRequests() {
  await connectToDatabase();
  return EngagementRequestModel.countDocuments({
    status: { $nin: ["rejected", "converted"] },
    adminViewedAt: null,
  }).exec();
}

export async function markEngagementRequestViewed(requestId: string) {
  if (!Types.ObjectId.isValid(requestId)) return;
  await connectToDatabase();
  await EngagementRequestModel.updateOne(
    { _id: requestId, adminViewedAt: null },
    { $set: { adminViewedAt: new Date() } },
  ).exec();
}

export async function getEngagementRequestForAdmin(requestId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(requestId)) return null;
  const request = await EngagementRequestModel.findById(requestId).lean().exec();
  return request ? serialize(request as unknown as RawRequest) : null;
}

export async function engagementRequestExists(requestId: string) {
  if (!Types.ObjectId.isValid(requestId)) return false;
  await connectToDatabase();
  return Boolean(await EngagementRequestModel.exists({ _id: requestId }));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

export type EngagementActivationContext = {
  engagementLetterId: string;
  letterGeneratedAt: string;
  letterSentAt: string | null;
  signedAt: string;
  signerUserId: string | null;
  signerName: string;
};

export async function convertEngagementRequestToWorkflow(
  requestId: string,
  actor: Principal,
  activation: EngagementActivationContext,
) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(requestId) || !Types.ObjectId.isValid(activation.engagementLetterId)) {
    return null;
  }
  const request = await EngagementRequestModel.findOne({
    _id: requestId,
    status: "approved",
    workflowId: null,
    adminApprovedAt: { $ne: null },
    kycApprovedAt: { $ne: null },
    engagementLetterId: { $ne: null },
  }).exec();
  if (!request) return null;
  const serviceNames = request.items.map((item) => item.serviceTitle);
  const template = await WorkflowTemplateModel.findOne({
    status: "published",
    archivedAt: null,
    $or: [
      { applicableServices: { $in: serviceNames } },
      { applicableServices: { $size: 0 } },
    ],
  }).sort({ version: -1 }).lean().exec()
    ?? await WorkflowTemplateModel.findOne({ status: "published", archivedAt: null }).sort({ version: -1 }).lean().exec();
  if (!template || template.stages.length === 0) throw new Error("Publish a workflow template before converting requests.");

  const now = new Date();
  const signedAt = new Date(activation.signedAt);
  const generatedAt = new Date(activation.letterGeneratedAt);
  const sentAt = activation.letterSentAt ? new Date(activation.letterSentAt) : null;
  const actorUserId = Types.ObjectId.isValid(actor.id) ? new Types.ObjectId(actor.id) : null;
  const signerUserId = activation.signerUserId && Types.ObjectId.isValid(activation.signerUserId)
    ? new Types.ObjectId(activation.signerUserId)
    : null;
  const activeStageIndex = template.stages.findIndex((stage) => stage.key === "active_work");
  const deliveryStages = template.stages
    .slice(activeStageIndex >= 0 ? activeStageIndex : 0)
    .filter((stage) => stage.key !== "team_assignment");
  const firstDeliveryStage = deliveryStages[0];
  if (!firstDeliveryStage) throw new Error("The workflow template has no delivery stages.");

  const initialActivity = [
    {
      type: "workflow_created",
      title: "Engagement Created",
      actorName: request.clientName,
      actorUserId: request.clientUserId,
      description: `Created from request ${request.reference}.`,
      relatedResource: request.reference,
      clientVisible: true,
      createdAt: generatedAt,
    },
    ...(sentAt ? [{
      type: "engagement_letter_sent",
      title: "Engagement Letter Sent",
      actorName: actor.email,
      actorUserId,
      description: "The engagement letter was sent for electronic signature.",
      relatedResource: activation.engagementLetterId,
      clientVisible: true,
      createdAt: sentAt,
    }] : []),
    {
      type: "engagement_letter_signed",
      title: "Engagement Letter Signed",
      actorName: activation.signerName,
      actorUserId: signerUserId,
      description: `Electronically signed by ${activation.signerName}.`,
      relatedResource: activation.engagementLetterId,
      clientVisible: true,
      createdAt: signedAt,
    },
    {
      type: "engagement_activated",
      title: "Engagement Activated",
      actorName: "IFTA System",
      actorUserId,
      description: "The signed letter activated the engagement workspace.",
      relatedResource: request.reference,
      clientVisible: true,
      createdAt: now,
    },
  ].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());

  const workflow = await WorkflowInstanceModel.create({
    reference: `ENG-${now.getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`,
    clientName: request.clientName,
    clientUserId: request.clientUserId,
    organizationName: request.clientName,
    sourceRequestId: request._id,
    engagementLetterId: new Types.ObjectId(activation.engagementLetterId),
    serviceName: serviceNames.join(", "),
    templateId: template._id,
    templateName: template.name,
    templateVersion: template.version,
    templateSnapshot: template,
    status: "active",
    currentStageKey: "team_assignment",
    riskLevel: "low",
    nextAction: "Assign the consultant, reviewer, and finance officer",
    responsibleUserId: null,
    responsibleUserName: "",
    startDate: now,
    activatedAt: now,
    signedAt,
    signedByUserId: signerUserId,
    signedByName: activation.signerName,
    teamAssignedAt: null,
    dueDate: addDays(now, deliveryStages.reduce((total, stage) => total + stage.expectedDurationDays, 0)),
    lastActivityAt: now,
    team: [],
    stages: [{
      key: "team_assignment",
      name: "Team Assignment",
      internalDescription: "Assign the delivery team before client work begins.",
      clientTitle: "Team Assignment",
      order: 1,
      expectedDurationDays: 1,
      responsibleRole: "admin",
      entryConditions: ["Engagement letter signed"],
      completionConditions: ["Consultant assigned", "Reviewer assigned", "Finance officer assigned"],
      requiredDocuments: [],
      approvalRequired: false,
      clientVisible: true,
      status: "in_progress",
      enteredAt: now,
      completedAt: null,
      dueAt: addDays(now, 1),
    }, ...deliveryStages.map((stage, index) => ({
      key: stage.key,
      name: stage.name,
      internalDescription: stage.internalDescription,
      clientTitle: stage.clientTitle,
      order: index + 2,
      expectedDurationDays: stage.expectedDurationDays,
      responsibleRole: stage.responsibleRole,
      entryConditions: stage.entryConditions,
      completionConditions: stage.completionConditions,
      requiredDocuments: stage.requiredDocuments,
      approvalRequired: stage.approvalRequired,
      clientVisible: stage.clientVisible,
      status: "not_started",
      enteredAt: null,
      completedAt: null,
      dueAt: null,
    }))],
    tasks: deliveryStages.flatMap((stage) => stage.tasks.map((task) => ({
      key: task.key,
      stageKey: stage.key,
      title: task.title,
      description: task.description,
      assignedUserId: null,
      assignedUserName: "",
      assignedRole: task.assignedRole,
      priority: task.priority,
      status: "not_started",
      startDate: null,
      completedAt: null,
      completedByUserId: null,
      dueDate: null,
      dependencies: task.dependencies,
      checklist: task.checklist.map((label) => ({ label, completed: false })),
      requiredDocuments: task.requiredDocuments,
      clientVisible: task.clientVisible,
      approvalRequired: task.approvalRequired,
    }))),
    milestones: template.milestones.map((title, index) => ({ key: `milestone-${index + 1}`, title, status: "pending", clientVisible: true })),
    approvals: template.approvalPoints.filter((approval) =>
      deliveryStages.some((stage) => stage.key === approval.stageKey),
    ),
    clientActions: [],
    financial: { invoiceStatus: "draft", paymentStatus: "pending", balanceDue: request.quotationAmount ?? 0, currency: request.quotationCurrency },
    completionChecklist: template.completionConditions.map((label) => ({ label, completed: false })),
    archive: { status: "not_ready" },
    activity: initialActivity,
    internalNotes: [],
  });
  request.status = "converted";
  request.workflowId = workflow._id;
  request.reviewedAt = now;
  request.timeline.push({ at: now, title: "Engagement activated", detail: `${workflow.reference} is active and awaiting team assignment.`, clientVisible: true });
  await request.save();
  await createCommunicationNotification({
    recipientUserId: request.clientUserId.toString(),
    type: "engagement_update",
    title: "Your engagement is ready",
    description: `${workflow.reference} has been created and is available in your portal.`,
    relatedModule: "engagements",
    relatedRecordId: workflow._id.toString(),
    actionUrl: "/client/engagements",
    createdByUserId: actor.id,
  });
  await writeAuditLog({ actor, action: "request.converted", resourceType: "EngagementRequest", resourceId: requestId, newValues: { workflowId: workflow._id.toString() } });
  return workflow._id.toString();
}
