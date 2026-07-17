import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { sendQuotationEmail } from "@/features/quotations/quotation-email";
import { writeAuditLog } from "@/features/audit/audit-service";
import { connectToDatabase } from "@/lib/db/mongoose";
import { clientRecipientName, normalizeRecipientEmail } from "@/lib/client-recipient";
import { AuthorizationError } from "@/lib/errors";
import { EngagementRequestModel } from "@/models/engagement-request";
import { QuotationModel } from "@/models/quotation";
import { UserModel } from "@/models/user";
import { createCommunicationNotification } from "@/repositories/communication-repository";
import {
  getEngagementRequestForAdmin,
  listEngagementRequestsForAdmin,
  type EngagementRequestRecord,
} from "@/repositories/engagement-request-repository";

export type QuotationLineRecord = {
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type QuotationRecord = {
  id: string;
  number: string;
  requestId: string;
  clientUserId: string;
  clientName: string;
  clientEmail: string;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
  currency: string;
  issueDate: string;
  validUntil: string;
  lines: QuotationLineRecord[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  terms: string;
  createdByName: string;
  sentAt: string | null;
  acceptedAt: string | null;
};

type RawQuotation = {
  _id: Types.ObjectId;
  number: string;
  requestId: Types.ObjectId;
  clientUserId: Types.ObjectId;
  clientName: string;
  clientEmail: string;
  status: QuotationRecord["status"];
  currency: string;
  issueDate: Date;
  validUntil: Date;
  lines: Array<{ serviceId?: Types.ObjectId | null; description: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  createdByName: string;
  sentAt?: Date | null;
  acceptedAt?: Date | null;
};

type RawClientRecipient = {
  email: string;
  firstName?: string;
  lastName?: string;
};

function isQuotationManager(principal: Principal) {
  return principal.roleKeys.some((role) => ["admin", "super_admin", "finance_officer"].includes(role));
}

function serialize(quotation: RawQuotation): QuotationRecord {
  return {
    id: quotation._id.toString(),
    number: quotation.number,
    requestId: quotation.requestId.toString(),
    clientUserId: quotation.clientUserId.toString(),
    clientName: quotation.clientName,
    clientEmail: quotation.clientEmail,
    status: quotation.status,
    currency: quotation.currency,
    issueDate: quotation.issueDate.toISOString(),
    validUntil: quotation.validUntil.toISOString(),
    lines: quotation.lines.map((line) => ({
      serviceId: line.serviceId?.toString() ?? null,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
    })),
    subtotal: quotation.subtotal,
    taxRate: quotation.taxRate,
    taxAmount: quotation.taxAmount,
    total: quotation.total,
    notes: quotation.notes ?? "",
    terms: quotation.terms ?? "",
    createdByName: quotation.createdByName,
    sentAt: quotation.sentAt?.toISOString() ?? null,
    acceptedAt: quotation.acceptedAt?.toISOString() ?? null,
  };
}

function extractedPrice(label: string) {
  const numeric = label.replaceAll(",", "").match(/\d+(?:\.\d+)?/);
  return numeric ? Number(numeric[0]) : 0;
}

function numberReference() {
  return `QUO-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function listQuotationRequestsForManager(principal: Principal) {
  if (!isQuotationManager(principal)) throw new AuthorizationError("Quotation access is restricted to administrators and finance staff.");
  const requests = await listEngagementRequestsForAdmin();
  return requests.filter((request) => request.requestType === "quotation");
}

export async function getQuotationEditorData(principal: Principal, requestId: string) {
  if (!isQuotationManager(principal)) throw new AuthorizationError("Quotation access is restricted to administrators and finance staff.");
  const request = await getEngagementRequestForAdmin(requestId);
  if (!request || request.requestType !== "quotation") return null;
  await connectToDatabase();
  const existing = await QuotationModel.findOne({ requestId }).lean().exec();
  return {
    request,
    quotation: existing ? serialize(existing as unknown as RawQuotation) : null,
    suggestedLines: request.items.map((item) => ({
      serviceId: item.serviceId,
      description: item.serviceTitle,
      quantity: item.quantity,
      unitPrice: extractedPrice(item.priceLabel),
      total: extractedPrice(item.priceLabel) * item.quantity,
      sourceLabel: item.priceLabel,
    })),
  };
}

export async function saveAndSendQuotation(input: {
  principal: Principal;
  requestId: string;
  currency: string;
  validDays: number;
  taxRate: number;
  notes: string;
  terms: string;
  lines: Array<{ serviceId: string | null; description: string; quantity: number; unitPrice: number }>;
}) {
  if (!isQuotationManager(input.principal)) throw new AuthorizationError("Quotation access is restricted to administrators and finance staff.");
  if (!Types.ObjectId.isValid(input.requestId) || !Types.ObjectId.isValid(input.principal.id)) return null;
  await connectToDatabase();
  const request = await EngagementRequestModel.findOne({ _id: input.requestId, requestType: "quotation", status: { $nin: ["converted", "rejected"] } }).exec();
  if (!request || input.lines.length === 0) return null;
  const registeredClient = (await UserModel.findOne({
    _id: request.clientUserId,
    roleKeys: { $in: ["client", "client_representative"] },
    status: "active",
  })
    .select("email firstName lastName")
    .lean()
    .exec()) as RawClientRecipient | null;
  if (!registeredClient) return null;
  const recipientEmail = normalizeRecipientEmail(registeredClient.email);
  const recipientName = clientRecipientName(registeredClient, request.clientName);
  const lines = input.lines.map((line) => ({
    serviceId: line.serviceId && Types.ObjectId.isValid(line.serviceId) ? new Types.ObjectId(line.serviceId) : null,
    description: line.description.trim(),
    quantity: Math.max(1, line.quantity),
    unitPrice: Math.max(0, line.unitPrice),
    total: Math.round(Math.max(1, line.quantity) * Math.max(0, line.unitPrice) * 100) / 100,
  })).filter((line) => line.description && line.total >= 0);
  const subtotal = Math.round(lines.reduce((total, line) => total + line.total, 0) * 100) / 100;
  if (subtotal <= 0) return null;
  const taxRate = Math.min(100, Math.max(0, input.taxRate));
  const taxAmount = Math.round(subtotal * taxRate) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  const issueDate = new Date();
  const validUntil = new Date(issueDate.getTime() + Math.min(90, Math.max(1, input.validDays)) * 86_400_000);
  const existing = await QuotationModel.findOne({ requestId: request._id }).lean().exec();
  const quotation = await QuotationModel.findOneAndUpdate(
    { requestId: request._id },
    {
      $set: {
        clientUserId: request.clientUserId,
        clientName: recipientName,
        clientEmail: recipientEmail,
        status: "sent",
        currency: input.currency.trim().toUpperCase().slice(0, 3) || "KES",
        issueDate,
        validUntil,
        lines,
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes: input.notes.trim(),
        terms: input.terms.trim(),
        createdByUserId: new Types.ObjectId(input.principal.id),
        createdByName: input.principal.email,
        sentAt: issueDate,
      },
      $setOnInsert: { number: numberReference() },
    },
    { upsert: true, new: true },
  ).lean().exec();
  if (!quotation) return null;

  request.status = "quotation_sent";
  request.clientName = recipientName;
  request.clientEmail = recipientEmail;
  request.quotationAmount = total;
  request.quotationCurrency = quotation.currency;
  request.reviewedAt = issueDate;
  request.timeline.push({ at: issueDate, title: existing ? "Quotation updated" : "Quotation ready", detail: `${quotation.number} totals ${quotation.currency} ${total.toLocaleString("en-KE")}.`, clientVisible: true });
  await request.save();
  const record = serialize(quotation as unknown as RawQuotation);
  await Promise.all([
    createCommunicationNotification({
      recipientUserId: request.clientUserId.toString(),
      type: "action_required",
      title: `Quotation ${record.number} is ready`,
      description: `${record.currency} ${record.total.toLocaleString("en-KE")} for ${request.items.map((item) => item.serviceTitle).join(", ")}. Review and accept it in your portal.`,
      relatedModule: "engagements",
      relatedRecordId: record.id,
      actionUrl: `/client/quotations/${record.id}`,
      createdByUserId: input.principal.id,
    }),
    sendQuotationEmail({
      quotationId: record.id,
      number: record.number,
      recipientEmail: record.clientEmail,
      recipientName: record.clientName,
      currency: record.currency,
      subtotal: record.subtotal,
      taxRate: record.taxRate,
      taxAmount: record.taxAmount,
      total: record.total,
      validUntil,
      lines: record.lines,
      notes: record.notes,
      terms: record.terms,
    }),
    writeAuditLog({ actor: input.principal, action: existing ? "quotation.updated_and_sent" : "quotation.created_and_sent", resourceType: "Quotation", resourceId: record.id, newValues: { requestId: input.requestId, total, currency: record.currency } }),
  ]);
  return record;
}

export async function getClientQuotation(clientUserId: string, quotationId: string) {
  if (!Types.ObjectId.isValid(clientUserId) || !Types.ObjectId.isValid(quotationId)) return null;
  await connectToDatabase();
  const quotation = await QuotationModel.findOne({ _id: quotationId, clientUserId }).lean().exec();
  return quotation ? serialize(quotation as unknown as RawQuotation) : null;
}

export async function getClientQuotationRequest(clientUserId: string, requestId: string) {
  if (!Types.ObjectId.isValid(clientUserId) || !Types.ObjectId.isValid(requestId)) return null;
  const request = await getEngagementRequestForAdmin(requestId);
  if (!request || request.clientUserId !== clientUserId || request.requestType !== "quotation") return null;
  await connectToDatabase();
  const quotation = await QuotationModel.findOne({ requestId, clientUserId }).lean().exec();
  return { request, quotation: quotation ? serialize(quotation as unknown as RawQuotation) : null };
}

export async function listClientQuotations(clientUserId: string) {
  if (!Types.ObjectId.isValid(clientUserId)) return [];
  await connectToDatabase();
  const quotations = await QuotationModel.find({ clientUserId }).sort({ createdAt: -1 }).lean().exec();
  return (quotations as unknown as RawQuotation[]).map(serialize);
}

export async function acceptQuotationForClientByRequest(requestId: string, principal: Principal) {
  if (!Types.ObjectId.isValid(requestId) || !Types.ObjectId.isValid(principal.id)) return false;
  await connectToDatabase();
  const quotation = await QuotationModel.findOne({ requestId, clientUserId: principal.id, status: "sent", validUntil: { $gte: new Date() } }).exec();
  if (!quotation) return false;
  quotation.status = "accepted";
  quotation.acceptedAt = new Date();
  await quotation.save();
  const request = await EngagementRequestModel.findOne({ _id: requestId, clientUserId: principal.id }).exec();
  if (request) {
    request.status = "approved";
    request.timeline.push({ at: new Date(), title: "Quotation accepted", detail: `${quotation.number} was accepted. The engagement can now be created.`, clientVisible: true });
    await request.save();
  }
  await writeAuditLog({ actor: principal, action: "quotation.accepted", resourceType: "Quotation", resourceId: quotation._id.toString(), newValues: { status: "accepted" } });
  return true;
}

export type QuotationRequestRecord = EngagementRequestRecord;
