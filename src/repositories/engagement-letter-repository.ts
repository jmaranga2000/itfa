import { createHash, randomBytes } from "node:crypto";
import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { connectToDatabase } from "@/lib/db/mongoose";
import { EngagementLetterModel } from "@/models/engagement-letter";
import { EngagementRequestModel } from "@/models/engagement-request";
import { TemplateModel } from "@/models/template";
import { TemplateVersionModel } from "@/models/template-version";
import { UserModel } from "@/models/user";
import { createCommunicationNotification } from "@/repositories/communication-repository";
import { getPlatformSettings } from "@/repositories/platform-settings-repository";

export type EngagementLetterSignerRecord = {
  id: string;
  role: "ifta" | "client";
  name: string;
  email: string;
  title: string;
  required: boolean;
  status: "pending" | "signed";
  signatureText: string | null;
  signedAt: string | null;
  signatureHash: string | null;
};

export type EngagementLetterRecord = {
  id: string;
  reference: string;
  requestId: string;
  requestReference: string;
  workflowId: string | null;
  clientUserId: string;
  clientName: string;
  clientEmail: string;
  serviceNames: string[];
  scopeItems: string[];
  fee: number | null;
  currency: string;
  paymentTerms: string;
  governingLaw: string;
  disputeResolution: string;
  subject: string;
  content: string;
  contentHash: string;
  company: {
    tradingName: string;
    legalName: string;
    registrationNumber: string;
    kraPin: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    city: string;
    country: string;
  };
  templateVersion: number | null;
  version: number;
  status: "draft" | "awaiting_signatures" | "partially_signed" | "completed" | "void";
  signers: EngagementLetterSignerRecord[];
  generatedAt: string;
  expiresAt: string;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type RawLetter = {
  _id: Types.ObjectId;
  reference: string;
  requestId: Types.ObjectId;
  requestReference: string;
  workflowId?: Types.ObjectId | null;
  clientUserId: Types.ObjectId;
  clientName: string;
  clientEmail: string;
  serviceNames?: string[];
  scopeItems?: string[];
  fee?: number | null;
  currency: string;
  paymentTerms: string;
  governingLaw: string;
  disputeResolution: string;
  subject: string;
  content: string;
  contentHash: string;
  companySnapshot?: EngagementLetterRecord["company"];
  templateVersion?: number | null;
  version?: number;
  status: EngagementLetterRecord["status"];
  signers?: Array<{
    _id?: Types.ObjectId;
    role: "ifta" | "client";
    name: string;
    email?: string;
    title?: string;
    required?: boolean;
    status: "pending" | "signed";
    signatureText?: string | null;
    signedAt?: Date | null;
    signatureHash?: string | null;
  }>;
  generatedAt: Date;
  expiresAt: Date;
  sentAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function serialize(record: RawLetter): EngagementLetterRecord {
  return {
    id: record._id.toString(),
    reference: record.reference,
    requestId: record.requestId.toString(),
    requestReference: record.requestReference,
    workflowId: record.workflowId?.toString() ?? null,
    clientUserId: record.clientUserId.toString(),
    clientName: record.clientName,
    clientEmail: record.clientEmail,
    serviceNames: record.serviceNames ?? [],
    scopeItems: record.scopeItems ?? [],
    fee: record.fee ?? null,
    currency: record.currency,
    paymentTerms: record.paymentTerms,
    governingLaw: record.governingLaw,
    disputeResolution: record.disputeResolution,
    subject: record.subject,
    content: record.content,
    contentHash: record.contentHash,
    company: record.companySnapshot ?? {
      tradingName: "IFTA Consulting",
      legalName: "IFTA Consulting",
      registrationNumber: "",
      kraPin: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "Nairobi",
      country: "Kenya",
    },
    templateVersion: record.templateVersion ?? null,
    version: record.version ?? 1,
    status: record.status,
    signers: (record.signers ?? []).map((signer) => ({
      id: signer._id?.toString() ?? signer.role,
      role: signer.role,
      name: signer.name,
      email: signer.email ?? "",
      title: signer.title ?? "",
      required: signer.required ?? true,
      status: signer.status,
      signatureText: signer.signatureText ?? null,
      signedAt: signer.signedAt?.toISOString() ?? null,
      signatureHash: signer.signatureHash ?? null,
    })),
    generatedAt: record.generatedAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
    sentAt: record.sentAt?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 86_400_000);
}

function feeLabel(currency: string, fee: number | null) {
  if (fee === null) return "To be agreed in writing before chargeable work begins";
  return `${currency} ${fee.toLocaleString("en-KE")}`;
}

function replaceVariables(content: string, variables: Record<string, string>) {
  return content.replace(/{{\s*([A-Za-z0-9_]+)\s*}}/g, (_match, key: string) => (
    variables[key] ?? `[${key}]`
  ));
}

function fallbackLetterContent() {
  return `# Letter of Engagement

Date: {{letterDate}}
Reference: {{engagementNumber}}

## Parties
This letter records the engagement between {{companyLegalName}} ("IFTA") and {{clientName}} ("the Client").

## Purpose
IFTA will provide {{serviceName}} services to the Client.

## Scope of services
{{scopeOfWork}}

## Professional fees
The agreed fee is {{currency}} {{engagementFee}}. {{paymentTerms}}

## Client responsibilities
The Client will provide timely, complete and accurate information and will review requests and deliverables through the client portal.

## Confidentiality and data handling
Each party will protect confidential information and use it only for this engagement, subject to applicable law and professional obligations.

## Governing law
This engagement is governed by {{governingLaw}}.

## Dispute resolution
{{disputeResolution}}

## Acceptance
The parties confirm acceptance using the electronic signature controls attached to this letter.`;
}

async function publishedLetterTemplate() {
  const template = await TemplateModel.findOne({
    category: "engagement_letter",
    status: "published",
    archivedAt: null,
  }).sort({ publishedAt: -1, updatedAt: -1 }).lean().exec();
  if (!template) return null;
  const versionNumber = template.publishedVersionNumber ?? template.currentVersionNumber;
  const version = await TemplateVersionModel.findOne({
    templateId: template._id,
    versionNumber,
    status: "published",
  }).lean().exec();
  return version ? { template, version } : null;
}

export async function ensureEngagementLetterForRequest(requestId: string, actor: Principal) {
  if (!Types.ObjectId.isValid(requestId)) return null;
  await connectToDatabase();
  const existing = await EngagementLetterModel.findOne({ requestId, status: { $ne: "void" } }).lean().exec();
  if (existing) return { letter: serialize(existing as unknown as RawLetter), created: false };

  const [request, settings, templateResult] = await Promise.all([
    EngagementRequestModel.findOne({
      _id: requestId,
      status: { $in: ["admin_review", "approved", "quotation_sent"] },
      kycApprovedAt: { $ne: null },
    }).exec(),
    getPlatformSettings(),
    publishedLetterTemplate(),
  ]);
  if (!request) return null;

  const now = new Date();
  const serviceNames = request.items.map((item) => item.serviceTitle);
  const scopeItems = request.items.map((item) => item.serviceSummary?.trim() || item.serviceTitle);
  const fee = request.quotationAmount ?? null;
  const currency = request.quotationCurrency || settings.engagement.defaultCurrency;
  const variables = {
    letterDate: new Intl.DateTimeFormat("en-KE", { dateStyle: "long", timeZone: settings.portal.timezone }).format(now),
    clientName: request.clientName,
    clientEmail: request.clientEmail,
    engagementNumber: request.reference,
    serviceName: serviceNames.join(", "),
    scopeOfWork: scopeItems.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    currency,
    engagementFee: fee === null ? "To be agreed" : fee.toLocaleString("en-KE"),
    paymentTerms: settings.engagement.paymentTerms,
    governingLaw: settings.engagement.governingLaw,
    disputeResolution: settings.engagement.disputeResolution,
    engagementManager: settings.engagement.signatoryName,
    companyName: settings.company.tradingName,
    companyLegalName: settings.company.legalName,
    companyRegistrationNumber: settings.company.registrationNumber,
    companyKraPin: settings.company.kraPin,
    companyAddress: [settings.company.address, settings.company.city, settings.company.country].filter(Boolean).join(", "),
  };
  const sourceContent = templateResult?.version.content || fallbackLetterContent();
  const content = replaceVariables(sourceContent, variables);
  const generated = await EngagementLetterModel.create({
    reference: `EL-${now.getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`,
    requestId: request._id,
    requestReference: request.reference,
    clientUserId: request.clientUserId,
    clientName: request.clientName,
    clientEmail: request.clientEmail,
    serviceNames,
    scopeItems,
    fee,
    currency,
    paymentTerms: settings.engagement.paymentTerms,
    governingLaw: settings.engagement.governingLaw,
    disputeResolution: settings.engagement.disputeResolution,
    subject: `Letter of engagement for ${serviceNames.join(", ")}`,
    content,
    contentHash: hash(content),
    companySnapshot: settings.company,
    templateId: templateResult?.template._id ?? null,
    templateVersion: templateResult?.version.versionNumber ?? null,
    status: "draft",
    signers: [
      {
        role: "ifta",
        name: settings.engagement.signatoryName,
        email: settings.company.email || settings.portal.supportEmail,
        title: settings.engagement.signatoryTitle,
        required: settings.engagement.requireInternalSignature,
      },
      {
        role: "client",
        name: request.clientName,
        email: request.clientEmail,
        title: "Client authorized signatory",
        required: true,
      },
    ],
    generatedByUserId: Types.ObjectId.isValid(actor.id) ? new Types.ObjectId(actor.id) : null,
    generatedAt: now,
    expiresAt: addDays(now, settings.engagement.letterValidityDays),
  });
  request.engagementLetterId = generated._id;
  request.timeline.push({
    at: now,
    title: "Engagement letter prepared",
    detail: `${generated.reference} was generated from the approved letter template.`,
    clientVisible: true,
  });
  await request.save();
  await writeAuditLog({
    actor,
    action: "engagement_letter.generated",
    resourceType: "EngagementLetter",
    resourceId: generated._id.toString(),
    newValues: {
      reference: generated.reference,
      requestId,
      templateVersion: generated.templateVersion,
      contentHash: generated.contentHash,
      fee: feeLabel(currency, fee),
    },
  });
  return { letter: serialize(generated.toObject() as unknown as RawLetter), created: true };
}

export async function listAdminEngagementLetters() {
  await connectToDatabase();
  const records = await EngagementLetterModel.find({ status: { $ne: "void" } })
    .sort({ updatedAt: -1 }).limit(100).lean().exec();
  return records.map((record) => serialize(record as unknown as RawLetter));
}

export async function listClientEngagementLetters(clientUserId: string) {
  if (!Types.ObjectId.isValid(clientUserId)) return [];
  await connectToDatabase();
  const records = await EngagementLetterModel.find({
    clientUserId,
    status: { $in: ["awaiting_signatures", "partially_signed", "completed"] },
  }).sort({ updatedAt: -1 }).lean().exec();
  return records.map((record) => serialize(record as unknown as RawLetter));
}

export async function getAdminEngagementLetter(letterId: string) {
  if (!Types.ObjectId.isValid(letterId)) return null;
  await connectToDatabase();
  const record = await EngagementLetterModel.findById(letterId).lean().exec();
  return record ? serialize(record as unknown as RawLetter) : null;
}

export async function getClientEngagementLetter(letterId: string, clientUserId: string) {
  if (!Types.ObjectId.isValid(letterId) || !Types.ObjectId.isValid(clientUserId)) return null;
  await connectToDatabase();
  const record = await EngagementLetterModel.findOne({
    _id: letterId,
    clientUserId,
    status: { $in: ["awaiting_signatures", "partially_signed", "completed"] },
  }).lean().exec();
  return record ? serialize(record as unknown as RawLetter) : null;
}

export async function getEngagementLetterForRequest(requestId: string) {
  if (!Types.ObjectId.isValid(requestId)) return null;
  await connectToDatabase();
  const record = await EngagementLetterModel.findOne({ requestId, status: { $ne: "void" } }).lean().exec();
  return record ? serialize(record as unknown as RawLetter) : null;
}

export async function updateEngagementLetterDraft(input: {
  letterId: string;
  subject: string;
  content: string;
  fee: number | null;
  currency: string;
  paymentTerms: string;
  expiresAt: Date;
  actor: Principal;
}) {
  if (!Types.ObjectId.isValid(input.letterId)) return null;
  await connectToDatabase();
  const record = await EngagementLetterModel.findOne({ _id: input.letterId, status: "draft" }).exec();
  if (!record) return null;
  const previousHash = record.contentHash;
  record.subject = input.subject;
  record.content = input.content;
  record.contentHash = hash(input.content);
  record.fee = input.fee;
  record.currency = input.currency;
  record.paymentTerms = input.paymentTerms;
  record.expiresAt = input.expiresAt;
  record.version += 1;
  await record.save();
  await writeAuditLog({
    actor: input.actor,
    action: "engagement_letter.draft_updated",
    resourceType: "EngagementLetter",
    resourceId: input.letterId,
    previousValues: { contentHash: previousHash },
    newValues: { contentHash: record.contentHash, version: record.version },
  });
  return serialize(record.toObject() as unknown as RawLetter);
}

export async function sendEngagementLetter(letterId: string, actor: Principal) {
  if (!Types.ObjectId.isValid(letterId)) return null;
  await connectToDatabase();
  const now = new Date();
  const record = await EngagementLetterModel.findOneAndUpdate(
    { _id: letterId, status: "draft" },
    { $set: { status: "awaiting_signatures", sentAt: now } },
    { returnDocument: "after", runValidators: true },
  ).exec();
  if (!record) return null;
  await EngagementRequestModel.updateOne(
    { _id: record.requestId },
    { $push: { timeline: { at: now, title: "Signature requested", detail: `${record.reference} is ready for electronic signature.`, clientVisible: true } } },
  ).exec();
  const settings = await getPlatformSettings();
  if (settings.portal.notifyClientOnLetterReady) {
    await createCommunicationNotification({
      recipientUserId: record.clientUserId.toString(),
      type: "engagement_update",
      title: "Engagement letter ready for signature",
      description: `${record.reference} is ready for your review and electronic signature.`,
      relatedModule: "engagements",
      relatedRecordId: record._id.toString(),
      actionUrl: `/client/engagement-letters/${record._id}`,
      createdByUserId: actor.id,
    });
  }
  await writeAuditLog({
    actor,
    action: "engagement_letter.sent_for_signature",
    resourceType: "EngagementLetter",
    resourceId: record._id.toString(),
    newValues: { status: record.status, clientUserId: record.clientUserId.toString() },
  });
  return serialize(record.toObject() as unknown as RawLetter);
}

export async function signEngagementLetter(input: {
  letterId: string;
  signerRole: "ifta" | "client";
  signatureText: string;
  principal: Principal;
  ipAddress: string;
  userAgent: string;
}) {
  if (!Types.ObjectId.isValid(input.letterId)) return { ok: false as const, reason: "missing" };
  await connectToDatabase();
  const settings = await getPlatformSettings();
  if (!settings.engagement.allowTypedSignatures) return { ok: false as const, reason: "disabled" };
  const record = await EngagementLetterModel.findOne({
    _id: input.letterId,
    status: { $in: ["awaiting_signatures", "partially_signed"] },
  }).exec();
  if (!record) return { ok: false as const, reason: "unavailable" };
  if (input.signerRole === "client" && record.clientUserId.toString() !== input.principal.id) {
    return { ok: false as const, reason: "forbidden" };
  }
  if (record.expiresAt.getTime() < Date.now()) return { ok: false as const, reason: "expired" };
  if (hash(record.content) !== record.contentHash) return { ok: false as const, reason: "changed" };
  const signer = record.signers.find((item) => item.role === input.signerRole);
  if (!signer || signer.status === "signed") return { ok: false as const, reason: "signed" };

  const now = new Date();
  const ipAddressHash = hash(input.ipAddress || "unknown");
  const signatureHash = hash([
    record._id.toString(),
    record.contentHash,
    input.signerRole,
    input.principal.id,
    input.signatureText,
    now.toISOString(),
    ipAddressHash,
  ].join("|"));
  signer.name = input.signatureText;
  signer.signatureText = input.signatureText;
  signer.status = "signed";
  signer.method = "typed";
  signer.signedByUserId = Types.ObjectId.isValid(input.principal.id)
    ? new Types.ObjectId(input.principal.id)
    : null;
  signer.signedAt = now;
  signer.ipAddressHash = ipAddressHash;
  signer.userAgent = input.userAgent.slice(0, 500);
  signer.contentHash = record.contentHash;
  signer.signatureHash = signatureHash;
  const completed = record.signers.filter((item) => item.required).every((item) => item.status === "signed");
  record.status = completed ? "completed" : "partially_signed";
  record.completedAt = completed ? now : null;
  await record.save();

  if (completed) {
    await EngagementRequestModel.updateOne(
      { _id: record.requestId, status: { $ne: "converted" } },
      {
        $set: { status: "approved" },
        $push: { timeline: { at: now, title: "Engagement letter signed", detail: `${record.reference} was accepted by all required signers.`, clientVisible: true } },
      },
    ).exec();
    await createCommunicationNotification({
      recipientUserId: record.clientUserId.toString(),
      type: "engagement_update",
      title: "Engagement letter completed",
      description: `${record.reference} has been signed and your engagement can now be activated.`,
      relatedModule: "engagements",
      relatedRecordId: record._id.toString(),
      actionUrl: `/client/engagement-letters/${record._id}`,
      createdByUserId: input.principal.id,
    });
  }

  if (input.signerRole === "client" && settings.portal.notifyAdminOnClientSignature) {
    const administrators = await UserModel.find({
      roleKeys: { $in: ["admin", "super_admin", "engagement_manager"] },
      status: "active",
    }).select("_id").lean().exec();
    await Promise.all(administrators.map((administrator) => createCommunicationNotification({
      recipientUserId: administrator._id.toString(),
      type: "engagement_update",
      title: "Client signed an engagement letter",
      description: `${record.clientName} signed ${record.reference}.`,
      relatedModule: "engagements",
      relatedRecordId: record._id.toString(),
      actionUrl: `/admin/engagement-letters/${record._id}`,
      createdByUserId: input.principal.id,
    })));
  }
  await writeAuditLog({
    actor: input.principal,
    action: `engagement_letter.${input.signerRole}_signed`,
    resourceType: "EngagementLetter",
    resourceId: record._id.toString(),
    ipAddress: ipAddressHash,
    userAgent: input.userAgent.slice(0, 500),
    newValues: {
      signerRole: input.signerRole,
      signedAt: now.toISOString(),
      contentHash: record.contentHash,
      signatureHash,
      status: record.status,
    },
  });
  return { ok: true as const, letter: serialize(record.toObject() as unknown as RawLetter) };
}

export async function recordUploadedSignedEngagementLetter(input: {
  letterId: string;
  principal: Principal;
  documentId: string;
  storageKey: string;
  filename: string;
}) {
  if (!Types.ObjectId.isValid(input.letterId) || !Types.ObjectId.isValid(input.documentId)) {
    return { ok: false as const, reason: "missing" as const };
  }
  await connectToDatabase();
  const record = await EngagementLetterModel.findOne({
    _id: input.letterId,
    clientUserId: input.principal.id,
    status: { $in: ["awaiting_signatures", "partially_signed"] },
  }).exec();
  if (!record) return { ok: false as const, reason: "unavailable" as const };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false as const, reason: "expired" as const };
  if (hash(record.content) !== record.contentHash) return { ok: false as const, reason: "changed" as const };

  const now = new Date();
  for (const signer of record.signers.filter((item) => item.required && item.status !== "signed")) {
    signer.status = "signed";
    signer.method = "uploaded";
    signer.signatureText = "Verified in uploaded executed copy";
    signer.signedByUserId = signer.role === "client" && Types.ObjectId.isValid(input.principal.id)
      ? new Types.ObjectId(input.principal.id)
      : null;
    signer.signedAt = now;
    signer.contentHash = record.contentHash;
    signer.signatureHash = hash([
      record._id.toString(),
      record.contentHash,
      signer.role,
      input.documentId,
      input.storageKey,
      now.toISOString(),
    ].join("|"));
  }
  record.status = "completed";
  record.completedAt = now;
  record.signedCopyDocumentId = new Types.ObjectId(input.documentId);
  record.signedCopyStorageKey = input.storageKey;
  record.signedCopyFilename = input.filename;
  record.signedCopyUploadedAt = now;
  await record.save();

  await EngagementRequestModel.updateOne(
    { _id: record.requestId, status: { $ne: "converted" } },
    {
      $set: { status: "approved" },
      $push: {
        timeline: {
          at: now,
          title: "Signed engagement letter received",
          detail: `${record.reference} was uploaded as a fully executed copy.`,
          clientVisible: true,
        },
      },
    },
  ).exec();

  const administrators = await UserModel.find({
    roleKeys: { $in: ["admin", "super_admin", "engagement_manager"] },
    status: "active",
  }).select("_id").lean().exec();
  await Promise.allSettled([
    createCommunicationNotification({
      recipientUserId: record.clientUserId.toString(),
      type: "engagement_update",
      title: "Signed engagement letter received",
      description: `${record.reference} was received and your engagement is being activated.`,
      relatedModule: "engagements",
      relatedRecordId: record._id.toString(),
      actionUrl: "/client/documents",
      createdByUserId: input.principal.id,
    }),
    ...administrators.map((administrator) => createCommunicationNotification({
      recipientUserId: administrator._id.toString(),
      type: "engagement_update" as const,
      title: "Executed engagement letter uploaded",
      description: `${record.clientName} uploaded the signed copy of ${record.reference}.`,
      relatedModule: "engagements" as const,
      relatedRecordId: record._id.toString(),
      actionUrl: `/admin/engagement-letters/${record._id}`,
      createdByUserId: input.principal.id,
    })),
    writeAuditLog({
      actor: input.principal,
      action: "engagement_letter.signed_copy_uploaded",
      resourceType: "EngagementLetter",
      resourceId: record._id.toString(),
      newValues: {
        status: "completed",
        documentId: input.documentId,
        filename: input.filename,
        completedAt: now.toISOString(),
      },
    }),
  ]);
  return { ok: true as const, letter: serialize(record.toObject() as unknown as RawLetter) };
}

export async function engagementLetterIsCompleteForRequest(requestId: string) {
  if (!Types.ObjectId.isValid(requestId)) return false;
  await connectToDatabase();
  return Boolean(await EngagementLetterModel.exists({ requestId, status: "completed" }));
}

export async function linkEngagementLetterToWorkflow(requestId: string, workflowId: string) {
  if (!Types.ObjectId.isValid(requestId) || !Types.ObjectId.isValid(workflowId)) return;
  await connectToDatabase();
  await EngagementLetterModel.updateOne(
    { requestId, status: "completed" },
    { $set: { workflowId: new Types.ObjectId(workflowId) } },
  ).exec();
}
