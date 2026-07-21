import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientDocumentModel } from "@/models/client-document";
import { ClientPaymentModel } from "@/models/client-payment";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { createCommunicationNotification } from "@/repositories/communication-repository";
import {
  listArchivedWorkflowsForPrincipal,
  listWorkflowsForPrincipal,
  type WorkflowInstanceRecord,
} from "@/repositories/workflow-repository";

export type ClientDocumentRecord = {
  id: string;
  name: string;
  documentKind: string;
  workflowId: string | null;
  engagementReference: string;
  direction: "sent" | "received";
  status: string;
  feedback: string;
  clientResponse: string;
  reviewRequired: boolean;
  uploadedAt: string;
  downloadHref: string | null;
};

export type ClientInvoiceRecord = {
  workflowId: string;
  reference: string;
  clientName: string;
  serviceName: string;
  status: string;
  balanceDue: number;
  currency: string;
  dueDate: string | null;
};

export type ClientPaymentRecord = {
  id: string;
  workflowId: string;
  engagementReference: string;
  amount: number;
  currency: string;
  method: string;
  transactionReference: string;
  status: string;
  submittedAt: string;
  reviewNote: string;
};

type RawDocument = {
  _id: Types.ObjectId;
  workflowId?: Types.ObjectId | null;
  name: string;
  documentKind?: string;
  direction: "sent" | "received";
  status: string;
  feedback?: string;
  clientResponse?: string;
  uploadedAt: Date;
};

type RawPayment = {
  _id: Types.ObjectId;
  workflowId: Types.ObjectId;
  amount: number;
  currency: string;
  method: string;
  transactionReference: string;
  status: string;
  submittedAt: Date;
  reviewNote?: string;
};

export async function getClientDocuments(principal: Principal): Promise<ClientDocumentRecord[]> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(principal.id)) return [];
  const [workflows, storedDocuments] = await Promise.all([
    listWorkflowsForPrincipal(principal),
    ClientDocumentModel.find({
      clientUserId: new Types.ObjectId(principal.id),
      $or: [
        { documentKind: { $in: ["general", "signed_engagement_letter"] } },
        { documentKind: "final_deliverable", $or: [
          { deliverableStatus: "released" },
          { deliverableStatus: { $exists: false }, status: "final" },
        ] },
        { documentKind: "draft_deliverable", status: { $in: ["approved", "final"] } },
      ],
    }).sort({ uploadedAt: -1 }).lean().exec(),
  ]);
  const workflowById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
  const stored = (storedDocuments as unknown as RawDocument[]).map((document): ClientDocumentRecord => ({
    ...(() => {
      const workflow = document.workflowId ? workflowById.get(document.workflowId.toString()) : undefined;
      const reviewAction = workflow?.clientActions.find((action) => action.key === "review_deliverable");
      return {
        reviewRequired: document.documentKind === "draft_deliverable"
          && document.status === "approved"
          && workflow?.currentStageKey === "client_review"
          && Boolean(reviewAction && !["approved", "completed"].includes(reviewAction.status)),
      };
    })(),
    id: document._id.toString(),
    name: document.name,
    documentKind: document.documentKind ?? "general",
    workflowId: document.workflowId?.toString() ?? null,
    engagementReference: document.workflowId ? workflowById.get(document.workflowId.toString())?.reference ?? "Client document" : "Client document",
    direction: document.direction,
    status: document.status,
    feedback: document.feedback ?? "",
    clientResponse: document.clientResponse ?? "",
    uploadedAt: document.uploadedAt.toISOString(),
    downloadHref: `/api/client/documents/${document._id}`,
  }));
  const storedIds = new Set(stored.map((document) => document.id));
  const workflowDocuments = workflows.flatMap((workflow) => workflow.documents
    .filter((document) => !storedIds.has(document.documentId))
    .map((document): ClientDocumentRecord => ({
      id: `${workflow.id}-${document.documentId}`,
      name: document.name,
      documentKind: "workflow_document",
      workflowId: workflow.id,
      engagementReference: workflow.reference,
      direction: "received",
      status: document.status,
      feedback: document.clientFeedback,
      clientResponse: "",
      reviewRequired: false,
      uploadedAt: document.uploadedAt,
      downloadHref: null,
    })));
  return [...stored, ...workflowDocuments].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
}

export async function getClientDocumentFile(principal: Principal, documentId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(principal.id) || !Types.ObjectId.isValid(documentId)) return null;
  const document = await ClientDocumentModel.findOne({ _id: documentId, clientUserId: principal.id }).lean().exec();
  if (!document) return null;
  const legacyReleased = document.documentKind === "final_deliverable"
    && !document.deliverableStatus
    && document.status === "final";
  if (document.documentKind === "final_deliverable"
    && document.deliverableStatus !== "released"
    && !legacyReleased) return null;
  return document;
}

export async function respondToDocumentFeedback(principal: Principal, documentId: string, response: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(principal.id) || !Types.ObjectId.isValid(documentId)) return false;
  const result = await ClientDocumentModel.updateOne(
    { _id: documentId, clientUserId: principal.id, status: "replacement_requested" },
    { $set: { clientResponse: response, status: "pending_review" } },
  ).exec();
  return result.modifiedCount > 0;
}

export async function recordClientDeliverableReview(input: {
  principal: Principal;
  workflowId: string;
  documentId: string;
  decision: "approved" | "changes_requested";
  feedback: string;
}) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(input.principal.id) || !Types.ObjectId.isValid(input.workflowId) || !Types.ObjectId.isValid(input.documentId)) return false;
  const workflow = await WorkflowInstanceModel.findOne({
    _id: input.workflowId,
    clientUserId: input.principal.id,
    currentStageKey: "client_review",
    archivedAt: null,
  }).exec();
  if (!workflow) return false;
  const document = await ClientDocumentModel.findOne({
    _id: input.documentId,
    workflowId: input.workflowId,
    clientUserId: input.principal.id,
    documentKind: "draft_deliverable",
    status: "approved",
  }).exec();
  if (!document) return false;
  const clientAction = workflow.clientActions.find((action) => action.key === "review_deliverable");
  const workflowDocument = workflow.documents.find((item) => item.documentId === input.documentId);
  if (!clientAction || !workflowDocument) return false;

  const now = new Date();
  clientAction.status = input.decision === "approved" ? "completed" : "changes_requested";
  workflowDocument.status = input.decision === "approved" ? "approved" : "replacement_requested";
  workflowDocument.clientFeedback = input.feedback;
  document.status = input.decision === "approved" ? "approved" : "replacement_requested";
  document.clientResponse = input.feedback;
  workflow.nextAction = input.decision === "approved"
    ? "Client review complete. Advance the engagement to invoicing."
    : "Prepare and release a revised draft for client review.";
  const feedbackMilestone = workflow.milestones.find((milestone) => milestone.key === "client_feedback_received");
  if (feedbackMilestone) {
    feedbackMilestone.status = "completed";
    feedbackMilestone.date = now;
  }
  workflow.activity.push({
    type: "message_received",
    title: input.decision === "approved" ? "Client approved the draft deliverable" : "Client requested deliverable changes",
    actorName: input.principal.displayName ?? input.principal.email,
    actorUserId: new Types.ObjectId(input.principal.id),
    description: input.feedback,
    relatedResource: input.documentId,
    clientVisible: true,
    createdAt: now,
  });
  workflow.lastActivityAt = now;
  await Promise.all([workflow.save(), document.save()]);

  const recipient = workflow.responsibleUserId
    ?? workflow.team.find((member) => ["lead_consultant", "engagement_manager"].includes(member.role))?.userId;
  if (recipient) {
    await createCommunicationNotification({
      recipientUserId: recipient.toString(),
      type: "engagement_update",
      title: input.decision === "approved" ? "Client approved the draft" : "Client requested changes",
      description: `${workflow.clientName} responded to ${document.name}: ${input.feedback}`,
      relatedModule: "engagements",
      relatedRecordId: workflow._id.toString(),
      actionUrl: `/staff/engagements/${workflow._id.toString()}`,
      createdByUserId: input.principal.id,
    });
  }
  return true;
}

export async function getClientInvoices(principal: Principal): Promise<ClientInvoiceRecord[]> {
  const workflows = await listWorkflowsForPrincipal(principal);
  return workflows.map((workflow) => ({
    workflowId: workflow.id,
    reference: workflow.reference,
    clientName: workflow.clientName,
    serviceName: workflow.serviceName,
    status: workflow.financial.invoiceStatus,
    balanceDue: workflow.financial.balanceDue,
    currency: workflow.financial.currency,
    dueDate: workflow.dueDate,
  }));
}

export async function getClientPayments(principal: Principal) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(principal.id)) return { payments: [], invoices: [] };
  const [invoices, payments] = await Promise.all([
    getClientInvoices(principal),
    ClientPaymentModel.find({ clientUserId: principal.id }).sort({ submittedAt: -1 }).lean().exec(),
  ]);
  const invoiceById = new Map(invoices.map((invoice) => [invoice.workflowId, invoice]));
  return {
    invoices,
    payments: (payments as unknown as RawPayment[]).map((payment): ClientPaymentRecord => ({
      id: payment._id.toString(),
      workflowId: payment.workflowId.toString(),
      engagementReference: invoiceById.get(payment.workflowId.toString())?.reference ?? "Engagement",
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      transactionReference: payment.transactionReference,
      status: payment.status,
      submittedAt: payment.submittedAt.toISOString(),
      reviewNote: payment.reviewNote ?? "",
    })),
  };
}

export async function createClientPayment(input: {
  principal: Principal;
  workflowId: string;
  amount: number;
  method: "bank_transfer" | "mpesa" | "card" | "other";
  transactionReference: string;
}) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(input.principal.id) || !Types.ObjectId.isValid(input.workflowId)) return null;
  const workflow = await WorkflowInstanceModel.findOne({ _id: input.workflowId, clientUserId: input.principal.id }).lean().exec();
  if (!workflow) return null;
  if (!["approved", "issued", "partially_paid", "overdue"].includes(workflow.financial.invoiceStatus)) return null;
  if (workflow.financial.balanceDue <= 0 || input.amount > workflow.financial.balanceDue) return null;
  const duplicate = await ClientPaymentModel.exists({
    workflowId: input.workflowId,
    transactionReference: input.transactionReference,
  });
  if (duplicate) return null;
  const payment = await ClientPaymentModel.create({
    clientUserId: input.principal.id,
    workflowId: input.workflowId,
    amount: input.amount,
    currency: workflow.financial.currency,
    method: input.method,
    transactionReference: input.transactionReference,
    status: "pending",
  });
  await WorkflowInstanceModel.updateOne(
    { _id: input.workflowId },
    { $set: { "financial.paymentStatus": "pending", lastActivityAt: new Date() }, $push: { activity: {
      type: "payment_recorded", title: "Payment submitted for verification", actorName: input.principal.email,
      actorUserId: new Types.ObjectId(input.principal.id), description: `${workflow.financial.currency} ${input.amount}`,
      relatedResource: input.transactionReference, clientVisible: true, createdAt: new Date(),
    } } },
  ).exec();
  const financeRecipients = workflow.team.flatMap((member) =>
    member.role === "finance_officer" && member.userId
      ? [member.userId.toString()]
      : [],
  );
  await Promise.allSettled(financeRecipients.map((recipientUserId) => createCommunicationNotification({
    recipientUserId,
    type: "action_required",
    title: "Payment submitted for review",
    description: `${workflow.reference} has a ${workflow.financial.currency} ${input.amount.toLocaleString("en-KE")} payment awaiting verification.`,
    relatedModule: "engagements",
    relatedRecordId: workflow._id.toString(),
    actionUrl: `/staff/engagements/${workflow._id.toString()}?tab=finance`,
    createdByUserId: input.principal.id,
  })));
  return payment._id.toString();
}

export async function getClientArchive(principal: Principal): Promise<WorkflowInstanceRecord[]> {
  return listArchivedWorkflowsForPrincipal(principal);
}
