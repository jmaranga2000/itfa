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
  comparison?: {
    label: string;
    entered: string;
    document: string;
    warning: string;
  };
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

function documentVersion(
  id: string,
  label: string,
  filename: string,
  reviewStatus: string,
  uploadedAt: string,
  expiryDate: string | null = null,
  rejectionReason?: string,
): KycDocumentVersion {
  return {
    id,
    label,
    filename,
    fileType: filename.endsWith(".pdf") ? "PDF" : "Image",
    fileSize: filename.endsWith(".pdf") ? "2.4 MB" : "840 KB",
    uploadedBy: "Client representative",
    uploadedAt,
    documentDate: "2026-06-20",
    expiryDate,
    version: Number(id.split("-").at(-1) ?? 1),
    checksum: `sha256:${id.replaceAll("-", "").slice(0, 12)}`,
    reviewStatus,
    rejectionReason,
  };
}

const submissions: KycSubmission[] = [
  {
    id: "kyc-2026-014",
    reference: "KYC-2026-014",
    clientName: "Amani Holdings Limited",
    clientType: "corporate",
    primaryContact: "Njeri Mwangi",
    clientHref: "/admin/clients",
    engagementReference: "ENG-2026-014",
    engagementHref: "/admin/active-engagements",
    service: "Corporate tax planning",
    template: "Corporate onboarding - tax advisory",
    status: "pending_review",
    riskLevel: "elevated",
    submittedAt: "2026-07-13T09:30:00.000Z",
    reviewDueAt: "2026-07-16T17:00:00.000Z",
    waitingTime: "2 days",
    assignedReviewer: "Grace Wambui",
    reviewerRole: "Compliance reviewer",
    reviewerLoad: 7,
    reviewerOverdue: 2,
    reviewerTurnaround: "1.8 days",
    completion: { submitted: 8, total: 10, approved: 4, mandatoryApproved: 4, mandatoryTotal: 8 },
    documentIssues: ["Replacement Required", "Name Mismatch"],
    seniorReviewRequired: true,
    overdue: false,
    slaStatus: "Due Soon",
    nextAction: "Review company certificate mismatch and beneficial ownership notes.",
    canProceed: false,
    returningClientMode: "Full KYC",
    alerts: [
      {
        severity: "warning",
        message: "Company name differs between entered profile and certificate.",
        action: "Review the company registration requirement.",
      },
      {
        severity: "info",
        message: "Senior review is required because risk is elevated.",
        action: "Escalate after requirement review if mismatch remains unresolved.",
      },
    ],
    requirements: [
      {
        id: "company-certificate",
        section: "Company Information",
        name: "Company Registration Certificate",
        instructions: "Confirm legal name, registration number and certificate date.",
        required: true,
        status: "replacement_requested",
        clientAnswer: "Amani Holdings Limited, CPR/2020/11894.",
        issues: ["Name Mismatch", "Replacement Required"],
        documentVersions: [
          documentVersion(
            "kyc-2026-014-doc-2",
            "Current Version",
            "amani-registration-certificate.pdf",
            "Replacement requested",
            "2026-07-13T09:12:00.000Z",
            null,
          ),
          documentVersion(
            "kyc-2026-014-doc-1",
            "Rejected Version",
            "amani-certificate-scan.jpg",
            "Rejected",
            "2026-07-11T15:40:00.000Z",
            null,
            "Registration number was not visible.",
          ),
        ],
        internalNotes: ["Legal name appears as Amani Holding Ltd on the uploaded certificate."],
        clientFeedback: ["Please upload a clearer copy showing the full registered company name."],
        comparison: {
          label: "Company name",
          entered: "Amani Holdings Limited",
          document: "Amani Holding Ltd",
          warning: "Possible legal name mismatch. Treat as a review warning, not an automatic failure.",
        },
      },
      {
        id: "beneficial-ownership",
        section: "Beneficial Ownership",
        name: "Beneficial Ownership Declaration",
        instructions: "Confirm all beneficial owners above the reporting threshold.",
        required: true,
        status: "under_review",
        clientAnswer: "Three beneficial owners declared; one trust structure noted.",
        issues: ["Review Pending"],
        documentVersions: [
          documentVersion(
            "kyc-2026-014-doc-3",
            "Current Version",
            "beneficial-ownership-declaration.pdf",
            "Under review",
            "2026-07-13T09:20:00.000Z",
          ),
        ],
        internalNotes: ["Trust ownership requires senior guidance before final approval."],
        clientFeedback: [],
      },
      {
        id: "kra-pin",
        section: "Tax Information",
        name: "KRA PIN Certificate",
        instructions: "Validate tax registration and taxpayer name.",
        required: true,
        status: "approved",
        clientAnswer: "P052118940K",
        issues: [],
        documentVersions: [
          documentVersion(
            "kyc-2026-014-doc-4",
            "Current Version",
            "kra-pin-certificate.pdf",
            "Approved",
            "2026-07-13T09:24:00.000Z",
            "2026-08-10",
          ),
        ],
        internalNotes: ["PIN matches client profile."],
        clientFeedback: [],
      },
    ],
    previousReviews: [
      { reference: "KYC-2025-009", approvedAt: "2025-08-12", outcome: "Approved", riskLevel: "standard" },
    ],
    finalChecklist: [
      { label: "All mandatory requirements approved", state: "Incomplete" },
      { label: "No unresolved replacement requests", state: "Incomplete" },
      { label: "Senior approval completed where necessary", state: "Incomplete" },
      { label: "Reviewer assigned", state: "Complete" },
      { label: "Client identity confirmed", state: "Complete" },
    ],
    timeline: [
      {
        id: "kyc-014-t1",
        actor: "Client representative",
        action: "KYC submitted",
        at: "2026-07-13T09:30:00.000Z",
        statusChange: "In Progress to Pending Review",
        internal: false,
      },
      {
        id: "kyc-014-t2",
        actor: "Grace Wambui",
        action: "Replacement requested",
        at: "2026-07-14T11:20:00.000Z",
        requirement: "Company Registration Certificate",
        statusChange: "Under Review to Replacement Requested",
        note: "Registration number and company name need confirmation.",
        internal: false,
      },
      {
        id: "kyc-014-t3",
        actor: "Grace Wambui",
        action: "Internal risk note added",
        at: "2026-07-14T11:28:00.000Z",
        requirement: "Beneficial Ownership Declaration",
        note: "Trust structure requires senior review.",
        internal: true,
      },
    ],
  },
  {
    id: "kyc-2026-013",
    reference: "KYC-2026-013",
    clientName: "Nairobi Trade Co.",
    clientType: "returning",
    primaryContact: "David Otieno",
    clientHref: "/admin/clients",
    engagementReference: "ENG-2026-013",
    engagementHref: "/admin/active-engagements",
    service: "Transfer pricing review",
    template: "Returning client refresh",
    status: "changes_requested",
    riskLevel: "standard",
    submittedAt: "2026-07-09T08:00:00.000Z",
    reviewDueAt: "2026-07-12T17:00:00.000Z",
    waitingTime: "6 days",
    assignedReviewer: "Samuel Kariuki",
    reviewerRole: "Reviewer",
    reviewerLoad: 4,
    reviewerOverdue: 1,
    reviewerTurnaround: "2.2 days",
    completion: { submitted: 6, total: 7, approved: 5, mandatoryApproved: 5, mandatoryTotal: 6 },
    documentIssues: ["Expired", "Replacement Required"],
    seniorReviewRequired: false,
    overdue: true,
    slaStatus: "Overdue",
    nextAction: "Client must replace expired director identification.",
    canProceed: false,
    returningClientMode: "KYC Refresh",
    alerts: [
      {
        severity: "danger",
        message: "Review is overdue and one mandatory identity document has expired.",
        action: "Notify the client and request replacement.",
      },
    ],
    requirements: [
      {
        id: "director-id",
        section: "Directors",
        name: "Director Identification",
        instructions: "Verify current director identification for returning-client refresh.",
        required: true,
        status: "expired",
        clientAnswer: "Director ID uploaded.",
        issues: ["Expired", "Replacement Required"],
        documentVersions: [
          documentVersion(
            "kyc-2026-013-doc-1",
            "Current Version",
            "director-id.pdf",
            "Expired",
            "2026-07-09T08:00:00.000Z",
            "2026-07-10",
          ),
        ],
        internalNotes: ["Document expired before review completion."],
        clientFeedback: ["Please upload current director identification before the engagement can proceed."],
      },
    ],
    previousReviews: [
      { reference: "KYC-2024-044", approvedAt: "2024-10-02", outcome: "Approved", riskLevel: "standard" },
    ],
    finalChecklist: [
      { label: "All mandatory requirements approved", state: "Incomplete" },
      { label: "No expired mandatory documents", state: "Incomplete" },
      { label: "Reviewer assigned", state: "Complete" },
      { label: "Senior approval completed where necessary", state: "Not Applicable" },
    ],
    timeline: [
      {
        id: "kyc-013-t1",
        actor: "Samuel Kariuki",
        action: "Replacement requested",
        at: "2026-07-10T14:00:00.000Z",
        requirement: "Director Identification",
        statusChange: "Submitted to Replacement Requested",
        internal: false,
      },
    ],
  },
  {
    id: "kyc-2026-012",
    reference: "KYC-2026-012",
    clientName: "Kilele Foods",
    clientType: "corporate",
    primaryContact: "Lilian Achieng",
    clientHref: "/admin/clients",
    engagementReference: "ENG-2026-012",
    engagementHref: "/admin/active-engagements",
    service: "Payroll compliance",
    template: "Corporate onboarding - payroll",
    status: "under_review",
    riskLevel: "high",
    submittedAt: "2026-07-08T12:15:00.000Z",
    reviewDueAt: "2026-07-11T17:00:00.000Z",
    waitingTime: "7 days",
    assignedReviewer: "Unassigned",
    reviewerRole: "Senior reviewer required",
    reviewerLoad: 0,
    reviewerOverdue: 0,
    reviewerTurnaround: "Not assigned",
    completion: { submitted: 10, total: 10, approved: 7, mandatoryApproved: 7, mandatoryTotal: 9 },
    documentIssues: ["Review Pending"],
    seniorReviewRequired: true,
    overdue: true,
    slaStatus: "Severely Overdue",
    nextAction: "Assign senior reviewer for high-risk approval.",
    canProceed: false,
    returningClientMode: "Full KYC",
    alerts: [
      {
        severity: "danger",
        message: "High-risk submission is overdue and senior reviewer is not assigned.",
        action: "Assign a senior reviewer immediately.",
      },
    ],
    requirements: [
      {
        id: "declarations",
        section: "Declarations",
        name: "Compliance Declarations",
        instructions: "Confirm declaration responses and politically exposed person disclosure.",
        required: true,
        status: "escalated",
        clientAnswer: "One beneficial owner declared as politically exposed.",
        issues: ["Review Pending"],
        documentVersions: [
          documentVersion(
            "kyc-2026-012-doc-1",
            "Current Version",
            "declaration-form.pdf",
            "Escalated",
            "2026-07-08T12:15:00.000Z",
          ),
        ],
        internalNotes: ["PEP disclosure requires senior reviewer decision."],
        clientFeedback: [],
      },
    ],
    previousReviews: [],
    finalChecklist: [
      { label: "All mandatory requirements approved", state: "Incomplete" },
      { label: "No unresolved risk escalation", state: "Incomplete" },
      { label: "Reviewer assigned", state: "Incomplete" },
      { label: "Senior approval completed where necessary", state: "Incomplete" },
    ],
    timeline: [
      {
        id: "kyc-012-t1",
        actor: "System",
        action: "Escalation created",
        at: "2026-07-08T12:20:00.000Z",
        requirement: "Compliance Declarations",
        statusChange: "Submitted to Escalated",
        internal: true,
      },
    ],
  },
  {
    id: "kyc-2026-011",
    reference: "KYC-2026-011",
    clientName: "Blue Rift Advisory",
    clientType: "individual",
    primaryContact: "Brian Omondi",
    clientHref: "/admin/clients",
    engagementReference: "ENG-2026-011",
    engagementHref: "/admin/active-engagements",
    service: "KRA notice response",
    template: "Individual client onboarding",
    status: "approved",
    riskLevel: "low",
    submittedAt: "2026-07-02T10:10:00.000Z",
    reviewDueAt: "2026-07-05T17:00:00.000Z",
    waitingTime: "Approved",
    assignedReviewer: "Grace Wambui",
    reviewerRole: "Compliance reviewer",
    reviewerLoad: 7,
    reviewerOverdue: 2,
    reviewerTurnaround: "1.8 days",
    completion: { submitted: 6, total: 6, approved: 6, mandatoryApproved: 5, mandatoryTotal: 5 },
    documentIssues: [],
    seniorReviewRequired: false,
    overdue: false,
    slaStatus: "On Track",
    nextAction: "Engagement can proceed to letter generation.",
    canProceed: true,
    returningClientMode: "No Update Required",
    alerts: [],
    requirements: [
      {
        id: "identity",
        section: "Client Identity",
        name: "National ID",
        instructions: "Confirm individual identity document and profile details.",
        required: true,
        status: "approved",
        clientAnswer: "National ID uploaded.",
        issues: [],
        documentVersions: [
          documentVersion(
            "kyc-2026-011-doc-1",
            "Current Version",
            "national-id.pdf",
            "Approved",
            "2026-07-02T10:10:00.000Z",
            "2026-08-25",
          ),
        ],
        internalNotes: ["Identity confirmed."],
        clientFeedback: [],
      },
    ],
    previousReviews: [],
    finalChecklist: [
      { label: "All mandatory requirements approved", state: "Complete" },
      { label: "No expired mandatory documents", state: "Complete" },
      { label: "No unresolved replacement requests", state: "Complete" },
      { label: "Reviewer assigned", state: "Complete" },
      { label: "Senior approval completed where necessary", state: "Not Applicable" },
    ],
    timeline: [
      {
        id: "kyc-011-t1",
        actor: "Grace Wambui",
        action: "Full KYC approved",
        at: "2026-07-03T16:45:00.000Z",
        statusChange: "Under Review to Approved",
        internal: false,
      },
    ],
  },
];

function percent(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export function getKycProgress(submission: KycSubmission) {
  return {
    submissionPercent: percent(submission.completion.submitted, submission.completion.total),
    reviewPercent: percent(submission.completion.approved, submission.completion.total),
  };
}

export async function getKycDashboardData(): Promise<KycDashboardData> {
  const pending = submissions.filter((submission) =>
    ["submitted", "pending_review", "under_review", "resubmitted"].includes(submission.status),
  );
  const changes = submissions.filter((submission) => submission.status === "changes_requested");
  const overdue = submissions.filter((submission) => submission.overdue);
  const elevated = submissions.filter((submission) =>
    ["elevated", "high"].includes(submission.riskLevel),
  );
  const approved = submissions.filter((submission) => submission.status === "approved");
  const expiring = getExpiringKycDocumentsSync();

  return {
    summaryCards: [
      {
        key: "pending",
        label: "Pending Review",
        value: String(pending.length),
        supportingMetric: "1 unassigned",
        statusLine: "Oldest waiting: 7 days",
        href: "/admin/kyc?view=awaiting-review",
        tone: "blue",
      },
      {
        key: "changes",
        label: "Changes Requested",
        value: String(changes.length),
        supportingMetric: "2 replacement documents pending",
        statusLine: "Oldest client response: 6 days",
        href: "/admin/kyc?status=changes_requested",
        tone: "amber",
      },
      {
        key: "overdue",
        label: "Overdue Reviews",
        value: String(overdue.length),
        supportingMetric: "1 high-priority overdue",
        statusLine: "Longest delay: 7 days",
        href: "/admin/kyc?overdue=1",
        tone: "red",
      },
      {
        key: "risk",
        label: "Elevated Risk",
        value: String(elevated.length),
        supportingMetric: "1 high-risk submission",
        statusLine: "Senior review waiting",
        href: "/admin/kyc?risk=elevated",
        tone: "purple",
      },
      {
        key: "approved",
        label: "Approved This Month",
        value: String(approved.length),
        supportingMetric: "76% approval rate",
        statusLine: "Average review: 1.9 days",
        href: "/admin/kyc/reports",
        tone: "green",
      },
      {
        key: "expiring",
        label: "Expiring Documents",
        value: String(expiring.length),
        supportingMetric: "1 already expired",
        statusLine: "3 clients require refresh",
        href: "/admin/kyc/expiring-documents",
        tone: "orange",
      },
    ],
    savedViews: [
      { label: "Awaiting Review", href: "/admin/kyc?view=awaiting-review", count: pending.length },
      { label: "Assigned to Me", href: "/admin/kyc?view=assigned-to-me", count: 2 },
      { label: "Unassigned", href: "/admin/kyc?view=unassigned", count: 1 },
      { label: "Overdue", href: "/admin/kyc?overdue=1", count: overdue.length },
      { label: "Elevated Risk", href: "/admin/kyc?risk=elevated", count: elevated.length },
      { label: "Changes Requested", href: "/admin/kyc?status=changes_requested", count: changes.length },
      { label: "Expiring Documents", href: "/admin/kyc/expiring-documents", count: expiring.length },
      { label: "Approved This Month", href: "/admin/kyc/reports", count: approved.length },
    ],
    submissions,
    permissionMatrix: KYC_PERMISSION_MATRIX,
    reviewerRules: KYC_REVIEWER_RULES,
  };
}

export async function getKycSubmissionDetail(submissionId: string) {
  return submissions.find((submission) => submission.id === submissionId) ?? null;
}

function getExpiringKycDocumentsSync() {
  const today = new Date("2026-07-15T00:00:00.000Z");

  return submissions.flatMap((submission) =>
    submission.requirements.flatMap((requirement) =>
      requirement.documentVersions
        .filter((document) => document.expiryDate)
        .map((document) => {
          const expiry = new Date(`${document.expiryDate}T00:00:00.000Z`);
          const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);

          return {
            client: submission.clientName,
            document: document.filename,
            documentType: requirement.name,
            expiryDate: document.expiryDate ?? "",
            daysRemaining,
            engagement: submission.engagementReference,
            kycStatus: KYC_STATUS_LABELS[submission.status],
            assignedReviewer: submission.assignedReviewer,
            replacementStatus: requirement.status === "expired" ? "Replacement required" : "Current",
            riskLevel: KYC_RISK_LABELS[submission.riskLevel],
            href: `/admin/kyc/${submission.id}`,
          };
        })
        .filter((document) => document.daysRemaining <= 60),
    ),
  );
}

export async function getExpiringKycDocuments() {
  return getExpiringKycDocumentsSync();
}

export async function getKycTemplates() {
  return [
    {
      name: "Corporate onboarding - tax advisory",
      clientType: "Corporate",
      requirements: 10,
      mandatory: 8,
      status: "Published",
      owner: "Compliance admin",
    },
    {
      name: "Returning client refresh",
      clientType: "Returning client",
      requirements: 7,
      mandatory: 6,
      status: "Published",
      owner: "Engagement manager",
    },
    {
      name: "Individual client onboarding",
      clientType: "Individual",
      requirements: 6,
      mandatory: 5,
      status: "Published",
      owner: "Reviewer",
    },
    {
      name: "High-risk senior review",
      clientType: "Corporate",
      requirements: 12,
      mandatory: 11,
      status: "Review",
      owner: "Senior reviewer",
    },
  ];
}

export async function getKycRiskRules() {
  return [
    {
      rule: "Beneficial owner is politically exposed",
      risk: "High",
      action: "Senior review required",
      owner: "Senior reviewer",
    },
    {
      rule: "Company name mismatch",
      risk: "Elevated",
      action: "Request replacement or escalate",
      owner: "Compliance reviewer",
    },
    {
      rule: "Expired mandatory identity document",
      risk: "Standard",
      action: "Request replacement",
      owner: "Assigned reviewer",
    },
    {
      rule: "Repeated replacement failure",
      risk: "Elevated",
      action: "Escalate review",
      owner: "Engagement manager",
    },
  ];
}

export async function getKycReviewerWorkload() {
  return [
    {
      name: "Grace Wambui",
      role: "Compliance reviewer",
      currentReviews: 7,
      overdueReviews: 2,
      averageTurnaround: "1.8 days",
      availability: "Available",
      conflictWarning: "No conflict",
    },
    {
      name: "Samuel Kariuki",
      role: "Reviewer",
      currentReviews: 4,
      overdueReviews: 1,
      averageTurnaround: "2.2 days",
      availability: "Limited",
      conflictWarning: "Assigned to related engagement",
    },
    {
      name: "Miriam Njoroge",
      role: "Senior reviewer",
      currentReviews: 3,
      overdueReviews: 0,
      averageTurnaround: "1.4 days",
      availability: "Available",
      conflictWarning: "No conflict",
    },
  ];
}

export async function getKycReports() {
  return [
    { name: "Pending KYC Reviews", metric: "3 open", href: "/admin/kyc?view=awaiting-review" },
    { name: "KYC Status", metric: "4 active records", href: "/admin/kyc" },
    { name: "KYC Approval Rate", metric: "76%", href: "/admin/reports" },
    { name: "Review Turnaround Time", metric: "1.9 days", href: "/admin/reports" },
    { name: "KYC SLA Performance", metric: "2 overdue", href: "/admin/kyc?overdue=1" },
    { name: "Changes Requested", metric: "1 active", href: "/admin/kyc?status=changes_requested" },
    { name: "Expired Documents", metric: "1 expired", href: "/admin/kyc/expiring-documents" },
    { name: "High-Risk Submissions", metric: "1 high", href: "/admin/kyc?risk=high" },
    { name: "Reviewer Workload", metric: "3 reviewers", href: "/admin/kyc/reviewers" },
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
