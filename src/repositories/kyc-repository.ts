import { Types } from "mongoose";
import { assertPermission, type Principal } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { CLIENT_KYC_QUESTIONS } from "@/features/kyc/client-questionnaire";
import {
  KYC_CLIENT_TYPE_LABELS,
  KYC_PERMISSION_MATRIX,
  KYC_REQUIREMENT_STATUS_LABELS,
  KYC_REVIEWER_RULES,
  KYC_RISK_LABELS,
  KYC_STATUS_LABELS,
  type KycClientType,
  type KycDocumentIssue,
  type KycRequirementSection,
  type KycRequirementStatus,
  type KycRiskLevel,
  type KycStatus,
} from "@/features/kyc/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientKycSubmissionModel } from "@/models/client-kyc-submission";
import { KycRiskRuleModel } from "@/models/kyc-risk-rule";
import { KycTemplateModel } from "@/models/kyc-template";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { createCommunicationNotification } from "@/repositories/communication-repository";

export type KycDocumentVersion = {
  id: string;
  label: string;
  filename: string;
  fileType: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  documentDate: string | null;
  expiryDate: string | null;
  version: number;
  checksum: string;
  reviewStatus: string;
  rejectionReason?: string;
  previewHref: string;
  downloadHref: string;
};

export type KycRequirement = {
  id: string;
  section: KycRequirementSection;
  name: string;
  instructions: string;
  required: boolean;
  status: KycRequirementStatus;
  clientAnswer: string;
  issues: KycDocumentIssue[];
  documentVersions: KycDocumentVersion[];
  internalNotes: string[];
  clientFeedback: string[];
  comparison?: { label: string; entered: string; document: string; warning: string };
};

export type KycTimelineEvent = {
  id: string;
  actor: string;
  action: string;
  at: string;
  requirement?: string;
  statusChange?: string;
  note?: string;
  internal: boolean;
};

export type KycSubmission = {
  id: string;
  reference: string;
  clientName: string;
  clientType: KycClientType;
  primaryContact: string;
  clientHref: string;
  engagementReference: string;
  engagementHref: string;
  service: string;
  template: string;
  status: KycStatus;
  riskLevel: KycRiskLevel;
  submittedAt: string;
  reviewDueAt: string;
  waitingTime: string;
  assignedReviewer: string;
  reviewerRole: string;
  reviewerLoad: number;
  reviewerOverdue: number;
  reviewerTurnaround: string;
  completion: {
    submitted: number;
    total: number;
    approved: number;
    mandatoryApproved: number;
    mandatoryTotal: number;
  };
  documentIssues: KycDocumentIssue[];
  seniorReviewRequired: boolean;
  overdue: boolean;
  slaStatus: "On Track" | "Due Soon" | "Overdue" | "Severely Overdue";
  nextAction: string;
  canProceed: boolean;
  returningClientMode: "Full KYC" | "KYC Refresh" | "Document Update" | "No Update Required";
  alerts: Array<{ severity: "warning" | "danger" | "info"; message: string; action: string }>;
  requirements: KycRequirement[];
  previousReviews: Array<{ reference: string; approvedAt: string; outcome: string; riskLevel: KycRiskLevel }>;
  finalChecklist: Array<{ label: string; state: "Complete" | "Incomplete" | "Not Applicable" }>;
  timeline: KycTimelineEvent[];
};

export type KycDashboardData = {
  summaryCards: Array<{
    key: string;
    label: string;
    value: string;
    supportingMetric: string;
    statusLine: string;
    href: string;
    tone: "blue" | "amber" | "red" | "purple" | "green" | "orange";
  }>;
  savedViews: Array<{ label: string; href: string; count: number }>;
  submissions: KycSubmission[];
  permissionMatrix: typeof KYC_PERMISSION_MATRIX;
  reviewerRules: typeof KYC_REVIEWER_RULES;
};

type LiveKycDocument = {
  _id?: Types.ObjectId;
  r2Key?: string;
  filename?: string;
  contentType?: string;
  size?: number;
  uploadedAt?: Date;
  documentType?: string;
  documentDate?: Date | null;
  expiryDate?: Date | null;
  version?: number;
  checksum?: string;
  reviewStatus?: "submitted" | "approved" | "replacement_requested" | "rejected";
  rejectionReason?: string;
};

type LiveKycRecord = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  questionnaireVersion?: string;
  answers?: unknown;
  documents?: LiveKycDocument[];
  status?: "draft" | "submitted" | "under_review" | "changes_requested" | "approved";
  submittedAt?: Date | null;
  updatedAt?: Date;
  assignedReviewerUserId?: Types.ObjectId | null;
  assignedByUserId?: Types.ObjectId | null;
  assignedAt?: Date | null;
  requirementReviews?: Array<{
    requirementId: string;
    decision: "approved" | "replacement_requested" | "escalated" | "rejected";
    note?: string;
    reviewedByUserId: Types.ObjectId;
    reviewedAt: Date;
  }>;
};

type LiveKycUser = {
  _id: Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  roleKeys?: string[];
};

type LiveKycWorkflow = {
  _id: Types.ObjectId;
  clientUserId?: Types.ObjectId | null;
  reference: string;
  serviceName: string;
  responsibleUserName?: string;
};

const DAY_MS = 86_400_000;

function answersFromRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function requirementStatus(
  status: LiveKycRecord["status"],
  complete: boolean,
  decision?: "approved" | "replacement_requested" | "escalated" | "rejected",
): KycRequirementStatus {
  if (decision) return decision;
  if (!complete) return "not_submitted";
  if (status === "approved") return "approved";
  if (status === "under_review") return "under_review";
  if (status === "changes_requested") return "replacement_requested";
  return "submitted";
}

function submissionStatus(status: LiveKycRecord["status"]): KycStatus {
  if (status === "approved") return "approved";
  if (status === "under_review") return "under_review";
  if (status === "changes_requested") return "changes_requested";
  if (status === "submitted") return "pending_review";
  return "not_started";
}

function questionSection(questionId: string): KycRequirementSection {
  if (questionId === "residential_address") return "Address Verification";
  if (questionId === "tax_identifier") return "Tax Information";
  if (questionId === "politically_exposed" || questionId === "source_of_funds") return "Declarations";
  return "Client Identity";
}

function userName(user: LiveKycUser) {
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
}

function fileSizeLabel(size = 0) {
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} MB`;
  if (size >= 1_000) return `${Math.round(size / 1_000)} KB`;
  return `${size} B`;
}

function dateOnly(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function documentVersion(document: LiveKycDocument, submittedAt: Date): KycDocumentVersion {
  const documentId = document._id?.toString() ?? document.r2Key ?? document.filename ?? "document";
  return {
    id: documentId,
    label: document.documentType || "Submitted document",
    filename: document.filename ?? "Uploaded file",
    fileType: document.contentType?.split("/").at(-1)?.toUpperCase() ?? "File",
    fileSize: fileSizeLabel(document.size),
    uploadedBy: "Client representative",
    uploadedAt: (document.uploadedAt ?? submittedAt).toISOString(),
    documentDate: dateOnly(document.documentDate),
    expiryDate: dateOnly(document.expiryDate),
    version: document.version ?? 1,
    checksum: document.checksum || "Not recorded",
    reviewStatus: document.reviewStatus?.replaceAll("_", " ") ?? "submitted",
    rejectionReason: document.rejectionReason || undefined,
    previewHref: `/api/kyc/documents/${documentId}`,
    downloadHref: `/api/kyc/documents/${documentId}?download=1`,
  };
}

function documentIssues(document: LiveKycDocument | undefined): KycDocumentIssue[] {
  if (!document) return ["Missing Document"];
  if (document.expiryDate && document.expiryDate.getTime() < Date.now()) return ["Expired"];
  if (["replacement_requested", "rejected"].includes(document.reviewStatus ?? "")) {
    return ["Replacement Required"];
  }
  return [];
}

function elapsedLabel(from: Date, to = new Date()) {
  const days = Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY_MS));
  if (days === 0) return "Today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

function liveKycObjectId(submissionId: string) {
  const value = submissionId.startsWith("client-kyc-")
    ? submissionId.slice("client-kyc-".length)
    : submissionId;
  return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
}

async function listKycSubmissions(): Promise<KycSubmission[]> {
  await connectToDatabase();
  const records = (await ClientKycSubmissionModel.find({ status: { $ne: "draft" } })
    .sort({ submittedAt: -1 })
    .lean()
    .exec()) as unknown as LiveKycRecord[];
  if (records.length === 0) return [];

  const userIds = records.map((record) => record.userId);
  const directoryIds = [
    ...userIds,
    ...records.flatMap((record) => [
      ...(record.assignedReviewerUserId ? [record.assignedReviewerUserId] : []),
      ...(record.requirementReviews ?? []).map((review) => review.reviewedByUserId),
    ]),
  ];
  const [users, workflows] = await Promise.all([
    UserModel.find({ _id: { $in: directoryIds } })
      .select("email firstName lastName roleKeys")
      .lean()
      .exec() as Promise<LiveKycUser[]>,
    WorkflowInstanceModel.find({ clientUserId: { $in: userIds } })
      .select("clientUserId reference serviceName responsibleUserName")
      .sort({ lastActivityAt: -1 })
      .lean()
      .exec() as Promise<LiveKycWorkflow[]>,
  ]);
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));
  const reviewerLoads = new Map<string, number>();
  for (const record of records) {
    if (record.assignedReviewerUserId && record.status !== "approved") {
      const id = record.assignedReviewerUserId.toString();
      reviewerLoads.set(id, (reviewerLoads.get(id) ?? 0) + 1);
    }
  }

  return records.flatMap((record) => {
    const client = usersById.get(record.userId.toString());
    if (!client) return [];
    const workflow = workflows.find((item) => item.clientUserId?.toString() === record.userId.toString());
    const answers = answersFromRecord(record.answers);
    const reviewsByRequirement = new Map(
      (record.requirementReviews ?? []).map((review) => [review.requirementId, review]),
    );
    const reviewer = record.assignedReviewerUserId
      ? usersById.get(record.assignedReviewerUserId.toString())
      : undefined;
    const submittedAt = record.submittedAt ?? record.updatedAt ?? new Date();
    const reviewDueAt = new Date(submittedAt.getTime() + 2 * DAY_MS);
    const status = submissionStatus(record.status);
    const completedStatus = record.status === "approved";
    const overdue = !completedStatus && Date.now() > reviewDueAt.getTime();
    const overdueDays = Math.max(0, Math.floor((Date.now() - reviewDueAt.getTime()) / DAY_MS));
    const hasPepExposure = answers.politically_exposed?.toLowerCase() === "yes";

    const answerRequirements: KycRequirement[] = CLIENT_KYC_QUESTIONS.map((question) => {
      const answer = answers[question.id] ?? "";
      const id = `live-${record._id.toString()}-${question.id}`;
      const review = reviewsByRequirement.get(id);
      return {
        id,
        section: questionSection(question.id),
        name: question.label,
        instructions: question.helpText,
        required: question.required,
        status: requirementStatus(record.status, Boolean(answer), review?.decision),
        clientAnswer: answer,
        issues: [],
        documentVersions: [],
        internalNotes: review?.note ? [review.note] : [],
        clientFeedback:
          review?.note && ["replacement_requested", "rejected"].includes(review.decision)
            ? [review.note]
            : [],
      };
    });

    const evidenceDefinitions: Array<{
      key: string;
      name: string;
      section: KycRequirementSection;
      documentTypes: string[];
      tokens: string[];
      required: boolean;
    }> = [
      { key: "identification", name: "Identification", section: "Client Identity", documentTypes: ["identity_card"], tokens: ["national", "identity", "id", "passport"], required: true },
      { key: "tax-pin", name: "Tax PIN", section: "Tax Information", documentTypes: ["tax_pin"], tokens: ["kra", "pin", "tax"], required: true },
      { key: "proof-of-address", name: "Proof of location", section: "Address Verification", documentTypes: ["proof_of_location"], tokens: ["location", "address", "utility", "proof"], required: false },
    ];
    const evidenceRequirements: KycRequirement[] = evidenceDefinitions.map((definition) => {
      const id = `live-${record._id.toString()}-${definition.key}`;
      const review = reviewsByRequirement.get(id);
      const document = [...(record.documents ?? [])]
        .sort((left, right) => (right.uploadedAt?.getTime() ?? 0) - (left.uploadedAt?.getTime() ?? 0))
        .find((item) => {
        if (item.documentType && definition.documentTypes.includes(item.documentType)) return true;
        const searchable = `${item.documentType ?? ""} ${item.filename ?? ""}`.toLowerCase();
        return definition.tokens.some((token) => searchable.includes(token));
      });
      const issues = documentIssues(document);
      const expired = issues.includes("Expired");
      const statusValue = expired
        ? "expired"
        : requirementStatus(record.status, Boolean(document), review?.decision);
      return {
        id,
        section: definition.section,
        name: definition.name,
        instructions: `Confirm the uploaded ${definition.name.toLowerCase()} before the engagement proceeds.`,
        required: definition.required,
        status: statusValue,
        clientAnswer: document ? "Document uploaded" : "No document uploaded",
        issues,
        documentVersions: document ? [documentVersion(document, submittedAt)] : [],
        internalNotes: review?.note ? [review.note] : [],
        clientFeedback:
          review?.note && ["replacement_requested", "rejected"].includes(review.decision)
            ? [review.note]
            : [],
      };
    });
    const requirements = [...answerRequirements, ...evidenceRequirements];
    const submitted = requirements.filter((item) => item.status !== "not_submitted").length;
    const approved = requirements.filter((item) => item.status === "approved").length;
    const mandatory = requirements.filter((item) => item.required);
    const mandatoryApproved = mandatory.filter((item) => item.status === "approved").length;
    const issues = Array.from(new Set(evidenceRequirements.flatMap((item) => item.issues)));
    const reviewerLoad = record.assignedReviewerUserId
      ? reviewerLoads.get(record.assignedReviewerUserId.toString()) ?? 0
      : 0;
    const riskLevel: KycRiskLevel = hasPepExposure ? "high" : completedStatus ? "low" : "standard";
    const alerts: KycSubmission["alerts"] = [];
    if (!reviewer) alerts.push({ severity: "warning", message: "This submission has no assigned reviewer.", action: "Assign reviewer" });
    if (issues.length > 0) alerts.push({ severity: "warning", message: "Some required documents need attention.", action: "Review documents" });
    if (hasPepExposure) alerts.push({ severity: "danger", message: "Politically exposed person declaration requires senior review.", action: "Escalate review" });
    if (overdue) alerts.push({ severity: "danger", message: `The review is ${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue.`, action: "Open review" });

    const timeline: KycTimelineEvent[] = [
      {
        id: `${record._id.toString()}-submitted`,
        actor: userName(client),
        action: "KYC questionnaire submitted",
        at: submittedAt.toISOString(),
        statusChange: "Draft to Submitted",
        internal: false,
      },
      ...(record.assignedAt && reviewer
        ? [{
            id: `${record._id.toString()}-assigned`,
            actor: userName(reviewer),
            action: "KYC reviewer assigned",
            at: record.assignedAt.toISOString(),
            statusChange: "Reviewer assigned",
            internal: true,
          }]
        : []),
      ...(record.requirementReviews ?? []).map((review) => ({
        id: `${record._id.toString()}-${review.requirementId}-${review.reviewedAt.toISOString()}`,
        actor: usersById.get(review.reviewedByUserId.toString())
          ? userName(usersById.get(review.reviewedByUserId.toString()) as LiveKycUser)
          : "KYC reviewer",
        action: `Requirement ${review.decision.replaceAll("_", " ")}`,
        at: review.reviewedAt.toISOString(),
        requirement: requirements.find((item) => item.id === review.requirementId)?.name,
        note: review.note,
        internal: true,
      })),
      ...(completedStatus
        ? [{
            id: `${record._id.toString()}-approved`,
            actor: reviewer ? userName(reviewer) : workflow?.responsibleUserName || "KYC reviewer",
            action: "KYC approved",
            at: (record.updatedAt ?? submittedAt).toISOString(),
            statusChange: "Under Review to Approved",
            internal: false,
          }]
        : []),
    ].sort((left, right) => new Date(left.at).getTime() - new Date(right.at).getTime());

    return [{
      id: `client-kyc-${record._id.toString()}`,
      reference: `KYC-${record._id.toString().slice(-6).toUpperCase()}`,
      clientName: userName(client),
      clientType: client.roleKeys?.includes("client_representative") ? "client_representative" : "individual",
      primaryContact: client.email,
      clientHref: `/admin/clients/${client._id.toString()}`,
      engagementReference: workflow?.reference ?? "Engagement pending",
      engagementHref: workflow ? `/admin/active-engagements/${workflow._id.toString()}?tab=overview` : "/admin/active-engagements",
      service: workflow?.serviceName ?? "Consulting services",
      template: record.questionnaireVersion ?? "individual-v1",
      status,
      riskLevel,
      submittedAt: submittedAt.toISOString(),
      reviewDueAt: reviewDueAt.toISOString(),
      waitingTime: completedStatus ? "Approved" : elapsedLabel(submittedAt),
      assignedReviewer: reviewer ? userName(reviewer) : workflow?.responsibleUserName || "Unassigned",
      reviewerRole: reviewer?.roleKeys?.includes("reviewer") ? "Reviewer" : "Compliance reviewer",
      reviewerLoad,
      reviewerOverdue: 0,
      reviewerTurnaround: "Not measured",
      completion: {
        submitted,
        total: requirements.length,
        approved,
        mandatoryApproved,
        mandatoryTotal: mandatory.length,
      },
      documentIssues: issues,
      seniorReviewRequired: hasPepExposure,
      overdue,
      slaStatus: overdueDays >= 5 ? "Severely Overdue" : overdue ? "Overdue" : reviewDueAt.getTime() - Date.now() <= DAY_MS ? "Due Soon" : "On Track",
      nextAction: completedStatus
        ? "KYC is complete. Continue with the active engagement."
        : !reviewer
          ? "Assign a reviewer to this submission."
          : "Review the submitted questionnaire and supporting evidence.",
      canProceed: ["submitted", "under_review"].includes(record.status ?? "")
        && answerRequirements.filter((item) => item.required).every((item) => Boolean(item.clientAnswer)),
      returningClientMode: "Full KYC",
      alerts,
      requirements,
      previousReviews: [],
      finalChecklist: [
        { label: "All mandatory requirements approved", state: mandatoryApproved === mandatory.length ? "Complete" : "Incomplete" },
        { label: "No expired mandatory documents", state: issues.includes("Expired") ? "Incomplete" : "Complete" },
        { label: "Reviewer assigned", state: reviewer ? "Complete" : "Incomplete" },
        { label: "Senior approval completed where necessary", state: hasPepExposure ? "Incomplete" : "Not Applicable" },
      ],
      timeline,
    }];
  });
}

function percent(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export function getKycProgress(submission: KycSubmission) {
  return {
    submissionPercent: percent(submission.completion.submitted, submission.completion.total),
    reviewPercent: percent(submission.completion.approved, submission.completion.total),
  };
}

function expiringDocumentsFrom(submissions: KycSubmission[]) {
  const now = Date.now();
  return submissions.flatMap((submission) =>
    submission.requirements.flatMap((requirement) =>
      requirement.documentVersions
        .filter((document) => document.expiryDate)
        .map((document) => {
          const expiry = new Date(`${document.expiryDate}T00:00:00.000Z`);
          const daysRemaining = Math.ceil((expiry.getTime() - now) / DAY_MS);
          return {
            client: submission.clientName,
            document: document.filename,
            documentType: requirement.name,
            expiryDate: document.expiryDate ?? "",
            daysRemaining,
            engagement: submission.engagementReference,
            kycStatus: KYC_STATUS_LABELS[submission.status],
            assignedReviewer: submission.assignedReviewer,
            replacementStatus: daysRemaining < 0 ? "Replacement required" : "Current",
            riskLevel: KYC_RISK_LABELS[submission.riskLevel],
            href: `/admin/kyc/${submission.id}`,
          };
        })
        .filter((document) => document.daysRemaining <= 60),
    ),
  );
}

export async function getKycDashboardData(): Promise<KycDashboardData> {
  const allSubmissions = await listKycSubmissions();
  const pending = allSubmissions.filter((submission) =>
    ["submitted", "pending_review", "under_review", "resubmitted"].includes(submission.status),
  );
  const changes = allSubmissions.filter((submission) => submission.status === "changes_requested");
  const overdue = allSubmissions.filter((submission) => submission.overdue);
  const elevated = allSubmissions.filter((submission) => ["elevated", "high"].includes(submission.riskLevel));
  const approved = allSubmissions.filter((submission) => submission.status === "approved");
  const expiring = expiringDocumentsFrom(allSubmissions);
  const unassigned = pending.filter((submission) => submission.assignedReviewer === "Unassigned").length;
  const highRisk = elevated.filter((submission) => submission.riskLevel === "high").length;
  const approvalRate = percent(approved.length, allSubmissions.length);
  const expired = expiring.filter((document) => document.daysRemaining < 0).length;
  const assigned = pending.length - unassigned;

  return {
    summaryCards: [
      { key: "pending", label: "Pending Review", value: String(pending.length), supportingMetric: `${unassigned} unassigned`, statusLine: pending.length ? "Open the queue to continue reviews" : "No reviews are waiting", href: "/admin/kyc?view=awaiting-review", tone: "blue" },
      { key: "changes", label: "Changes Requested", value: String(changes.length), supportingMetric: `${changes.reduce((total, item) => total + item.documentIssues.length, 0)} document issues`, statusLine: changes.length ? "Clients have updates to complete" : "No client updates are waiting", href: "/admin/kyc?status=changes_requested", tone: "amber" },
      { key: "overdue", label: "Overdue Reviews", value: String(overdue.length), supportingMetric: `${overdue.filter((item) => item.riskLevel === "high").length} high risk`, statusLine: overdue.length ? "These reviews need attention" : "All reviews are within the target", href: "/admin/kyc?overdue=1", tone: "red" },
      { key: "risk", label: "Elevated Risk", value: String(elevated.length), supportingMetric: `${highRisk} high risk`, statusLine: elevated.length ? "Senior review may be required" : "No elevated-risk submissions", href: "/admin/kyc?risk=elevated", tone: "purple" },
      { key: "approved", label: "Approved", value: String(approved.length), supportingMetric: `${approvalRate}% approval rate`, statusLine: `${allSubmissions.length} total saved submissions`, href: "/admin/kyc/reports", tone: "green" },
      { key: "expiring", label: "Expiring Documents", value: String(expiring.length), supportingMetric: `${expired} already expired`, statusLine: "Documents due within 60 days", href: "/admin/kyc/expiring-documents", tone: "orange" },
    ],
    savedViews: [
      { label: "Awaiting Review", href: "/admin/kyc?view=awaiting-review", count: pending.length },
      { label: "Assigned", href: "/admin/kyc?view=assigned", count: assigned },
      { label: "Unassigned", href: "/admin/kyc?view=unassigned", count: unassigned },
      { label: "Overdue", href: "/admin/kyc?overdue=1", count: overdue.length },
      { label: "Elevated Risk", href: "/admin/kyc?risk=elevated", count: elevated.length },
      { label: "Changes Requested", href: "/admin/kyc?status=changes_requested", count: changes.length },
      { label: "Expiring Documents", href: "/admin/kyc/expiring-documents", count: expiring.length },
      { label: "Approved", href: "/admin/kyc/reports", count: approved.length },
    ],
    submissions: allSubmissions,
    permissionMatrix: KYC_PERMISSION_MATRIX,
    reviewerRules: KYC_REVIEWER_RULES,
  };
}

export async function getKycSubmissionDetail(submissionId: string) {
  return (await listKycSubmissions()).find((submission) => submission.id === submissionId) ?? null;
}

export async function getExpiringKycDocuments() {
  return expiringDocumentsFrom(await listKycSubmissions());
}

export async function getKycTemplates() {
  await connectToDatabase();
  const rows = await KycTemplateModel.find({ archivedAt: null })
    .select("name clientType requirements mandatory status owner")
    .sort({ status: 1, clientType: 1, name: 1 })
    .lean()
    .exec();
  return rows.map((row) => ({
    name: row.name,
    clientType: row.clientType,
    requirements: row.requirements,
    mandatory: row.mandatory,
    status: row.status,
    owner: row.owner,
  }));
}

export async function getKycRiskRules() {
  await connectToDatabase();
  const rows = await KycRiskRuleModel.find({ status: "active" })
    .select("rule risk action owner")
    .sort({ risk: -1, rule: 1 })
    .lean()
    .exec();
  return rows.map((row) => ({ rule: row.rule, risk: row.risk, action: row.action, owner: row.owner }));
}

export type KycReviewerWorkloadRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  currentReviews: number;
  overdueReviews: number;
  averageTurnaround: string;
  availability: string;
  conflictWarning: string;
  assigned: boolean;
};

export async function getKycReviewerWorkload(submissionId?: string): Promise<KycReviewerWorkloadRecord[]> {
  await connectToDatabase();
  const reviewers = (await UserModel.find({ roleKeys: "reviewer", status: "active", archivedAt: null })
    .select("email firstName lastName roleKeys")
    .lean()
    .exec()) as LiveKycUser[];
  const reviewerIds = reviewers.map((reviewer) => reviewer._id);
  const overdueBefore = new Date(Date.now() - 2 * DAY_MS);
  const submissionObjectId = submissionId ? liveKycObjectId(submissionId) : null;
  const [workloads, overdueWorkloads, selectedSubmission] = await Promise.all([
    ClientKycSubmissionModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { assignedReviewerUserId: { $in: reviewerIds }, status: { $in: ["submitted", "under_review", "changes_requested"] } } },
      { $group: { _id: "$assignedReviewerUserId", count: { $sum: 1 } } },
    ]).exec(),
    ClientKycSubmissionModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { assignedReviewerUserId: { $in: reviewerIds }, status: { $in: ["submitted", "under_review"] }, submittedAt: { $lt: overdueBefore } } },
      { $group: { _id: "$assignedReviewerUserId", count: { $sum: 1 } } },
    ]).exec(),
    submissionObjectId
      ? ClientKycSubmissionModel.findById(submissionObjectId).select("assignedReviewerUserId").lean().exec()
      : null,
  ]);
  const workloadByReviewer = new Map(workloads.map((item) => [item._id.toString(), item.count]));
  const overdueByReviewer = new Map(overdueWorkloads.map((item) => [item._id.toString(), item.count]));
  const assignedReviewerId = selectedSubmission?.assignedReviewerUserId?.toString() ?? null;

  return reviewers
    .map((reviewer) => {
      const currentReviews = workloadByReviewer.get(reviewer._id.toString()) ?? 0;
      return {
        id: reviewer._id.toString(),
        name: userName(reviewer),
        email: reviewer.email,
        role: "Reviewer",
        currentReviews,
        overdueReviews: overdueByReviewer.get(reviewer._id.toString()) ?? 0,
        averageTurnaround: "Not measured",
        availability: currentReviews < 5 ? "Available" : "Limited",
        conflictWarning: "No recorded conflict",
        assigned: assignedReviewerId === reviewer._id.toString(),
      };
    })
    .sort((left, right) => {
      if (left.assigned !== right.assigned) return left.assigned ? -1 : 1;
      if (left.currentReviews !== right.currentReviews) return left.currentReviews - right.currentReviews;
      return left.name.localeCompare(right.name);
    });
}

export async function assignKycReviewer(submissionId: string, reviewerUserId: string, actor: Principal) {
  assertPermission(actor, "kyc.assign");
  const submissionObjectId = liveKycObjectId(submissionId);
  if (!submissionObjectId || !Types.ObjectId.isValid(reviewerUserId) || !Types.ObjectId.isValid(actor.id)) return false;
  await connectToDatabase();
  const [submission, reviewer] = await Promise.all([
    ClientKycSubmissionModel.findById(submissionObjectId).exec(),
    UserModel.findOne({ _id: reviewerUserId, roleKeys: "reviewer", status: "active", archivedAt: null })
      .select("email firstName lastName roleKeys")
      .lean()
      .exec(),
  ]);
  if (!submission || !reviewer) return false;

  const previousReviewerUserId = submission.assignedReviewerUserId?.toString() ?? null;
  submission.assignedReviewerUserId = new Types.ObjectId(reviewerUserId);
  submission.assignedByUserId = new Types.ObjectId(actor.id);
  submission.assignedAt = new Date();
  if (submission.status === "submitted") submission.status = "under_review";
  await submission.save();

  await Promise.all([
    createCommunicationNotification({
      recipientUserId: reviewerUserId,
      type: "task_assigned",
      title: "KYC review assigned",
      description: "A client KYC questionnaire is ready for your review.",
      relatedModule: "kyc",
      relatedRecordId: submission._id.toString(),
      actionUrl: `/staff/kyc/client-kyc-${submission._id.toString()}`,
      createdByUserId: actor.id,
    }),
    writeAuditLog({
      actor,
      action: previousReviewerUserId ? "kyc.reviewer_reassigned" : "kyc.reviewer_assigned",
      resourceType: "ClientKycSubmission",
      resourceId: submission._id.toString(),
      previousValues: { reviewerUserId: previousReviewerUserId },
      newValues: { reviewerUserId, reviewerName: userName(reviewer as LiveKycUser) },
    }),
  ]);
  return true;
}

export async function reviewKycRequirement(input: {
  submissionId: string;
  requirementId: string;
  decision: "approved" | "replacement_requested" | "escalated" | "rejected";
  note: string;
  actor: Principal;
}) {
  const submissionObjectId = liveKycObjectId(input.submissionId);
  if (!submissionObjectId || !Types.ObjectId.isValid(input.actor.id)) return false;
  if (!input.requirementId.startsWith(`live-${submissionObjectId.toString()}-`)) return false;
  await connectToDatabase();
  const submission = await ClientKycSubmissionModel.findById(submissionObjectId).exec();
  if (!submission) return false;

  const previousIndex = submission.requirementReviews.findIndex((review) => review.requirementId === input.requirementId);
  const previous = previousIndex >= 0 ? submission.requirementReviews[previousIndex] : undefined;
  if (previousIndex >= 0) submission.requirementReviews.splice(previousIndex, 1);
  submission.requirementReviews.push({
    requirementId: input.requirementId,
    decision: input.decision,
    note: input.note,
    reviewedByUserId: new Types.ObjectId(input.actor.id),
    reviewedAt: new Date(),
  });
  const documentTypeByRequirementSuffix: Record<string, string> = {
    identification: "identity_card",
    "tax-pin": "tax_pin",
    "proof-of-address": "proof_of_location",
  };
  const requirementSuffix = Object.keys(documentTypeByRequirementSuffix).find((suffix) => input.requirementId.endsWith(`-${suffix}`));
  if (requirementSuffix) {
    const documentType = documentTypeByRequirementSuffix[requirementSuffix];
    const document = [...submission.documents]
      .reverse()
      .find((item) => item.documentType === documentType);
    if (document) {
      document.reviewStatus = input.decision === "approved"
        ? "approved"
        : input.decision === "rejected"
          ? "rejected"
          : input.decision === "replacement_requested"
            ? "replacement_requested"
            : "submitted";
      document.rejectionReason = ["replacement_requested", "rejected"].includes(input.decision)
        ? input.note
        : "";
    }
  }
  submission.status = ["replacement_requested", "rejected"].includes(input.decision)
    ? "changes_requested"
    : "under_review";
  await submission.save();

  const tasks: Array<Promise<unknown>> = [writeAuditLog({
    actor: input.actor,
    action: `kyc.requirement_${input.decision}`,
    resourceType: "ClientKycSubmission",
    resourceId: submission._id.toString(),
    previousValues: previous ? { decision: previous.decision, note: previous.note } : null,
    newValues: { requirementId: input.requirementId, decision: input.decision, note: input.note },
  })];
  if (["replacement_requested", "rejected"].includes(input.decision)) {
    tasks.push(createCommunicationNotification({
      recipientUserId: submission.userId.toString(),
      type: "action_required",
      title: input.decision === "replacement_requested" ? "KYC information needs an update" : "KYC requirement needs attention",
      description: input.note || "Open your KYC page to review the requested change.",
      relatedModule: "kyc",
      relatedRecordId: submission._id.toString(),
      actionUrl: "/client/kyc",
      createdByUserId: input.actor.id,
    }));
  }
  await Promise.all(tasks);
  return true;
}

export async function getKycReports() {
  const [dashboard, reviewers] = await Promise.all([getKycDashboardData(), getKycReviewerWorkload()]);
  const submissions = dashboard.submissions;
  const pending = submissions.filter((item) => ["pending_review", "under_review"].includes(item.status)).length;
  const approved = submissions.filter((item) => item.status === "approved").length;
  const overdue = submissions.filter((item) => item.overdue).length;
  const changes = submissions.filter((item) => item.status === "changes_requested").length;
  const highRisk = submissions.filter((item) => item.riskLevel === "high").length;
  const expired = expiringDocumentsFrom(submissions).filter((item) => item.daysRemaining < 0).length;
  return [
    { name: "Pending KYC Reviews", metric: `${pending} open`, href: "/admin/kyc?view=awaiting-review" },
    { name: "KYC Status", metric: `${submissions.length} saved records`, href: "/admin/kyc" },
    { name: "KYC Approval Rate", metric: `${percent(approved, submissions.length)}%`, href: "/admin/reports" },
    { name: "KYC SLA Performance", metric: `${overdue} overdue`, href: "/admin/kyc?overdue=1" },
    { name: "Changes Requested", metric: `${changes} active`, href: "/admin/kyc?status=changes_requested" },
    { name: "Expired Documents", metric: `${expired} expired`, href: "/admin/kyc/expiring-documents" },
    { name: "High-Risk Submissions", metric: `${highRisk} high`, href: "/admin/kyc?risk=high" },
    { name: "Reviewer Workload", metric: `${reviewers.length} reviewers`, href: "/admin/kyc/reviewers" },
  ];
}

export function getKycStatusLabel(status: KycStatus) {
  return KYC_STATUS_LABELS[status];
}

export function getKycRequirementStatusLabel(status: KycRequirementStatus) {
  return KYC_REQUIREMENT_STATUS_LABELS[status];
}

export function getKycRiskLabel(risk: KycRiskLevel) {
  return KYC_RISK_LABELS[risk];
}

export function getKycClientTypeLabel(clientType: KycClientType) {
  return KYC_CLIENT_TYPE_LABELS[clientType];
}
