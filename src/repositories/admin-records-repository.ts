import { Types } from "mongoose";
import { hasAnyPermission, type Principal } from "@/features/authorization/access-control";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientDocumentModel } from "@/models/client-document";
import { ClientPaymentModel } from "@/models/client-payment";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";

export type AdminDocumentRecord = {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  workflowId: string | null;
  engagementReference: string;
  direction: "sent" | "received";
  status: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  downloadHref: string | null;
};

export type AdminInvoiceRecord = {
  workflowId: string;
  reference: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  invoiceStatus: string;
  paymentStatus: string;
  balanceDue: number;
  currency: string;
  dueDate: string | null;
  lastActivityAt: string;
};

export type AdminPaymentRecord = {
  id: string;
  workflowId: string;
  engagementReference: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  method: string;
  transactionReference: string;
  status: string;
  submittedAt: string;
  reviewNote: string;
};

type RawUser = {
  _id: Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
};

type RawWorkflow = {
  _id: Types.ObjectId;
  reference: string;
  clientName: string;
  clientUserId?: Types.ObjectId | null;
  serviceName: string;
  dueDate?: Date | null;
  lastActivityAt?: Date | null;
  documents?: Array<{
    documentId: string;
    name: string;
    status: string;
    visibility: string;
    uploadedAt?: Date | null;
  }>;
  financial?: {
    invoiceStatus: string;
    paymentStatus: string;
    balanceDue: number;
    currency: string;
  };
};

type RawDocument = {
  _id: Types.ObjectId;
  clientUserId: Types.ObjectId;
  workflowId?: Types.ObjectId | null;
  name: string;
  contentType: string;
  size: number;
  direction: "sent" | "received";
  status: string;
  uploadedAt: Date;
};

type RawPayment = {
  _id: Types.ObjectId;
  clientUserId: Types.ObjectId;
  workflowId: Types.ObjectId;
  amount: number;
  currency: string;
  method: string;
  transactionReference: string;
  status: string;
  submittedAt: Date;
  reviewNote?: string;
};

function userName(user: RawUser | undefined, fallback = "Client") {
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  return name || fallback;
}

function isoDate(value?: Date | null) {
  return value?.toISOString() ?? null;
}

async function loadDirectory(userIds: Types.ObjectId[]) {
  const users = (await UserModel.find({ _id: { $in: userIds } })
    .select("email firstName lastName")
    .lean()
    .exec()) as RawUser[];
  return new Map(users.map((user) => [user._id.toString(), user]));
}

export async function getAdminDocumentsData() {
  await connectToDatabase();
  const [storedDocuments, workflows] = await Promise.all([
    ClientDocumentModel.find({}).sort({ uploadedAt: -1 }).lean().exec(),
    WorkflowInstanceModel.find({ archivedAt: null })
      .select("reference clientName clientUserId documents")
      .sort({ lastActivityAt: -1 })
      .lean()
      .exec(),
  ]);
  const documents = storedDocuments as unknown as RawDocument[];
  const workflowRecords = workflows as unknown as RawWorkflow[];
  const userIds = [...new Map([
    ...documents.map((document) => [document.clientUserId.toString(), document.clientUserId] as const),
    ...workflowRecords.flatMap((workflow) => workflow.clientUserId
      ? [[workflow.clientUserId.toString(), workflow.clientUserId] as const]
      : []),
  ]).values()];
  const usersById = await loadDirectory(userIds);
  const workflowsById = new Map(workflowRecords.map((workflow) => [workflow._id.toString(), workflow]));
  const records: AdminDocumentRecord[] = documents.map((document) => {
    const user = usersById.get(document.clientUserId.toString());
    const workflow = document.workflowId ? workflowsById.get(document.workflowId.toString()) : undefined;
    return {
      id: document._id.toString(),
      name: document.name,
      clientName: userName(user, workflow?.clientName),
      clientEmail: user?.email ?? "Email unavailable",
      workflowId: workflow?._id.toString() ?? null,
      engagementReference: workflow?.reference ?? "Not linked",
      direction: document.direction,
      status: document.status,
      contentType: document.contentType,
      size: document.size,
      uploadedAt: document.uploadedAt.toISOString(),
      downloadHref: `/api/admin/documents/${document._id}`,
    };
  });

  const storedKeys = new Set(records.map((record) => `${record.workflowId ?? "none"}:${record.name.toLowerCase()}`));
  for (const workflow of workflowRecords) {
    const client = workflow.clientUserId ? usersById.get(workflow.clientUserId.toString()) : undefined;
    for (const document of workflow.documents ?? []) {
      const key = `${workflow._id}:${document.name.toLowerCase()}`;
      if (storedKeys.has(key)) continue;
      records.push({
        id: `${workflow._id}-${document.documentId}`,
        name: document.name,
        clientName: userName(client, workflow.clientName),
        clientEmail: client?.email ?? "Email unavailable",
        workflowId: workflow._id.toString(),
        engagementReference: workflow.reference,
        direction: "received",
        status: document.status,
        contentType: document.visibility === "client" ? "Shared with client" : "Internal record",
        size: 0,
        uploadedAt: isoDate(document.uploadedAt) ?? new Date(0).toISOString(),
        downloadHref: null,
      });
    }
  }

  records.sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
  return {
    records,
    summary: {
      total: records.length,
      waiting: records.filter((record) => ["uploaded", "pending_review"].includes(record.status)).length,
      approved: records.filter((record) => ["approved", "final"].includes(record.status)).length,
      clients: new Set(records.map((record) => record.clientEmail).filter((email) => email !== "Email unavailable")).size,
    },
  };
}

export async function getAdminInvoicesData() {
  await connectToDatabase();
  const workflows = (await WorkflowInstanceModel.find({ archivedAt: null })
    .select("reference clientName clientUserId serviceName financial dueDate lastActivityAt")
    .sort({ lastActivityAt: -1 })
    .lean()
    .exec()) as unknown as RawWorkflow[];
  const userIds = workflows.flatMap((workflow) => workflow.clientUserId ? [workflow.clientUserId] : []);
  const usersById = await loadDirectory(userIds);
  const records: AdminInvoiceRecord[] = workflows.map((workflow) => {
    const user = workflow.clientUserId ? usersById.get(workflow.clientUserId.toString()) : undefined;
    const financial = workflow.financial ?? {
      invoiceStatus: "draft",
      paymentStatus: "pending",
      balanceDue: 0,
      currency: "KES",
    };
    return {
      workflowId: workflow._id.toString(),
      reference: workflow.reference,
      clientName: userName(user, workflow.clientName),
      clientEmail: user?.email ?? "Email unavailable",
      serviceName: workflow.serviceName,
      invoiceStatus: financial.invoiceStatus,
      paymentStatus: financial.paymentStatus,
      balanceDue: financial.balanceDue,
      currency: financial.currency,
      dueDate: isoDate(workflow.dueDate),
      lastActivityAt: isoDate(workflow.lastActivityAt) ?? new Date(0).toISOString(),
    };
  });
  return {
    records,
    summary: {
      total: records.length,
      issued: records.filter((record) => !["draft", "cancelled"].includes(record.invoiceStatus)).length,
      unpaid: records.filter((record) => record.balanceDue > 0).length,
      outstanding: records.reduce((total, record) => total + Math.max(0, record.balanceDue), 0),
    },
  };
}

export async function getAdminPaymentsData() {
  await connectToDatabase();
  const payments = (await ClientPaymentModel.find({}).sort({ submittedAt: -1 }).lean().exec()) as unknown as RawPayment[];
  const workflowIds = payments.map((payment) => payment.workflowId);
  const userIds = payments.map((payment) => payment.clientUserId);
  const [workflows, usersById] = await Promise.all([
    WorkflowInstanceModel.find({ _id: { $in: workflowIds } }).select("reference clientName").lean().exec(),
    loadDirectory(userIds),
  ]);
  const workflowsById = new Map((workflows as unknown as RawWorkflow[]).map((workflow) => [workflow._id.toString(), workflow]));
  const records: AdminPaymentRecord[] = payments.map((payment) => {
    const user = usersById.get(payment.clientUserId.toString());
    const workflow = workflowsById.get(payment.workflowId.toString());
    return {
      id: payment._id.toString(),
      workflowId: payment.workflowId.toString(),
      engagementReference: workflow?.reference ?? "Engagement unavailable",
      clientName: userName(user, workflow?.clientName),
      clientEmail: user?.email ?? "Email unavailable",
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      transactionReference: payment.transactionReference,
      status: payment.status,
      submittedAt: payment.submittedAt.toISOString(),
      reviewNote: payment.reviewNote ?? "",
    };
  });
  return {
    records,
    summary: {
      total: records.length,
      pending: records.filter((record) => record.status === "pending").length,
      verified: records.filter((record) => record.status === "verified").length,
      received: records.filter((record) => record.status !== "rejected").reduce((total, record) => total + record.amount, 0),
    },
  };
}

export async function getAdminDocumentFile(principal: Principal, documentId: string) {
  if (!hasAnyPermission(principal, ["documents.read_all", "settings.manage"])) return null;
  if (!Types.ObjectId.isValid(documentId)) return null;
  await connectToDatabase();
  return ClientDocumentModel.findById(documentId).lean().exec();
}
