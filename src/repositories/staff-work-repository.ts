import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import type { WorkflowPriority, WorkflowTaskStatus } from "@/features/workflows/types";
import { getAdminRequest } from "@/content/admin-requests";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientKycSubmissionModel } from "@/models/client-kyc-submission";
import { EngagementRequestModel } from "@/models/engagement-request";
import { RequestStaffAssignmentModel } from "@/models/request-staff-assignment";
import { UserModel } from "@/models/user";
import {
  listWorkflowsForPrincipal,
  type WorkflowInstanceRecord,
} from "@/repositories/workflow-repository";

export type StaffAssignedRequest = {
  id: string;
  reference: string;
  clientName: string;
  serviceName: string;
  status: string;
  priority: string;
  nextAction: string;
  assignedAt: string;
  clientUserId: string | null;
};

export type StaffClientRecord = {
  key: string;
  userId: string | null;
  name: string;
  email: string | null;
  organization: string;
  services: string[];
  workflowIds: string[];
  activeEngagements: number;
  pendingRequests: number;
  lastActivityAt: string | null;
};

export type StaffDocumentRecord = {
  id: string;
  name: string;
  status: string;
  version: number;
  visibility: string;
  uploadedAt: string;
  workflowId: string;
  reference: string;
  clientName: string;
  href: string;
};

export type StaffReviewRecord = {
  id: string;
  clientUserId: string;
  clientName: string;
  clientEmail: string;
  status: string;
  questionnaireComplete: boolean;
  documentCount: number;
  submittedAt: string | null;
};

export type StaffNoteRecord = {
  id: string;
  title: string;
  body: string;
  clientName: string;
  reference: string;
  workflowId: string;
  href: string;
};

export type StaffCalendarRecord = {
  id: string;
  title: string;
  date: string;
  type: "engagement" | "task" | "client_action" | "kyc_review";
  clientName: string;
  workflowId: string;
  href: string;
};

export type StaffWorkData = {
  workflows: WorkflowInstanceRecord[];
  requests: StaffAssignedRequest[];
  clients: StaffClientRecord[];
  documents: StaffDocumentRecord[];
  reviews: StaffReviewRecord[];
  notes: StaffNoteRecord[];
  calendar: StaffCalendarRecord[];
};

export type StaffClientDetailData = {
  client: StaffClientRecord;
  workflows: WorkflowInstanceRecord[];
  requests: StaffAssignedRequest[];
  reviews: StaffReviewRecord[];
};

type RawAssignment = {
  requestId: string;
  assignedAt: Date;
};

type RawEngagementRequest = {
  _id: Types.ObjectId;
  reference: string;
  clientName: string;
  status: string;
  priority: string;
  items: Array<{ serviceTitle: string }>;
  clientUserId: Types.ObjectId;
};

type RawClient = {
  _id: Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
};

type RawStaffKycSubmission = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  assignedReviewerUserId?: Types.ObjectId | null;
  status: string;
  questionnaireComplete: boolean;
  submittedAt?: Date | null;
  documents?: Array<{
    _id?: Types.ObjectId;
    filename: string;
    documentType?: string;
    reviewStatus?: string;
    version?: number;
    uploadedAt?: Date;
  }>;
  requirementReviews?: Array<{
    requirementId: string;
    decision: string;
    note?: string;
    reviewedAt: Date;
  }>;
};

function clientName(client: RawClient) {
  return `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || client.email;
}

async function listAssignedRequests(principal: Principal): Promise<StaffAssignedRequest[]> {
  if (!Types.ObjectId.isValid(principal.id)) return [];
  const assignments = (await RequestStaffAssignmentModel.find({
    staffUserId: new Types.ObjectId(principal.id),
  })
    .sort({ assignedAt: -1 })
    .lean()
    .exec()) as unknown as RawAssignment[];

  const databaseRequestIds = assignments
    .map((assignment) => assignment.requestId)
    .filter((requestId) => Types.ObjectId.isValid(requestId))
    .map((requestId) => new Types.ObjectId(requestId));
  const databaseRequests = databaseRequestIds.length
    ? (await EngagementRequestModel.find({ _id: { $in: databaseRequestIds } })
        .select("reference clientName clientUserId status priority items.serviceTitle")
        .lean()
        .exec()) as unknown as RawEngagementRequest[]
    : [];
  const databaseRequestById = new Map(
    databaseRequests.map((request) => [request._id.toString(), request]),
  );

  return assignments.flatMap<StaffAssignedRequest>((assignment) => {
    const request = getAdminRequest(assignment.requestId);
    if (request) {
      return [{
        id: request.id,
        reference: request.reference,
        clientName: request.client,
        serviceName: request.service,
        status: request.status,
        priority: request.priority,
        nextAction: request.nextAction,
        assignedAt: assignment.assignedAt.toISOString(),
        clientUserId: null,
      }];
    }

    const databaseRequest = databaseRequestById.get(assignment.requestId);
    if (!databaseRequest) return [];
    return [{
      id: databaseRequest._id.toString(),
      reference: databaseRequest.reference,
      clientName: databaseRequest.clientName,
      serviceName: databaseRequest.items.map((item) => item.serviceTitle).join(", ") || "Consulting services",
      status: databaseRequest.status.replaceAll("_", " "),
      priority: databaseRequest.priority,
      nextAction: databaseRequest.status.startsWith("quotation")
        ? "Prepare and send the quotation"
        : "Review the request and begin the engagement",
      assignedAt: assignment.assignedAt.toISOString(),
      clientUserId: databaseRequest.clientUserId.toString(),
    }];
  });
}

function buildClients(
  workflows: WorkflowInstanceRecord[],
  requests: StaffAssignedRequest[],
  users: RawClient[],
  reviews: StaffReviewRecord[],
) {
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));
  const records = new Map<string, StaffClientRecord>();
  const keyByName = new Map<string, string>();

  for (const workflow of workflows) {
    const user = workflow.clientUserId ? usersById.get(workflow.clientUserId) : undefined;
    const name = user ? clientName(user) : workflow.clientName;
    const normalizedName = name.trim().toLowerCase();
    const key = workflow.clientUserId ?? keyByName.get(normalizedName) ?? `workflow-${workflow.id}`;
    const existing = records.get(key);
    const next: StaffClientRecord = existing ?? {
      key,
      userId: workflow.clientUserId,
      name,
      email: user?.email ?? null,
      organization: workflow.organizationName || workflow.clientName,
      services: [],
      workflowIds: [],
      activeEngagements: 0,
      pendingRequests: 0,
      lastActivityAt: null,
    };
    if (!next.services.includes(workflow.serviceName)) next.services.push(workflow.serviceName);
    if (!next.workflowIds.includes(workflow.id)) next.workflowIds.push(workflow.id);
    if (workflow.status === "active" || workflow.status === "on_hold") next.activeEngagements += 1;
    if (!next.lastActivityAt || (workflow.lastActivityAt && workflow.lastActivityAt > next.lastActivityAt)) {
      next.lastActivityAt = workflow.lastActivityAt;
    }
    records.set(key, next);
    keyByName.set(normalizedName, key);
  }

  for (const request of requests) {
    const normalizedName = request.clientName.trim().toLowerCase();
    const key = keyByName.get(normalizedName) ?? `request-${request.id}`;
    const existing = records.get(key);
    const next: StaffClientRecord = existing ?? {
      key,
      userId: null,
      name: request.clientName,
      email: null,
      organization: request.clientName,
      services: [],
      workflowIds: [],
      activeEngagements: 0,
      pendingRequests: 0,
      lastActivityAt: null,
    };
    if (!next.services.includes(request.serviceName)) next.services.push(request.serviceName);
    next.pendingRequests += 1;
    if (!next.lastActivityAt || request.assignedAt > next.lastActivityAt) next.lastActivityAt = request.assignedAt;
    records.set(key, next);
    keyByName.set(normalizedName, key);
  }

  for (const review of reviews) {
    const user = usersById.get(review.clientUserId);
    if (!user) continue;
    const key = review.clientUserId;
    const name = clientName(user);
    const existing = records.get(key);
    const next: StaffClientRecord = existing ?? {
      key,
      userId: key,
      name,
      email: user.email,
      organization: name,
      services: [],
      workflowIds: [],
      activeEngagements: 0,
      pendingRequests: 0,
      lastActivityAt: null,
    };
    if (!next.services.includes("KYC review")) next.services.push("KYC review");
    if (!next.lastActivityAt || (review.submittedAt && review.submittedAt > next.lastActivityAt)) {
      next.lastActivityAt = review.submittedAt;
    }
    records.set(key, next);
    keyByName.set(name.trim().toLowerCase(), key);
  }

  return Array.from(records.values()).sort((left, right) => left.name.localeCompare(right.name));
}

export async function getStaffWorkData(principal: Principal): Promise<StaffWorkData> {
  await connectToDatabase();
  const staffObjectId = Types.ObjectId.isValid(principal.id) ? new Types.ObjectId(principal.id) : null;
  const [workflows, requests, directlyAssignedKyc] = await Promise.all([
    listWorkflowsForPrincipal(principal),
    listAssignedRequests(principal),
    staffObjectId
      ? ClientKycSubmissionModel.find({
          assignedReviewerUserId: staffObjectId,
          status: { $ne: "draft" },
        }).sort({ submittedAt: -1 }).lean().exec() as Promise<RawStaffKycSubmission[]>
      : Promise.resolve([] as RawStaffKycSubmission[]),
  ]);
  const clientIds = Array.from(new Set([
    ...workflows.map((workflow) => workflow.clientUserId),
    ...requests.map((request) => request.clientUserId),
    ...directlyAssignedKyc.map((submission) => submission.userId.toString()),
  ].filter(Boolean)))
    .filter((value): value is string => typeof value === "string" && Types.ObjectId.isValid(value))
    .map((value) => new Types.ObjectId(value));
  const [users, linkedKycSubmissions] = await Promise.all([
    UserModel.find({ _id: { $in: clientIds }, status: { $ne: "archived" } })
      .select("email firstName lastName")
      .lean()
      .exec() as Promise<RawClient[]>,
    ClientKycSubmissionModel.find({ userId: { $in: clientIds }, status: { $ne: "draft" } })
      .sort({ submittedAt: -1 })
      .lean()
      .exec() as Promise<RawStaffKycSubmission[]>,
  ]);
  const kycById = new Map(
    [...directlyAssignedKyc, ...linkedKycSubmissions].map((submission) => [submission._id.toString(), submission]),
  );
  const kycSubmissions = Array.from(kycById.values());
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));
  const canSeeAllTasks = principal.permissions.includes("engagements.read_all");

  const workflowDocuments = workflows.flatMap((workflow) => workflow.documents.map((document) => ({
    id: document.documentId,
    name: document.name,
    status: document.status,
    version: document.version,
    visibility: document.visibility,
    uploadedAt: document.uploadedAt,
    workflowId: workflow.id,
    reference: workflow.reference,
    clientName: workflow.clientName,
    href: `/staff/engagements/${workflow.id}`,
  })));
  const notes = workflows.flatMap((workflow) => workflow.tasks
    .filter((task) => Boolean(task.internalNotes) && (canSeeAllTasks || task.assignedUserId === principal.id))
    .map((task) => ({
      id: `${workflow.id}-${task.key}`,
      title: task.title,
      body: task.internalNotes,
      clientName: workflow.clientName,
      reference: workflow.reference,
      workflowId: workflow.id,
      href: `/staff/engagements/${workflow.id}`,
    })));
  const calendar = workflows.flatMap((workflow): StaffCalendarRecord[] => {
    const events: StaffCalendarRecord[] = [];
    if (workflow.dueDate) events.push({
      id: `${workflow.id}-due`, title: `${workflow.reference} due`, date: workflow.dueDate,
      type: "engagement", clientName: workflow.clientName, workflowId: workflow.id, href: `/staff/engagements/${workflow.id}`,
    });
    for (const task of workflow.tasks) {
      if (task.dueDate && (canSeeAllTasks || task.assignedUserId === principal.id)) events.push({
        id: `${workflow.id}-${task.key}`, title: task.title, date: task.dueDate,
        type: "task", clientName: workflow.clientName, workflowId: workflow.id, href: `/staff/engagements/${workflow.id}`,
      });
    }
    for (const action of workflow.clientActions) {
      if (action.dueDate) events.push({
        id: `${workflow.id}-${action.key}`, title: action.title, date: action.dueDate,
        type: "client_action", clientName: workflow.clientName, workflowId: workflow.id, href: `/staff/engagements/${workflow.id}`,
      });
    }
    return events;
  }).sort((left, right) => left.date.localeCompare(right.date));
  const reviews = kycSubmissions.map((submission): StaffReviewRecord => {
    const user = usersById.get(submission.userId.toString());
    return {
      id: submission._id.toString(),
      clientUserId: submission.userId.toString(),
      clientName: user ? clientName(user) : "Client",
      clientEmail: user?.email ?? "Not available",
      status: submission.status,
      questionnaireComplete: submission.questionnaireComplete,
      documentCount: submission.documents?.length ?? 0,
      submittedAt: submission.submittedAt?.toISOString() ?? null,
    };
  });
  const kycDocuments: StaffDocumentRecord[] = kycSubmissions.flatMap((submission) => {
    const user = usersById.get(submission.userId.toString());
    return (submission.documents ?? []).map((document) => ({
      id: document._id?.toString() ?? `${submission._id.toString()}-${document.filename}`,
      name: document.filename,
      status: document.reviewStatus ?? "submitted",
      version: document.version ?? 1,
      visibility: "KYC review",
      uploadedAt: document.uploadedAt?.toISOString() ?? submission.submittedAt?.toISOString() ?? new Date(0).toISOString(),
      workflowId: `client-kyc-${submission._id.toString()}`,
      reference: `KYC-${submission._id.toString().slice(-6).toUpperCase()}`,
      clientName: user ? clientName(user) : "Client",
      href: `/staff/kyc/client-kyc-${submission._id.toString()}`,
    }));
  });
  const kycCalendar: StaffCalendarRecord[] = kycSubmissions.flatMap((submission) => {
    if (!submission.submittedAt || submission.status === "approved") return [];
    const user = usersById.get(submission.userId.toString());
    return [{
      id: `${submission._id.toString()}-review-due`,
      title: `Review KYC-${submission._id.toString().slice(-6).toUpperCase()}`,
      date: new Date(submission.submittedAt.getTime() + 2 * 86_400_000).toISOString(),
      type: "kyc_review",
      clientName: user ? clientName(user) : "Client",
      workflowId: `client-kyc-${submission._id.toString()}`,
      href: `/staff/kyc/client-kyc-${submission._id.toString()}`,
    }];
  });
  const kycNotes: StaffNoteRecord[] = kycSubmissions.flatMap((submission) => {
    const user = usersById.get(submission.userId.toString());
    return (submission.requirementReviews ?? []).flatMap((review) => review.note ? [{
      id: `${submission._id.toString()}-${review.requirementId}-${review.reviewedAt.toISOString()}`,
      title: `KYC requirement ${review.decision.replaceAll("_", " ")}`,
      body: review.note,
      clientName: user ? clientName(user) : "Client",
      reference: `KYC-${submission._id.toString().slice(-6).toUpperCase()}`,
      workflowId: `client-kyc-${submission._id.toString()}`,
      href: `/staff/kyc/client-kyc-${submission._id.toString()}`,
    }] : []);
  });

  return {
    workflows,
    requests,
    clients: buildClients(workflows, requests, users, reviews),
    documents: [...kycDocuments, ...workflowDocuments],
    reviews,
    notes: [...kycNotes, ...notes],
    calendar: [...kycCalendar, ...calendar].sort((left, right) => left.date.localeCompare(right.date)),
  };
}

export async function canStaffContactClient(principal: Principal, clientUserId: string) {
  if (!Types.ObjectId.isValid(clientUserId)) return false;
  const data = await getStaffWorkData(principal);
  return data.clients.some((client) => client.userId === clientUserId);
}

export async function listStaffKycTasks(principal: Principal) {
  const data = await getStaffWorkData(principal);
  return data.reviews.map((review) => {
    const dueDate = review.submittedAt
      ? new Date(new Date(review.submittedAt).getTime() + 2 * 86_400_000).toISOString()
      : null;
    const overdue = Boolean(dueDate && new Date(dueDate).getTime() < Date.now() && review.status !== "approved");
    const status: WorkflowTaskStatus = review.status === "approved"
      ? "completed"
      : overdue
        ? "overdue"
        : review.status === "changes_requested"
          ? "waiting_for_client"
          : "in_progress";
    const priority: WorkflowPriority = overdue ? "high" : "medium";
    return {
      workflowId: `client-kyc-${review.id}`,
      engagement: `KYC-${review.id.slice(-6).toUpperCase()}`,
      client: review.clientName,
      service: "KYC review",
      href: `/staff/kyc/client-kyc-${review.id}`,
      key: `kyc-review-${review.id}`,
      title: "Review client KYC submission",
      assignedUserName: principal.email,
      assignedRole: "Reviewer",
      priority,
      status,
      dueDate,
      dependencies: [],
      clientActionRequired: review.status === "changes_requested",
      blockerReason: review.questionnaireComplete ? null : "Client questionnaire is incomplete",
    };
  });
}

export async function getStaffClientRecord(
  principal: Principal,
  clientKey: string,
): Promise<StaffClientDetailData | null> {
  const data = await getStaffWorkData(principal);
  const assignedRequest = clientKey.startsWith("request-")
    ? data.requests.find((request) => request.id === clientKey.slice("request-".length))
    : null;
  const client = data.clients.find((record) => record.key === clientKey)
    ?? (assignedRequest
      ? data.clients.find((record) => record.name.toLowerCase() === assignedRequest.clientName.toLowerCase())
      : null);
  if (!client) return null;
  return {
    client,
    workflows: data.workflows.filter((workflow) => client.workflowIds.includes(workflow.id)),
    requests: data.requests.filter((request) => request.clientName.toLowerCase() === client.name.toLowerCase()),
    reviews: data.reviews.filter((review) => review.clientUserId === client.userId),
  };
}
