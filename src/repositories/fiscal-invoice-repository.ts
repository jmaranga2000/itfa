import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { hasPermission } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { isClientVisibleInvoiceStatus } from "@/features/etims/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getServerEnv } from "@/lib/env";
import { AuthorizationError } from "@/lib/errors";
import { ClientKycSubmissionModel } from "@/models/client-kyc-submission";
import { EtimsOutboxEventModel } from "@/models/etims-outbox-event";
import { EtimsServiceMappingModel } from "@/models/etims-service-mapping";
import { FiscalInvoiceModel } from "@/models/fiscal-invoice";
import { ServiceCatalogModel } from "@/models/service-catalog";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { createCommunicationNotification } from "@/repositories/communication-repository";
import { getEtimsConfiguration } from "@/repositories/etims-configuration-repository";
import { getPlatformSettings } from "@/repositories/platform-settings-repository";

export type FiscalInvoiceLineInput = {
  lineId?: string;
  serviceId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxTypeCode?: string;
  taxRate?: number;
  quantityUnitCode?: string;
};

export type FiscalInvoiceRecord = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  traderInvoiceNumber: string;
  workflowId: string;
  engagementReference: string;
  clientUserId: string;
  clientName: string;
  clientEmail: string;
  clientKraPin: string;
  serviceName: string;
  status: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  paymentTerms: string;
  internalNotes: string;
  lines: Array<{
    lineId: string;
    serviceId: string | null;
    serviceMappingId: string | null;
    description: string;
    quantity: number;
    quantityUnitCode: string;
    unitPrice: number;
    discountAmount: number;
    taxableAmount: number;
    taxTypeCode: string;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  balanceDue: number;
  netAmount: number;
  createdByName: string;
  submittedAt: string | null;
  approvedByName: string;
  approvedAt: string | null;
  lockedAt: string | null;
  returnReason: string;
  rejectionReason: string;
  etims: {
    provider: string;
    environment: string;
    status: string;
    kraInvoiceNumber: string;
    receiptNumber: string;
    controlUnitId: string;
    responseCode: string;
    responseMessage: string;
    requestId: string;
    submittedAt: string | null;
    acceptedAt: string | null;
    rejectedAt: string | null;
    attemptCount: number;
  };
  finalPdfAvailable: boolean;
  portalPublishedAt: string | null;
  emailDeliveryStatus: string;
  emailedTo: string;
  emailSentAt: string | null;
  emailDeliveryError: string;
  adjustmentStatus: string;
  adjustmentNoteId: string | null;
  adjustmentType: string | null;
  migrationStatus: string;
};

type RawFiscalInvoice = {
  _id: Types.ObjectId;
  invoiceId: string;
  invoiceNumber: string;
  traderInvoiceNumber?: string;
  workflowId: Types.ObjectId;
  engagementReference: string;
  clientUserId: Types.ObjectId;
  clientName: string;
  clientEmail: string;
  clientKraPin?: string;
  serviceName: string;
  status: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  paymentTerms?: string;
  internalNotes?: string;
  lines: Array<{
    lineId: string;
    serviceId?: string | null;
    serviceMappingId?: Types.ObjectId | null;
    description: string;
    quantity: number;
    quantityUnitCode: string;
    unitPrice: number;
    discountAmount?: number;
    taxableAmount: number;
    taxTypeCode: string;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  balanceDue: number;
  netAmount: number;
  createdByUserId: Types.ObjectId;
  createdByName: string;
  submittedAt?: Date | null;
  approvedByName?: string;
  approvedAt?: Date | null;
  lockedAt?: Date | null;
  returnReason?: string;
  rejectionReason?: string;
  etims?: {
    provider?: string;
    environment?: string;
    status?: string;
    kraInvoiceNumber?: string;
    receiptNumber?: string;
    controlUnitId?: string;
    responseCode?: string;
    responseMessage?: string;
    requestId?: string;
    submittedAt?: Date | null;
    acceptedAt?: Date | null;
    rejectedAt?: Date | null;
    attemptCount?: number;
  };
  finalPdfStorageKey?: string;
  portalPublishedAt?: Date | null;
  emailDeliveryStatus?: string;
  emailedTo?: string;
  emailSentAt?: Date | null;
  emailDeliveryError?: string;
  adjustmentStatus?: string;
  adjustmentNoteId?: Types.ObjectId | null;
  adjustmentType?: string | null;
  migrationStatus?: string;
};

function serialise(invoice: RawFiscalInvoice): FiscalInvoiceRecord {
  return {
    id: invoice._id.toString(),
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    traderInvoiceNumber: invoice.traderInvoiceNumber ?? "",
    workflowId: invoice.workflowId.toString(),
    engagementReference: invoice.engagementReference,
    clientUserId: invoice.clientUserId.toString(),
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    clientKraPin: invoice.clientKraPin ?? "",
    serviceName: invoice.serviceName,
    status: invoice.status,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    currency: invoice.currency,
    paymentTerms: invoice.paymentTerms ?? "",
    internalNotes: invoice.internalNotes ?? "",
    lines: invoice.lines.map((line) => ({
      lineId: line.lineId,
      serviceId: line.serviceId ?? null,
      serviceMappingId: line.serviceMappingId?.toString() ?? null,
      description: line.description,
      quantity: line.quantity,
      quantityUnitCode: line.quantityUnitCode,
      unitPrice: line.unitPrice,
      discountAmount: line.discountAmount ?? 0,
      taxableAmount: line.taxableAmount,
      taxTypeCode: line.taxTypeCode,
      taxRate: line.taxRate,
      taxAmount: line.taxAmount,
      totalAmount: line.totalAmount,
    })),
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    balanceDue: invoice.balanceDue,
    netAmount: invoice.netAmount,
    createdByName: invoice.createdByName,
    submittedAt: invoice.submittedAt?.toISOString() ?? null,
    approvedByName: invoice.approvedByName ?? "",
    approvedAt: invoice.approvedAt?.toISOString() ?? null,
    lockedAt: invoice.lockedAt?.toISOString() ?? null,
    returnReason: invoice.returnReason ?? "",
    rejectionReason: invoice.rejectionReason ?? "",
    etims: {
      provider: invoice.etims?.provider ?? "",
      environment: invoice.etims?.environment ?? "SANDBOX",
      status: invoice.etims?.status ?? "NOT_SUBMITTED",
      kraInvoiceNumber: invoice.etims?.kraInvoiceNumber ?? "",
      receiptNumber: invoice.etims?.receiptNumber ?? "",
      controlUnitId: invoice.etims?.controlUnitId ?? "",
      responseCode: invoice.etims?.responseCode ?? "",
      responseMessage: invoice.etims?.responseMessage ?? "",
      requestId: invoice.etims?.requestId ?? "",
      submittedAt: invoice.etims?.submittedAt?.toISOString() ?? null,
      acceptedAt: invoice.etims?.acceptedAt?.toISOString() ?? null,
      rejectedAt: invoice.etims?.rejectedAt?.toISOString() ?? null,
      attemptCount: invoice.etims?.attemptCount ?? 0,
    },
    finalPdfAvailable: Boolean(invoice.finalPdfStorageKey),
    portalPublishedAt: invoice.portalPublishedAt?.toISOString() ?? null,
    emailDeliveryStatus: invoice.emailDeliveryStatus ?? "NOT_QUEUED",
    emailedTo: invoice.emailedTo ?? "",
    emailSentAt: invoice.emailSentAt?.toISOString() ?? null,
    emailDeliveryError: invoice.emailDeliveryError ?? "",
    adjustmentStatus: invoice.adjustmentStatus ?? "NONE",
    adjustmentNoteId: invoice.adjustmentNoteId?.toString() ?? null,
    adjustmentType: invoice.adjustmentType ?? null,
    migrationStatus: invoice.migrationStatus ?? "NOT_REQUIRED",
  };
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)]),
  );
}

export function deterministicPayloadHash(snapshot: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(stableValue(snapshot))).digest("hex");
}

async function mappedLines(lines: FiscalInvoiceLineInput[]) {
  const serviceIds = lines
    .map((line) => line.serviceId)
    .filter((value): value is string => Boolean(value && Types.ObjectId.isValid(value)));
  const mappings = await EtimsServiceMappingModel.find({
    serviceId: { $in: serviceIds },
    active: true,
  }).lean().exec();
  const byService = new Map(mappings.map((mapping) => [mapping.serviceId.toString(), mapping]));

  return lines.map((line) => {
    const mapping = line.serviceId ? byService.get(line.serviceId) : undefined;
    const quantity = Math.max(0, line.quantity);
    const unitPrice = Math.max(0, line.unitPrice);
    const discountAmount = Math.max(0, line.discountAmount ?? 0);
    const taxableAmount = roundMoney(Math.max(0, quantity * unitPrice - discountAmount));
    const taxRate = Math.max(0, line.taxRate ?? mapping?.taxRate ?? 0);
    const taxAmount = roundMoney(taxableAmount * taxRate / 100);
    return {
      lineId: line.lineId || randomUUID(),
      serviceId: line.serviceId ?? null,
      serviceMappingId: mapping?._id ?? null,
      description: line.description.trim(),
      quantity,
      quantityUnitCode: line.quantityUnitCode?.trim() || mapping?.quantityUnitCode || "",
      unitPrice: roundMoney(unitPrice),
      discountAmount: roundMoney(discountAmount),
      taxableAmount,
      taxTypeCode: line.taxTypeCode?.trim() || mapping?.taxTypeCode || "",
      taxRate,
      taxAmount,
      totalAmount: roundMoney(taxableAmount + taxAmount),
    };
  });
}

function totals(lines: Awaited<ReturnType<typeof mappedLines>>) {
  const subtotal = roundMoney(lines.reduce((total, line) => total + line.taxableAmount, 0));
  const taxAmount = roundMoney(lines.reduce((total, line) => total + line.taxAmount, 0));
  return { subtotal, taxAmount, totalAmount: roundMoney(subtotal + taxAmount) };
}

async function clientFiscalDetails(clientUserId: string) {
  const [client, kyc] = await Promise.all([
    UserModel.findById(clientUserId).select("email firstName lastName").lean().exec(),
    ClientKycSubmissionModel.findOne({ userId: clientUserId }).select("answers").lean().exec(),
  ]);
  const answers = kyc?.answers instanceof Map
    ? Object.fromEntries(kyc.answers)
    : (kyc?.answers as unknown as Record<string, string> | undefined) ?? {};
  return {
    email: client?.email ?? "",
    name: `${client?.firstName ?? ""} ${client?.lastName ?? ""}`.trim(),
    kraPin: answers.kra_pin ?? answers.tax_pin ?? "",
    address: answers.residential_address ?? answers.business_address ?? "",
  };
}

async function serviceForTitle(serviceName: string) {
  return ServiceCatalogModel.findOne({
    title: { $regex: `^${serviceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    archivedAt: null,
  }).lean().exec();
}

export async function ensureFiscalInvoiceForEmbeddedInvoice(input: {
  principal: Principal;
  workflowId: string;
  engagementReference: string;
  clientUserId: string;
  clientName: string;
  serviceName: string;
  invoiceId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  currency: string;
  notes: string;
}) {
  await connectToDatabase();
  const existing = await FiscalInvoiceModel.findOne({ invoiceId: input.invoiceId }).lean().exec();
  if (existing) return existing._id.toString();
  if (!Types.ObjectId.isValid(input.workflowId) || !Types.ObjectId.isValid(input.clientUserId)
    || !Types.ObjectId.isValid(input.principal.id)) return null;

  const [client, service] = await Promise.all([
    clientFiscalDetails(input.clientUserId),
    serviceForTitle(input.serviceName),
  ]);
  const serviceId = service?._id.toString() ?? null;
  const mapping = serviceId
    ? await EtimsServiceMappingModel.findOne({ serviceId, active: true }).lean().exec()
    : null;
  const taxRate = mapping?.taxRate ?? 0;
  const taxableAmount = roundMoney(input.amount / (1 + taxRate / 100));
  const line = (await mappedLines([{
    serviceId,
    description: input.serviceName,
    quantity: 1,
    unitPrice: taxableAmount,
    taxRate,
  }]))[0];
  if (!line) return null;
  const calculated = totals([line]);
  const created = await FiscalInvoiceModel.create({
    invoiceId: input.invoiceId,
    invoiceNumber: input.invoiceNumber,
    workflowId: new Types.ObjectId(input.workflowId),
    engagementReference: input.engagementReference,
    clientUserId: new Types.ObjectId(input.clientUserId),
    clientName: client.name || input.clientName,
    clientEmail: client.email,
    clientKraPin: client.kraPin,
    clientAddress: client.address,
    serviceId,
    serviceName: input.serviceName,
    status: "PENDING_ADMIN_APPROVAL",
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    currency: input.currency,
    lines: [line],
    ...calculated,
    balanceDue: calculated.totalAmount,
    netAmount: calculated.totalAmount,
    internalNotes: input.notes,
    createdByUserId: new Types.ObjectId(input.principal.id),
    createdByName: input.principal.displayName || input.principal.email,
    submittedAt: new Date(),
  });
  return created._id.toString();
}

export async function createFiscalInvoiceDraft(input: {
  principal: Principal;
  workflowId: string;
  dueDate: Date;
  currency: string;
  paymentTerms: string;
  internalNotes: string;
  lines: FiscalInvoiceLineInput[];
}) {
  if (!hasPermission(input.principal, "invoice.create")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(input.workflowId) || !Types.ObjectId.isValid(input.principal.id)) return null;
  await connectToDatabase();
  const workflow = await WorkflowInstanceModel.findOne({
    _id: input.workflowId,
    status: "active",
    archivedAt: null,
  }).lean().exec();
  if (!workflow?.clientUserId || input.lines.length === 0) return null;
  const [client, service] = await Promise.all([
    clientFiscalDetails(workflow.clientUserId.toString()),
    serviceForTitle(workflow.serviceName),
  ]);
  const lines = await mappedLines(input.lines.map((line) => ({
    ...line,
    serviceId: line.serviceId ?? service?._id.toString() ?? null,
  })));
  if (lines.some((line) => !line.description || line.quantity <= 0)) return null;
  const calculated = totals(lines);
  if (calculated.totalAmount <= 0) return null;
  const now = new Date();
  const invoiceNumber = `INV-${now.getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
  const invoice = await FiscalInvoiceModel.create({
    invoiceId: randomUUID(),
    invoiceNumber,
    workflowId: workflow._id,
    engagementReference: workflow.reference,
    clientUserId: workflow.clientUserId,
    clientName: client.name || workflow.clientName,
    clientEmail: client.email,
    clientKraPin: client.kraPin,
    clientAddress: client.address,
    serviceId: service?._id.toString() ?? null,
    serviceName: workflow.serviceName,
    status: "DRAFT",
    issueDate: now,
    dueDate: input.dueDate,
    currency: input.currency,
    paymentTerms: input.paymentTerms,
    internalNotes: input.internalNotes,
    lines,
    ...calculated,
    balanceDue: calculated.totalAmount,
    netAmount: calculated.totalAmount,
    createdByUserId: new Types.ObjectId(input.principal.id),
    createdByName: input.principal.displayName || input.principal.email,
  });
  await writeAuditLog({
    actor: input.principal,
    action: "invoice.created",
    resourceType: "FiscalInvoice",
    resourceId: invoice._id.toString(),
    newValues: { invoiceNumber, workflowId: input.workflowId, totalAmount: calculated.totalAmount },
  });
  return invoice._id.toString();
}

export async function updateFiscalInvoiceDraft(input: {
  actor: Principal;
  invoiceId: string;
  dueDate: Date;
  paymentTerms: string;
  internalNotes: string;
  lines: FiscalInvoiceLineInput[];
}) {
  if (!hasPermission(input.actor, "invoice.edit")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(input.invoiceId) || input.lines.length === 0) return false;
  await connectToDatabase();
  const invoice = await FiscalInvoiceModel.findOne({
    _id: input.invoiceId,
    createdByUserId: input.actor.id,
    status: { $in: ["DRAFT", "RETURNED_FOR_CORRECTION"] },
    lockedAt: null,
    archivedAt: null,
  }).lean().exec() as unknown as RawFiscalInvoice | null;
  if (!invoice) return false;
  const existingById = new Map(invoice.lines.map((line) => [line.lineId, line]));
  const safeInputs = input.lines.flatMap((line) => {
    const existing = line.lineId ? existingById.get(line.lineId) : undefined;
    return existing ? [{ ...line, serviceId: existing.serviceId ?? null, description: existing.description }] : [];
  });
  const lines = await mappedLines(safeInputs);
  if (!lines.length || lines.some((line) => !line.description || line.quantity <= 0 || line.unitPrice < 0)) return false;
  const calculated = totals(lines);
  if (calculated.totalAmount <= 0) return false;
  const result = await FiscalInvoiceModel.updateOne(
    { _id: invoice._id, status: { $in: ["DRAFT", "RETURNED_FOR_CORRECTION"] }, lockedAt: null },
    {
      $set: {
        dueDate: input.dueDate,
        paymentTerms: input.paymentTerms.trim(),
        internalNotes: input.internalNotes.trim(),
        lines,
        ...calculated,
        balanceDue: calculated.totalAmount,
        netAmount: calculated.totalAmount,
        returnReason: "",
      },
    },
  ).exec();
  if (result.modifiedCount !== 1) return false;
  await WorkflowInstanceModel.updateOne(
    { _id: invoice.workflowId, "financial.invoices.invoiceId": invoice.invoiceId },
    {
      $set: {
        "financial.invoices.$[item].dueDate": input.dueDate,
        "financial.invoices.$[item].amount": calculated.totalAmount,
        "financial.invoices.$[item].notes": input.internalNotes.trim(),
        "financial.invoices.$[item].status": "draft",
        "financial.invoiceStatus": "draft",
        "financial.balanceDue": calculated.totalAmount,
        nextAction: `Finance must resubmit ${invoice.invoiceNumber} for approval`,
      },
    },
    { arrayFilters: [{ "item.invoiceId": invoice.invoiceId }] },
  ).exec();
  await writeAuditLog({
    actor: input.actor,
    action: "invoice.draft_updated",
    resourceType: "FiscalInvoice",
    resourceId: invoice._id.toString(),
    newValues: { dueDate: input.dueDate, totalAmount: calculated.totalAmount, lineCount: lines.length },
  });
  return true;
}
export async function submitFiscalInvoiceForApproval(actor: Principal, invoiceId: string) {
  if (!hasPermission(actor, "invoice.submit_for_approval")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(invoiceId)) return false;
  await connectToDatabase();
  const now = new Date();
  const invoice = await FiscalInvoiceModel.findOneAndUpdate(
    {
      _id: invoiceId,
      createdByUserId: actor.id,
      status: { $in: ["DRAFT", "RETURNED_FOR_CORRECTION"] },
      archivedAt: null,
    },
    {
      $set: {
        status: "PENDING_ADMIN_APPROVAL",
        submittedAt: now,
        returnReason: "",
      },
    },
    { returnDocument: "after" },
  ).lean().exec() as unknown as RawFiscalInvoice | null;
  if (!invoice) return false;
  await WorkflowInstanceModel.updateOne(
    { _id: invoice.workflowId, "financial.invoices.invoiceId": invoice.invoiceId },
    {
      $set: {
        "financial.invoices.$[item].status": "pending_approval",
        "financial.invoiceStatus": "pending_approval",
        nextAction: `Administrator approval required for ${invoice.invoiceNumber}`,
        lastActivityAt: now,
      },
    },
    { arrayFilters: [{ "item.invoiceId": invoice.invoiceId }] },
  ).exec();
  await writeAuditLog({
    actor,
    action: "invoice.submitted",
    resourceType: "FiscalInvoice",
    resourceId: invoiceId,
    newValues: { status: "PENDING_ADMIN_APPROVAL", submittedAt: now },
  });
  return true;
}

async function notifyInvoiceCreator(
  actor: Principal,
  invoice: RawFiscalInvoice,
  title: string,
  description: string,
) {
  await createCommunicationNotification({
    recipientUserId: invoice.createdByUserId.toString(),
    type: "engagement_update",
    title,
    description,
    relatedModule: "invoices",
    relatedRecordId: invoice._id.toString(),
    actionUrl: `/staff/invoices?invoice=${invoice._id.toString()}`,
    createdByUserId: actor.id,
  });
}

export async function returnFiscalInvoiceForCorrection(actor: Principal, invoiceId: string, reason: string) {
  if (!hasPermission(actor, "invoice.return_for_correction")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(invoiceId) || !reason.trim()) return false;
  await connectToDatabase();
  const invoice = await FiscalInvoiceModel.findOneAndUpdate(
    { _id: invoiceId, status: "PENDING_ADMIN_APPROVAL", archivedAt: null },
    {
      $set: {
        status: "RETURNED_FOR_CORRECTION",
        returnedAt: new Date(),
        returnedByUserId: actor.id,
        returnReason: reason.trim(),
      },
    },
    { returnDocument: "after" },
  ).lean().exec() as unknown as RawFiscalInvoice | null;
  if (!invoice) return false;
  await WorkflowInstanceModel.updateOne(
    { _id: invoice.workflowId, "financial.invoices.invoiceId": invoice.invoiceId },
    { $set: { "financial.invoices.$[item].status": "returned_for_correction", "financial.invoiceStatus": "returned_for_correction", nextAction: `Finance must correct ${invoice.invoiceNumber}` } },
    { arrayFilters: [{ "item.invoiceId": invoice.invoiceId }] },
  ).exec();
  await notifyInvoiceCreator(actor, invoice, "Invoice returned for correction", reason.trim());
  await writeAuditLog({
    actor,
    action: "invoice.returned",
    resourceType: "FiscalInvoice",
    resourceId: invoiceId,
    reason,
    newValues: { status: "RETURNED_FOR_CORRECTION" },
  });
  return true;
}

export async function rejectFiscalInvoice(actor: Principal, invoiceId: string, reason: string) {
  if (!hasPermission(actor, "invoice.reject")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(invoiceId) || !reason.trim()) return false;
  await connectToDatabase();
  const invoice = await FiscalInvoiceModel.findOneAndUpdate(
    { _id: invoiceId, status: "PENDING_ADMIN_APPROVAL", archivedAt: null },
    {
      $set: {
        status: "ADMIN_REJECTED",
        rejectedAt: new Date(),
        rejectedByUserId: actor.id,
        rejectionReason: reason.trim(),
      },
    },
    { returnDocument: "after" },
  ).lean().exec() as unknown as RawFiscalInvoice | null;
  if (!invoice) return false;
  await WorkflowInstanceModel.updateOne(
    { _id: invoice.workflowId, "financial.invoices.invoiceId": invoice.invoiceId },
    { $set: { "financial.invoices.$[item].status": "admin_rejected", "financial.invoiceStatus": "admin_rejected", nextAction: `Finance must prepare a new invoice for ${invoice.engagementReference}` } },
    { arrayFilters: [{ "item.invoiceId": invoice.invoiceId }] },
  ).exec();
  await notifyInvoiceCreator(actor, invoice, "Invoice rejected", reason.trim());
  await writeAuditLog({
    actor,
    action: "invoice.rejected",
    resourceType: "FiscalInvoice",
    resourceId: invoiceId,
    reason,
    newValues: { status: "ADMIN_REJECTED" },
  });
  return true;
}

function invoiceSnapshot(
  invoice: RawFiscalInvoice,
  configuration: Awaited<ReturnType<typeof getEtimsConfiguration>>,
  actor: Principal,
  settings: Awaited<ReturnType<typeof getPlatformSettings>>,
  approvalStampId: string,
  approvedAt: Date,
) {
  return {
    internalInvoiceId: invoice._id.toString(),
    internalInvoiceNumber: invoice.invoiceNumber,
    traderInvoiceNumber: invoice.invoiceNumber,
    clientId: invoice.clientUserId.toString(),
    clientLegalName: invoice.clientName,
    clientKraPin: invoice.clientKraPin,
    engagementId: invoice.workflowId.toString(),
    engagementReference: invoice.engagementReference,
    invoiceDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    currency: invoice.currency,
    paymentMethod: configuration.defaultPaymentType,
    paymentTerms: invoice.paymentTerms,
    lines: invoice.lines,
    subtotal: invoice.subtotal,
    totalTax: invoice.taxAmount,
    grossTotal: invoice.totalAmount,
    taxpayerPin: configuration.taxpayerPin,
    branchId: configuration.branchId,
    deviceId: configuration.deviceId,
    seller: {
      legalName: settings.company.legalName,
      tradingName: settings.company.tradingName,
      registrationNumber: settings.company.registrationNumber,
      kraPin: settings.company.kraPin || configuration.taxpayerPin,
      address: [settings.company.address, settings.company.city, settings.company.country].filter(Boolean).join(", "),
      email: settings.company.email,
      phone: settings.company.phone,
      website: settings.company.website,
    },
    approverId: actor.id,
    approverName: actor.displayName || actor.email,
    approvalStampId,
    approvedAt: approvedAt.toISOString(),
    payloadVersion: 1,
  };
}

async function validateInvoiceForApproval(invoice: RawFiscalInvoice) {
  const errors: string[] = [];
  const configuration = await getEtimsConfiguration();
  if (!configuration.readiness.ready) errors.push(...configuration.readiness.missing);
  if (!invoice.clientEmail) errors.push("The client email is missing.");
  if (!invoice.lines.length) errors.push("At least one invoice line is required.");
  if (invoice.totalAmount <= 0) errors.push("The invoice total must be greater than zero.");
  const mappings = await EtimsServiceMappingModel.find({
    _id: { $in: invoice.lines.flatMap((line) => line.serviceMappingId ? [line.serviceMappingId] : []) },
    active: true,
  }).lean().exec();
  const byId = new Map(mappings.map((mapping) => [mapping._id.toString(), mapping]));
  for (const line of invoice.lines) {
    if (!line.serviceMappingId) {
      errors.push(`The service mapping for "${line.description}" is missing.`);
      continue;
    }
    const mapping = byId.get(line.serviceMappingId.toString());
    if (!mapping) errors.push(`The service mapping for "${line.description}" is inactive.`);
    else {
      if (mapping.taxRate !== line.taxRate) errors.push(`The tax rate for "${line.description}" does not match its mapping.`);
      if (mapping.taxTypeCode !== line.taxTypeCode) errors.push(`The tax code for "${line.description}" does not match its mapping.`);
      if (!mapping.quantityUnitCode) errors.push(`The quantity unit for "${line.description}" is invalid.`);
    }
  }
  return { configuration, errors };
}

export async function approveFiscalInvoice(actor: Principal, invoiceId: string) {
  if (!hasPermission(actor, "invoice.approve")) throw new AuthorizationError();
  if (!Types.ObjectId.isValid(invoiceId) || !Types.ObjectId.isValid(actor.id)) {
    return { ok: false as const, reason: "not_found", errors: [] as string[] };
  }
  const database = await connectToDatabase();
  const invoice = await FiscalInvoiceModel.findOne({
    _id: invoiceId,
    status: "PENDING_ADMIN_APPROVAL",
    archivedAt: null,
  }).lean().exec() as unknown as RawFiscalInvoice | null;
  if (!invoice) return { ok: false as const, reason: "not_pending", errors: [] as string[] };
  if (invoice.createdByUserId.toString() === actor.id) {
    return { ok: false as const, reason: "maker_checker", errors: ["The invoice creator cannot approve the same invoice."] };
  }
  const validation = await validateInvoiceForApproval(invoice);
  if (validation.errors.length) {
    return { ok: false as const, reason: "validation", errors: validation.errors };
  }
  const now = new Date();
  const signingKey = getServerEnv().ENCRYPTION_KEY?.trim();
  if (!signingKey) return { ok: false as const, reason: "validation", errors: ["The invoice approval signing key is missing."] };
  const stampPayload = `${invoice._id.toString()}:${invoice.invoiceNumber}:${actor.id}:${now.toISOString()}`;
  const approvalStampId = `IFTA-${now.getUTCFullYear()}-${createHmac("sha256", signingKey).update(stampPayload).digest("hex").slice(0, 16).toUpperCase()}`;
  const settings = await getPlatformSettings();
  const snapshot = invoiceSnapshot(invoice, validation.configuration, actor, settings, approvalStampId, now);
  const payloadHash = deterministicPayloadHash(snapshot);
  const idempotencyKey = createHash("sha256")
    .update(`invoice:${invoice._id.toString()}:${invoice.invoiceNumber}:${payloadHash}`)
    .digest("hex");
  const approverName = actor.displayName || actor.email;

  const session = await database.startSession();
  let queued = false;
  try {
    await session.withTransaction(async () => {
      const update = await FiscalInvoiceModel.updateOne(
        { _id: invoice._id, status: "PENDING_ADMIN_APPROVAL", lockedAt: null },
        {
          $set: {
            status: "ETIMS_QUEUED",
            approvedAt: now,
            approvedByUserId: actor.id,
            approvedByName: approverName,
            approvalStampId,
            lockedAt: now,
            snapshot,
            payloadVersion: 1,
            payloadHash,
            traderInvoiceNumber: invoice.invoiceNumber,
            "etims.provider": validation.configuration.providerName,
            "etims.environment": validation.configuration.environment,
            "etims.status": "QUEUED",
            "etims.idempotencyKey": idempotencyKey,
            "etims.payloadHash": payloadHash,
          },
        },
        { session },
      ).exec();
      if (update.modifiedCount !== 1) return;
      await EtimsOutboxEventModel.create([{
        aggregateType: "INVOICE",
        aggregateId: invoice._id,
        eventType: "SUBMIT_SALE",
        status: "PENDING",
        idempotencyKey,
        payloadHash,
        payloadVersion: 1,
        maxAttempts: validation.configuration.maxAttempts,
        nextAttemptAt: now,
      }], { session });
      queued = true;
    });
  } finally {
    await session.endSession();
  }
  if (!queued) return { ok: false as const, reason: "conflict", errors: [] as string[] };
  await WorkflowInstanceModel.updateOne(
    { _id: invoice.workflowId, "financial.invoices.invoiceId": invoice.invoiceId },
    {
      $set: {
        "financial.invoices.$[item].status": "pending_etims_submission",
        "financial.invoices.$[item].approvedByUserId": actor.id,
        "financial.invoices.$[item].approvedByName": approverName,
        "financial.invoices.$[item].approvedAt": now,
        "financial.invoices.$[item].approvalStampId": approvalStampId,
        "financial.invoiceStatus": "pending_etims_submission",
        nextAction: "Waiting for KRA eTIMS acceptance",
        lastActivityAt: now,
      },
      $push: {
        activity: {
          type: "invoice_issued",
          title: "Invoice approved internally",
          actorName: approverName,
          actorUserId: actor.id,
          description: `${invoice.invoiceNumber} is locked and queued for eTIMS. It is not yet visible to the client.`,
          relatedResource: invoice.invoiceId,
          clientVisible: false,
          createdAt: now,
        },
      },
    },
    { arrayFilters: [{ "item.invoiceId": invoice.invoiceId }] },
  ).exec();
  await notifyInvoiceCreator(
    actor,
    invoice,
    "Invoice approved internally",
    `${invoice.invoiceNumber} is locked and waiting for KRA eTIMS acceptance.`,
  );
  await writeAuditLog({
    actor,
    action: "invoice.approved_and_etims_queued",
    resourceType: "FiscalInvoice",
    resourceId: invoice._id.toString(),
    previousValues: { status: "PENDING_ADMIN_APPROVAL" },
    newValues: {
      status: "ETIMS_QUEUED",
      payloadHash,
      idempotencyKey,
      approvalStampId,
    },
  });
  return { ok: true as const, invoiceId: invoice._id.toString() };
}

function accessFilter(principal: Principal): Record<string, unknown> {
  if (principal.roleKeys.some((role) => role === "admin" || role === "super_admin")) {
    return { archivedAt: null };
  }
  if (principal.roleKeys.includes("finance_officer")) {
    return {
      archivedAt: null,
      $or: [
        { createdByUserId: principal.id },
        { workflowId: { $in: principal.assignedEngagementIds ?? [] } },
      ],
    };
  }
  return {
    clientUserId: principal.id,
    archivedAt: null,
    status: { $in: ["ETIMS_ACCEPTED", "DELIVERY_QUEUED", "PARTIALLY_DELIVERED", "DELIVERED"] },
    "etims.status": "ACCEPTED",
    portalPublishedAt: { $ne: null },
  };
}

export async function listFiscalInvoices(principal: Principal) {
  await connectToDatabase();
  const records = await FiscalInvoiceModel.find(accessFilter(principal) as never)
    .sort({ issueDate: -1, createdAt: -1 })
    .limit(200)
    .lean()
    .exec();
  return (records as unknown as RawFiscalInvoice[]).map(serialise);
}

export async function getFiscalInvoice(principal: Principal, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const record = await FiscalInvoiceModel.findOne({ _id: id, ...accessFilter(principal) } as never).lean().exec();
  return record ? serialise(record as unknown as RawFiscalInvoice) : null;
}

export async function getClientFiscalInvoiceByWorkflow(principal: Principal, workflowId: string) {
  if (!Types.ObjectId.isValid(workflowId)) return null;
  await connectToDatabase();
  const record = await FiscalInvoiceModel.findOne({
    workflowId,
    clientUserId: principal.id,
    archivedAt: null,
    "etims.status": "ACCEPTED",
    portalPublishedAt: { $ne: null },
    status: { $in: ["ETIMS_ACCEPTED", "DELIVERY_QUEUED", "PARTIALLY_DELIVERED", "DELIVERED"] },
  }).sort({ issueDate: -1 }).lean().exec();
  return record ? serialise(record as unknown as RawFiscalInvoice) : null;
}

export async function getFiscalInvoiceIdByEmbeddedInvoiceId(invoiceId: string) {
  if (!invoiceId.trim()) return null;
  await connectToDatabase();
  const record = await FiscalInvoiceModel.findOne({ invoiceId: invoiceId.trim(), archivedAt: null })
    .select("_id")
    .lean()
    .exec();
  return record?._id.toString() ?? null;
}

export async function getFiscalInvoiceForWorker(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  return FiscalInvoiceModel.findById(id).lean().exec() as unknown as RawFiscalInvoice | null;
}

export function fiscalInvoiceClientVisible(invoice: Pick<RawFiscalInvoice, "status" | "etims" | "portalPublishedAt">) {
  return isClientVisibleInvoiceStatus(invoice.status)
    && invoice.etims?.status === "ACCEPTED"
    && Boolean(invoice.portalPublishedAt);
}
export async function migrateLegacyFiscalInvoices(actor: Principal) {
  if (!hasPermission(actor, "etims.config.update")) throw new AuthorizationError();
  await connectToDatabase();
  type LegacyInvoice = {
    invoiceId: string;
    invoiceNumber: string;
    issueDate?: Date | null;
    dueDate?: Date | null;
    amount: number;
    currency: string;
    status: string;
    notes?: string;
    createdByUserId?: Types.ObjectId | null;
    createdByName?: string;
  };
  type LegacyWorkflow = {
    _id: Types.ObjectId;
    reference: string;
    clientUserId?: Types.ObjectId | null;
    clientName: string;
    serviceName: string;
    financial?: { invoices?: LegacyInvoice[] };
  };
  const workflows = await WorkflowInstanceModel.find({
    "financial.invoices.0": { $exists: true },
  }).select("reference clientUserId clientName serviceName financial.invoices").lean().exec() as unknown as LegacyWorkflow[];
  const result = { created: 0, skipped: 0, reviewRequired: 0, failed: 0 };
  for (const workflow of workflows) {
    if (!workflow.clientUserId) {
      result.failed += workflow.financial?.invoices?.length ?? 0;
      continue;
    }
    for (const legacy of workflow.financial?.invoices ?? []) {
      if (!legacy.invoiceId || await FiscalInvoiceModel.exists({ invoiceId: legacy.invoiceId })) {
        result.skipped += 1;
        continue;
      }
      const creatorId = legacy.createdByUserId?.toString();
      if (!creatorId || !Types.ObjectId.isValid(creatorId)) {
        result.failed += 1;
        continue;
      }
      const fiscalId = await ensureFiscalInvoiceForEmbeddedInvoice({
        principal: { ...actor, id: creatorId, displayName: legacy.createdByName || "Legacy finance record" },
        workflowId: workflow._id.toString(),
        engagementReference: workflow.reference,
        clientUserId: workflow.clientUserId.toString(),
        clientName: workflow.clientName,
        serviceName: workflow.serviceName,
        invoiceId: legacy.invoiceId,
        invoiceNumber: legacy.invoiceNumber,
        issueDate: legacy.issueDate ?? new Date(),
        dueDate: legacy.dueDate ?? legacy.issueDate ?? new Date(),
        amount: legacy.amount,
        currency: legacy.currency,
        notes: legacy.notes ?? "Imported from the legacy engagement invoice record.",
      });
      if (!fiscalId) {
        result.failed += 1;
        continue;
      }
      const historicalEtims = ["pending_etims_submission", "etims_accepted", "etims_rejected"].includes(legacy.status);
      const historicalIssued = ["issued", "partially_paid", "paid", "overdue"].includes(legacy.status);
      const status = legacy.status === "draft"
        ? "DRAFT"
        : legacy.status === "pending_approval" || legacy.status === "approved"
          ? "PENDING_ADMIN_APPROVAL"
          : historicalEtims
            ? "ETIMS_RECONCILIATION_REQUIRED"
            : historicalIssued
              ? "DELIVERED"
              : "DRAFT";
      await FiscalInvoiceModel.updateOne(
        { _id: fiscalId },
        {
          $set: {
            status,
            migrationStatus: historicalEtims ? "REVIEW_REQUIRED" : historicalIssued ? "EXCLUDED" : "COMPLETED",
            "etims.status": historicalEtims ? "RECONCILIATION_REQUIRED" : "NOT_SUBMITTED",
            "etims.responseMessage": historicalEtims
              ? "Imported legacy eTIMS state. Reconcile manually; do not retransmit automatically."
              : historicalIssued
                ? "Historical non-fiscal invoice retained without eTIMS retransmission."
                : "",
          },
        },
      ).exec();
      result.created += 1;
      if (historicalEtims) result.reviewRequired += 1;
    }
  }
  await writeAuditLog({
    actor,
    action: "etims.legacy_invoices_classified",
    resourceType: "FiscalInvoice",
    resourceId: "migration",
    newValues: result,
  });
  return result;
}
export async function getFiscalInvoicePdfAccess(principal: Principal, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const record = await FiscalInvoiceModel.findOne({
    _id: id,
    ...accessFilter(principal),
    finalPdfStorageKey: { $ne: "" },
    "etims.status": "ACCEPTED",
  } as never).select("finalPdfStorageKey finalPdfFileName").lean().exec();
  if (!record?.finalPdfStorageKey) return null;
  return {
    storageKey: record.finalPdfStorageKey,
    fileName: record.finalPdfFileName || "fiscal-invoice.pdf",
  };
}