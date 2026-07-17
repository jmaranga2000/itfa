import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { createCommunicationNotification } from "@/repositories/communication-repository";
import { connectToDatabase } from "@/lib/db/mongoose";
import { EngagementRequestModel } from "@/models/engagement-request";
import { RequestStaffAssignmentModel } from "@/models/request-staff-assignment";
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
  return {
    id: request.id,
    reference: request.reference,
    client: request.clientName,
    clientContact: request.clientEmail,
    service: serviceNames.join(", "),
    status: statusLabel(request.status),
    priority: request.priority === "high" ? "High" : "Medium",
    owner: "Engagement manager",
    submitted: new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(request.submittedAt)),
    nextAction: request.status.startsWith("quotation")
      ? "Prepare and send pricing quotation"
      : request.status === "converted"
        ? "Continue in the active engagement"
        : "Confirm scope, KYC and assigned staff",
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

export async function convertEngagementRequestToWorkflow(requestId: string, actor: Principal) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(requestId)) return null;
  const request = await EngagementRequestModel.findOne({
    _id: requestId,
    status: { $in: ["admin_review", "approved"] },
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
  const assignment = await RequestStaffAssignmentModel.findOne({ requestId }).lean().exec();
  const assignedStaff = assignment
    ? await UserModel.findById(assignment.staffUserId).select("firstName lastName email roleKeys").lean().exec()
    : null;
  const assignedName = assignedStaff
    ? `${assignedStaff.firstName ?? ""} ${assignedStaff.lastName ?? ""}`.trim() || assignedStaff.email
    : "";
  const workflow = await WorkflowInstanceModel.create({
    reference: `ENG-${now.getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`,
    clientName: request.clientName,
    clientUserId: request.clientUserId,
    organizationName: request.clientName,
    serviceName: serviceNames.join(", "),
    templateId: template._id,
    templateName: template.name,
    templateVersion: template.version,
    templateSnapshot: template,
    status: "active",
    currentStageKey: template.stages[0].key,
    riskLevel: "low",
    nextAction: template.stages[0].clientTitle,
    responsibleUserId: assignedStaff?._id ?? null,
    responsibleUserName: assignedName,
    startDate: now,
    dueDate: addDays(now, template.stages.reduce((total, stage) => total + stage.expectedDurationDays, 0)),
    lastActivityAt: now,
    team: assignedStaff ? [{
      userId: assignedStaff._id,
      name: assignedName,
      email: assignedStaff.email,
      role: assignedStaff.roleKeys?.[0] ?? "consultant",
      department: "Consulting",
      workloadLevel: "balanced",
    }] : [],
    stages: template.stages.map((stage, index) => ({
      key: stage.key,
      name: stage.name,
      internalDescription: stage.internalDescription,
      clientTitle: stage.clientTitle,
      order: stage.order,
      expectedDurationDays: stage.expectedDurationDays,
      responsibleRole: stage.responsibleRole,
      entryConditions: stage.entryConditions,
      completionConditions: stage.completionConditions,
      requiredDocuments: stage.requiredDocuments,
      approvalRequired: stage.approvalRequired,
      clientVisible: stage.clientVisible,
      status: index === 0 ? "in_progress" : "not_started",
      enteredAt: index === 0 ? now : null,
      dueAt: index === 0 ? addDays(now, stage.expectedDurationDays) : null,
    })),
    tasks: template.stages.flatMap((stage, stageIndex) => stage.tasks.map((task) => ({
      key: task.key,
      stageKey: stage.key,
      title: task.title,
      description: task.description,
      assignedUserId: stageIndex === 0 ? assignedStaff?._id ?? null : null,
      assignedUserName: stageIndex === 0 ? assignedName : "",
      assignedRole: task.assignedRole,
      priority: task.priority,
      status: stageIndex === 0 ? "ready" : "not_started",
      dueDate: stageIndex === 0 ? addDays(now, task.dueOffsetDays) : null,
      dependencies: task.dependencies,
      checklist: task.checklist.map((label) => ({ label, completed: false })),
      requiredDocuments: task.requiredDocuments,
      clientVisible: task.clientVisible,
      approvalRequired: task.approvalRequired,
    }))),
    milestones: template.milestones.map((title, index) => ({ key: `milestone-${index + 1}`, title, status: "pending", clientVisible: true })),
    approvals: template.approvalPoints,
    clientActions: [{
      key: "complete-kyc",
      title: "Complete client verification",
      instructions: "Complete the KYC questionnaire and upload the requested evidence.",
      assignedClientUserId: request.clientUserId,
      status: "pending",
      priority: "high",
    }],
    financial: { invoiceStatus: "draft", paymentStatus: "pending", balanceDue: request.quotationAmount ?? 0, currency: request.quotationCurrency },
    completionChecklist: template.completionConditions.map((label) => ({ label, completed: false })),
    archive: { status: "not_ready" },
    activity: [{
      type: "workflow_created",
      title: "Engagement workspace created",
      actorName: actor.email,
      actorUserId: new Types.ObjectId(actor.id),
      description: `Created from ${request.reference}.`,
      relatedResource: request.reference,
      clientVisible: true,
      createdAt: now,
    }],
  });
  request.status = "converted";
  request.workflowId = workflow._id;
  request.reviewedAt = now;
  request.timeline.push({ at: now, title: "Engagement created", detail: `${workflow.reference} is now active.`, clientVisible: true });
  await request.save();
  if (assignedStaff) await UserModel.updateOne({ _id: assignedStaff._id }, { $addToSet: { assignedEngagementIds: workflow._id } }).exec();
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
