import type { Permission } from "@/features/authorization/permissions";

export const REPORT_CATEGORIES = [
  "executive",
  "clients",
  "engagements",
  "workflows_tasks",
  "staff",
  "kyc_compliance",
  "documents",
  "finance",
  "services",
  "communication",
  "notifications",
  "ai_usage",
  "template_usage",
  "archive",
  "audit_security",
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_DATE_RANGES = [
  "today",
  "last_7_days",
  "last_30_days",
  "current_month",
  "previous_month",
  "current_quarter",
  "previous_quarter",
  "current_year",
  "previous_year",
  "custom",
] as const;

export type ReportDateRangeKey = (typeof REPORT_DATE_RANGES)[number];

export const REPORT_EXPORT_FORMATS = ["csv", "xlsx", "pdf"] as const;

export type ReportExportFormat = (typeof REPORT_EXPORT_FORMATS)[number];

export type ReportChartType =
  | "line"
  | "bar"
  | "stacked_bar"
  | "donut"
  | "pipeline"
  | "table";

export type ReportTrendDirection = "up" | "down" | "flat";

export type ReportInterpretation = "positive" | "negative" | "neutral";

export type ReportMetricRule = {
  key: string;
  label: string;
  description: string;
  format: "number" | "currency" | "percent" | "days";
  interpretation: "higher_is_better" | "lower_is_better" | "neutral";
  drillDownHref: string;
};

export type ReportColumnDefinition = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type ReportDefinition = {
  key: string;
  title: string;
  description: string;
  category: ReportCategory;
  requiredPermission: Permission;
  dataSource: string;
  defaultDateRange: ReportDateRangeKey;
  availableFilters: string[];
  metrics: string[];
  dimensions: string[];
  groupings: string[];
  charts: ReportChartType[];
  exports: ReportExportFormat[];
  columns: ReportColumnDefinition[];
  drillDownRoutes: string[];
};

export type ReportCategoryMeta = {
  key: ReportCategory;
  label: string;
  description: string;
  icon:
    | "gauge"
    | "users"
    | "briefcase"
    | "workflow"
    | "staff"
    | "shield"
    | "documents"
    | "finance"
    | "services"
    | "message"
    | "bell"
    | "sparkles"
    | "templates"
    | "archive"
    | "audit";
  requiredPermission: Permission;
  primaryReportKey: string;
};

export const REPORT_CATEGORY_META: Record<ReportCategory, ReportCategoryMeta> = {
  executive: {
    key: "executive",
    label: "Executive Overview",
    description: "Business performance, delivery risk, finance, capacity and compliance.",
    icon: "gauge",
    requiredPermission: "reports.view_executive",
    primaryReportKey: "executive-overview",
  },
  clients: {
    key: "clients",
    label: "Clients",
    description: "Client register, growth, value, risk, KYC and activity reports.",
    icon: "users",
    requiredPermission: "reports.view_clients",
    primaryReportKey: "client-register",
  },
  engagements: {
    key: "engagements",
    label: "Engagements",
    description: "Active work, completion, risk, pipeline and service delivery reports.",
    icon: "briefcase",
    requiredPermission: "reports.view_engagements",
    primaryReportKey: "engagement-register",
  },
  workflows_tasks: {
    key: "workflows_tasks",
    label: "Workflows and Tasks",
    description: "Stage duration, bottlenecks, overdue work, approvals and client actions.",
    icon: "workflow",
    requiredPermission: "reports.view_workflows",
    primaryReportKey: "overdue-tasks",
  },
  staff: {
    key: "staff",
    label: "Staff Performance",
    description: "Workload, assignment, delivery performance and reviewer turnaround.",
    icon: "staff",
    requiredPermission: "reports.view_staff",
    primaryReportKey: "staff-workload",
  },
  kyc_compliance: {
    key: "kyc_compliance",
    label: "KYC and Compliance",
    description: "KYC status, review turnaround, expiry, risk and SLA reports.",
    icon: "shield",
    requiredPermission: "reports.view_kyc",
    primaryReportKey: "kyc-status",
  },
  documents: {
    key: "documents",
    label: "Documents",
    description: "Document register, uploads, reviews, versions, retention and archive.",
    icon: "documents",
    requiredPermission: "reports.view_documents",
    primaryReportKey: "document-register",
  },
  finance: {
    key: "finance",
    label: "Finance",
    description: "Invoices, payments, revenue, aging, reconciliation and statements.",
    icon: "finance",
    requiredPermission: "reports.view_finance",
    primaryReportKey: "finance-overview",
  },
  services: {
    key: "services",
    label: "Services",
    description: "Service demand, revenue, value, completion and workflow performance.",
    icon: "services",
    requiredPermission: "reports.view_services",
    primaryReportKey: "service-performance",
  },
  communication: {
    key: "communication",
    label: "Communication",
    description: "Conversations, response times, waiting queues and announcement activity.",
    icon: "message",
    requiredPermission: "reports.view_communication",
    primaryReportKey: "communication-response",
  },
  notifications: {
    key: "notifications",
    label: "Notifications",
    description: "Generated, unread, action-required and failed notification reports.",
    icon: "bell",
    requiredPermission: "reports.view_notifications",
    primaryReportKey: "notification-activity",
  },
  ai_usage: {
    key: "ai_usage",
    label: "AI Usage",
    description: "AI requests, users, token estimates, cost, failures and review status.",
    icon: "sparkles",
    requiredPermission: "reports.view_ai_usage",
    primaryReportKey: "ai-usage-overview",
  },
  template_usage: {
    key: "template_usage",
    label: "Template Usage",
    description: "Template categories, versions, usage and old-version exposure.",
    icon: "templates",
    requiredPermission: "reports.view_templates",
    primaryReportKey: "template-usage",
  },
  archive: {
    key: "archive",
    label: "Archive",
    description: "Archived records, retention expiry, legal hold and restore activity.",
    icon: "archive",
    requiredPermission: "reports.view_archive",
    primaryReportKey: "archive-retention",
  },
  audit_security: {
    key: "audit_security",
    label: "Audit and Security",
    description: "Read-only audit activity, permission changes and sensitive actions.",
    icon: "audit",
    requiredPermission: "reports.view_audit",
    primaryReportKey: "audit-activity",
  },
};

export const REPORT_METRIC_RULES: ReportMetricRule[] = [
  {
    key: "total_clients",
    label: "Total Clients",
    description: "Distinct clients represented in workflow and engagement records.",
    format: "number",
    interpretation: "higher_is_better",
    drillDownHref: "/admin/reports/client-register",
  },
  {
    key: "active_engagements",
    label: "Active Engagements",
    description: "Engagement workspaces that are currently active or on hold.",
    format: "number",
    interpretation: "neutral",
    drillDownHref: "/admin/reports/engagement-register?status=active",
  },
  {
    key: "engagements_at_risk",
    label: "Engagements at Risk",
    description: "Engagements with high or critical risk levels.",
    format: "number",
    interpretation: "lower_is_better",
    drillDownHref: "/admin/reports/engagement-risk",
  },
  {
    key: "total_engagement_value",
    label: "Total Engagement Value",
    description: "Estimated value calculated from paid and outstanding workflow financials.",
    format: "currency",
    interpretation: "higher_is_better",
    drillDownHref: "/admin/reports/finance-overview",
  },
  {
    key: "revenue_collected",
    label: "Revenue Collected",
    description: "Estimated collected amount from workflow financial status and balances.",
    format: "currency",
    interpretation: "higher_is_better",
    drillDownHref: "/admin/reports/finance-overview",
  },
  {
    key: "outstanding_invoices",
    label: "Outstanding Invoices",
    description: "Workflow records with an outstanding balance or unpaid invoice state.",
    format: "number",
    interpretation: "lower_is_better",
    drillDownHref: "/admin/reports/finance-overview?invoiceStatus=overdue",
  },
  {
    key: "overdue_balance",
    label: "Overdue Balance",
    description: "Outstanding balance on records past target due dates.",
    format: "currency",
    interpretation: "lower_is_better",
    drillDownHref: "/admin/reports/finance-overview?aging=overdue",
  },
  {
    key: "average_engagement_duration",
    label: "Average Engagement Duration",
    description: "Average active duration between start date and completion or current date.",
    format: "days",
    interpretation: "lower_is_better",
    drillDownHref: "/admin/reports/engagement-performance",
  },
  {
    key: "staff_utilization",
    label: "Staff Utilization",
    description: "Average workload score from open tasks, overdue work and active engagements.",
    format: "percent",
    interpretation: "neutral",
    drillDownHref: "/admin/reports/staff-workload",
  },
  {
    key: "pending_kyc_reviews",
    label: "Pending KYC Reviews",
    description: "Workflow stages and tasks that are waiting for KYC review or approval.",
    format: "number",
    interpretation: "lower_is_better",
    drillDownHref: "/admin/reports/kyc-status",
  },
  {
    key: "overdue_tasks",
    label: "Overdue Tasks",
    description: "Open workflow tasks with due dates before the reporting timestamp.",
    format: "number",
    interpretation: "lower_is_better",
    drillDownHref: "/admin/reports/overdue-tasks",
  },
];

function columns(
  labels: Array<[string, string] | [string, string, "left" | "right"]>,
): ReportColumnDefinition[] {
  return labels.map(([key, label, align]) =>
    align ? { key, label, align } : { key, label },
  );
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    key: "executive-overview",
    title: "Executive Overview",
    description: "Consultancy-wide performance, risk, finance, capacity and compliance summary.",
    category: "executive",
    requiredPermission: "reports.view_executive",
    dataSource: "workflows, templates, communication, audit and users",
    defaultDateRange: "last_30_days",
    availableFilters: ["dateRange", "service", "riskLevel", "currency", "compare"],
    metrics: REPORT_METRIC_RULES.map((rule) => rule.key),
    dimensions: ["service", "status", "riskLevel", "stage", "staffMember"],
    groupings: ["service", "status", "month", "staffMember"],
    charts: ["line", "bar", "donut", "pipeline"],
    exports: ["csv", "xlsx", "pdf"],
    columns: columns([
      ["metric", "Metric"],
      ["current", "Current Period", "right"],
      ["previous", "Previous Period", "right"],
      ["change", "Change", "right"],
      ["status", "Status"],
      ["drillDown", "Drill Down"],
    ]),
    drillDownRoutes: ["/admin/reports/engagement-register", "/admin/reports/finance-overview"],
  },
  {
    key: "client-register",
    title: "Client Register",
    description: "Searchable client and organization register derived from active platform records.",
    category: "clients",
    requiredPermission: "reports.view_clients",
    dataSource: "workflow client records",
    defaultDateRange: "current_year",
    availableFilters: ["dateRange", "clientType", "riskLevel", "service", "status"],
    metrics: ["total_clients", "new_clients", "active_clients", "outstanding_balance"],
    dimensions: ["clientType", "service", "riskLevel", "status"],
    groupings: ["clientType", "service", "riskLevel"],
    charts: ["bar", "donut", "table"],
    exports: ["csv", "xlsx"],
    columns: columns([
      ["client", "Client or Organization Name"],
      ["clientType", "Client Type"],
      ["registrationNumber", "Registration Number"],
      ["primaryContact", "Primary Contact"],
      ["industry", "Industry"],
      ["location", "Location"],
      ["accountManager", "Account Manager"],
      ["kycStatus", "KYC Status"],
      ["riskLevel", "Risk Level"],
      ["activeEngagements", "Active Engagements", "right"],
      ["outstandingBalance", "Outstanding Balance", "right"],
      ["lastActivity", "Last Activity"],
      ["status", "Client Status"],
    ]),
    drillDownRoutes: ["/admin/clients"],
  },
  {
    key: "engagement-register",
    title: "Engagement Register",
    description: "Operational register of active, completed, delayed and at-risk engagements.",
    category: "engagements",
    requiredPermission: "reports.view_engagements",
    dataSource: "workflow_instances",
    defaultDateRange: "last_30_days",
    availableFilters: ["dateRange", "service", "status", "stage", "manager", "riskLevel", "overdue"],
    metrics: ["active_engagements", "completed_engagements", "engagements_at_risk", "overdue_tasks"],
    dimensions: ["service", "status", "stage", "manager", "riskLevel"],
    groupings: ["service", "status", "stage", "manager"],
    charts: ["pipeline", "bar", "donut", "table"],
    exports: ["csv", "xlsx"],
    columns: columns([
      ["reference", "Engagement Number"],
      ["client", "Client"],
      ["service", "Service"],
      ["status", "Current Status"],
      ["stage", "Current Stage"],
      ["progress", "Progress", "right"],
      ["manager", "Engagement Manager"],
      ["team", "Assigned Team"],
      ["startDate", "Start Date"],
      ["dueDate", "Target Completion Date"],
      ["engagementValue", "Engagement Value", "right"],
      ["amountInvoiced", "Amount Invoiced", "right"],
      ["amountPaid", "Amount Paid", "right"],
      ["riskLevel", "Risk Level"],
      ["lastActivity", "Last Activity"],
    ]),
    drillDownRoutes: ["/admin/workflows"],
  },
  {
    key: "finance-overview",
    title: "Finance Overview",
    description: "Invoice, payment, revenue, outstanding balance and aging management report.",
    category: "finance",
    requiredPermission: "reports.view_finance",
    dataSource: "workflow financial state",
    defaultDateRange: "last_30_days",
    availableFilters: ["dateRange", "service", "invoiceStatus", "paymentStatus", "currency", "overdue"],
    metrics: ["total_engagement_value", "revenue_collected", "outstanding_invoices", "overdue_balance"],
    dimensions: ["service", "client", "invoiceStatus", "paymentStatus", "currency"],
    groupings: ["service", "client", "invoiceStatus", "agingBucket"],
    charts: ["line", "bar", "stacked_bar", "table"],
    exports: ["csv", "xlsx", "pdf"],
    columns: columns([
      ["invoice", "Invoice Number"],
      ["client", "Client"],
      ["engagement", "Engagement"],
      ["service", "Service"],
      ["dueDate", "Due Date"],
      ["currency", "Currency"],
      ["total", "Total", "right"],
      ["paid", "Paid", "right"],
      ["balance", "Balance", "right"],
      ["status", "Status"],
      ["daysOverdue", "Days Overdue", "right"],
    ]),
    drillDownRoutes: ["/admin/invoices", "/admin/payments"],
  },
  {
    key: "overdue-tasks",
    title: "Overdue Tasks",
    description: "Tasks past due date, grouped by assignee, department, priority and engagement.",
    category: "workflows_tasks",
    requiredPermission: "reports.view_workflows",
    dataSource: "workflow_instances.tasks",
    defaultDateRange: "last_30_days",
    availableFilters: ["assignee", "department", "priority", "service", "daysOverdue"],
    metrics: ["overdue_tasks", "high_priority_overdue", "average_overdue_days"],
    dimensions: ["assignee", "department", "priority", "service"],
    groupings: ["assignee", "department", "priority"],
    charts: ["bar", "table"],
    exports: ["csv", "xlsx"],
    columns: columns([
      ["task", "Task"],
      ["engagement", "Engagement"],
      ["client", "Client"],
      ["assignee", "Assignee"],
      ["department", "Department"],
      ["priority", "Priority"],
      ["dueDate", "Due Date"],
      ["daysOverdue", "Days Overdue", "right"],
      ["status", "Current Status"],
      ["blockingReason", "Blocking Reason"],
      ["manager", "Engagement Manager"],
    ]),
    drillDownRoutes: ["/admin/tasks"],
  },
  {
    key: "staff-workload",
    title: "Staff Workload",
    description: "Capacity, open tasks, active engagements, overdue work and workload levels.",
    category: "staff",
    requiredPermission: "reports.view_staff",
    dataSource: "workflow_instances.team and tasks",
    defaultDateRange: "last_30_days",
    availableFilters: ["staffMember", "department", "role", "workloadLevel"],
    metrics: ["active_engagements", "open_tasks", "overdue_tasks", "staff_utilization"],
    dimensions: ["staffMember", "department", "role", "workloadLevel"],
    groupings: ["department", "role", "workloadLevel"],
    charts: ["bar", "stacked_bar", "table"],
    exports: ["csv", "xlsx"],
    columns: columns([
      ["staffMember", "Staff Member"],
      ["role", "Role"],
      ["department", "Department"],
      ["activeEngagements", "Active Engagements", "right"],
      ["openTasks", "Open Tasks", "right"],
      ["overdueTasks", "Overdue Tasks", "right"],
      ["pendingReviews", "Pending Reviews", "right"],
      ["estimatedHours", "Estimated Hours", "right"],
      ["workloadLevel", "Workload Level"],
      ["availability", "Availability"],
    ]),
    drillDownRoutes: ["/admin/staff"],
  },
  {
    key: "kyc-status",
    title: "KYC Status",
    description: "KYC completion, pending reviews, risk levels, missing items and turnaround.",
    category: "kyc_compliance",
    requiredPermission: "reports.view_kyc",
    dataSource: "workflow_instances KYC stages and tasks",
    defaultDateRange: "last_30_days",
    availableFilters: ["kycStatus", "riskLevel", "reviewer", "clientType"],
    metrics: ["pending_kyc_reviews", "approved_kyc", "overdue_kyc"],
    dimensions: ["riskLevel", "reviewer", "kycStatus"],
    groupings: ["riskLevel", "reviewer", "kycStatus"],
    charts: ["bar", "donut", "table"],
    exports: ["csv", "xlsx"],
    columns: columns([
      ["client", "Client"],
      ["clientType", "Client Type"],
      ["engagement", "Engagement"],
      ["kycTemplate", "KYC Template"],
      ["completion", "Completion Percentage", "right"],
      ["submissionStatus", "Submission Status"],
      ["reviewStatus", "Review Status"],
      ["riskLevel", "Risk Level"],
      ["reviewer", "Assigned Reviewer"],
      ["submittedDate", "Submitted Date"],
      ["approvalDate", "Approval Date"],
      ["missingItems", "Missing Items"],
    ]),
    drillDownRoutes: ["/admin/kyc"],
  },
  {
    key: "document-register",
    title: "Document Register",
    description: "Secure document activity, review state, visibility and archive readiness.",
    category: "documents",
    requiredPermission: "reports.view_documents",
    dataSource: "workflow_instances.documents",
    defaultDateRange: "last_30_days",
    availableFilters: ["client", "engagement", "documentStatus", "visibility", "archived"],
    metrics: ["documents_uploaded", "pending_reviews", "approved_documents"],
    dimensions: ["documentStatus", "visibility", "client", "engagement"],
    groupings: ["documentStatus", "visibility"],
    charts: ["bar", "table"],
    exports: ["csv", "xlsx"],
    columns: columns([
      ["documentName", "Document Name"],
      ["client", "Client"],
      ["engagement", "Engagement"],
      ["category", "Category"],
      ["fileType", "File Type"],
      ["version", "Version", "right"],
      ["uploadedBy", "Uploaded By"],
      ["uploadDate", "Upload Date"],
      ["reviewStatus", "Review Status"],
      ["visibility", "Visibility"],
      ["archiveStatus", "Archive Status"],
    ]),
    drillDownRoutes: ["/admin/documents"],
  },
  {
    key: "service-performance",
    title: "Service Performance",
    description: "Service demand, revenue, completion rate, value and risk by service line.",
    category: "services",
    requiredPermission: "reports.view_services",
    dataSource: "workflow_instances",
    defaultDateRange: "current_year",
    availableFilters: ["service", "status", "riskLevel", "clientType"],
    metrics: ["engagement_count", "completion_rate", "total_revenue", "outstanding_balance"],
    dimensions: ["service", "status", "clientType"],
    groupings: ["service"],
    charts: ["bar", "line", "table"],
    exports: ["csv", "xlsx"],
    columns: columns([
      ["service", "Service"],
      ["engagementCount", "Engagement Count", "right"],
      ["activeEngagements", "Active Engagements", "right"],
      ["completedEngagements", "Completed Engagements", "right"],
      ["completionRate", "Completion Rate", "right"],
      ["averageDuration", "Average Duration", "right"],
      ["totalEngagementValue", "Total Engagement Value", "right"],
      ["totalRevenue", "Total Revenue", "right"],
      ["outstandingBalance", "Outstanding Balance", "right"],
      ["atRiskEngagements", "At-Risk Engagements", "right"],
    ]),
    drillDownRoutes: ["/admin/services"],
  },
  {
    key: "communication-response",
    title: "Communication Response",
    description: "Conversation waiting state, response activity and unresolved queues.",
    category: "communication",
    requiredPermission: "reports.view_communication",
    dataSource: "communication_conversations and messages",
    defaultDateRange: "last_30_days",
    availableFilters: ["status", "relatedModule", "assignedStaff", "waitingFor"],
    metrics: ["unresolved_conversations", "waiting_beyond_sla", "message_volume"],
    dimensions: ["status", "relatedModule", "waitingFor"],
    groupings: ["status", "relatedModule"],
    charts: ["bar", "table"],
    exports: ["csv", "xlsx"],
    columns: columns([
      ["conversation", "Conversation"],
      ["client", "Client"],
      ["engagement", "Engagement"],
      ["assignedStaff", "Assigned Staff"],
      ["waitingFor", "Waiting For"],
      ["lastMessageDate", "Last Message Date"],
      ["waitingDuration", "Waiting Duration", "right"],
      ["status", "Status"],
    ]),
    drillDownRoutes: ["/admin/messages"],
  },
  {
    key: "notification-activity",
    title: "Notification Activity",
    description: "Generated, unread, action-required and announcement notification activity.",
    category: "notifications",
    requiredPermission: "reports.view_notifications",
    dataSource: "communication_notifications",
    defaultDateRange: "last_30_days",
    availableFilters: ["notificationType", "role", "readStatus", "actionRequired"],
    metrics: ["generated", "read", "unread", "action_required"],
    dimensions: ["type", "role", "readStatus"],
    groupings: ["type", "readStatus"],
    charts: ["bar", "donut", "table"],
    exports: ["csv"],
    columns: columns([
      ["title", "Notification"],
      ["type", "Type"],
      ["recipient", "Recipient"],
      ["role", "Role"],
      ["readStatus", "Read Status"],
      ["actionUrl", "Action"],
      ["createdDate", "Created Date"],
    ]),
    drillDownRoutes: ["/admin/notifications"],
  },
  {
    key: "ai-usage-overview",
    title: "AI Usage Overview",
    description: "AI requests, users, estimated tokens, cost, failures and drafts awaiting review.",
    category: "ai_usage",
    requiredPermission: "reports.view_ai_usage",
    dataSource: "AI usage records",
    defaultDateRange: "last_30_days",
    availableFilters: ["user", "role", "tool", "status", "model"],
    metrics: ["total_ai_requests", "active_users", "estimated_tokens", "failed_requests"],
    dimensions: ["user", "role", "tool", "model", "status"],
    groupings: ["role", "tool", "status"],
    charts: ["line", "bar", "table"],
    exports: ["csv", "xlsx"],
    columns: columns([
      ["user", "User"],
      ["role", "Role"],
      ["tool", "AI Tool"],
      ["client", "Client"],
      ["engagement", "Engagement"],
      ["model", "Model"],
      ["tokenEstimate", "Token Estimate", "right"],
      ["costEstimate", "Cost Estimate", "right"],
      ["status", "Status"],
      ["createdDate", "Created Date"],
    ]),
    drillDownRoutes: ["/admin/ai-usage"],
  },
  {
    key: "template-usage",
    title: "Template Usage",
    description: "Published, draft, review and version usage across reusable templates.",
    category: "template_usage",
    requiredPermission: "reports.view_templates",
    dataSource: "templates and template_usage",
    defaultDateRange: "last_30_days",
    availableFilters: ["category", "status", "service", "version", "usageCount"],
    metrics: ["published_templates", "draft_templates", "templates_awaiting_review", "template_usage"],
    dimensions: ["category", "status", "service", "version"],
    groupings: ["category", "status"],
    charts: ["bar", "table"],
    exports: ["csv", "xlsx"],
    columns: columns([
      ["templateName", "Template Name"],
      ["category", "Category"],
      ["version", "Version", "right"],
      ["status", "Status"],
      ["usageCount", "Usage Count", "right"],
      ["activeEngagementUsage", "Active Engagement Usage", "right"],
      ["lastUsed", "Last Used"],
      ["updatedBy", "Updated By"],
    ]),
    drillDownRoutes: ["/admin/templates"],
  },
  {
    key: "archive-retention",
    title: "Archive Retention",
    description: "Archived records, read-only workspaces, retention expiry and legal hold.",
    category: "archive",
    requiredPermission: "reports.view_archive",
    dataSource: "workflow archive state and audit logs",
    defaultDateRange: "current_year",
    availableFilters: ["recordType", "archivedStatus", "retentionExpiry", "legalHold"],
    metrics: ["archived_records", "retention_due", "legal_hold"],
    dimensions: ["recordType", "archiveStatus", "legalHold"],
    groupings: ["recordType", "archiveStatus"],
    charts: ["bar", "table"],
    exports: ["csv", "xlsx"],
    columns: columns([
      ["record", "Record"],
      ["recordType", "Record Type"],
      ["client", "Client"],
      ["engagement", "Engagement"],
      ["archiveDate", "Archive Date"],
      ["retentionExpiry", "Retention Expiry"],
      ["legalHold", "Legal Hold"],
      ["restoreEligibility", "Restore Eligibility"],
    ]),
    drillDownRoutes: ["/admin/archive"],
  },
  {
    key: "audit-activity",
    title: "Audit Activity",
    description: "Read-only audit trail for sensitive system, finance, template and archive actions.",
    category: "audit_security",
    requiredPermission: "reports.view_audit",
    dataSource: "audit_logs",
    defaultDateRange: "last_30_days",
    availableFilters: ["actor", "role", "action", "module", "resource", "dateRange"],
    metrics: ["audit_events", "sensitive_actions", "permission_changes"],
    dimensions: ["actor", "action", "resourceType", "role"],
    groupings: ["action", "resourceType", "actor"],
    charts: ["bar", "table"],
    exports: ["csv", "xlsx"],
    columns: columns([
      ["timestamp", "Timestamp"],
      ["actor", "Actor"],
      ["roleSnapshot", "Role Snapshot"],
      ["action", "Action"],
      ["resourceType", "Resource Type"],
      ["resourceReference", "Resource Reference"],
      ["reason", "Reason"],
    ]),
    drillDownRoutes: ["/admin/audit"],
  },
];

export function getReportDefinition(reportKey: string) {
  return REPORT_DEFINITIONS.find((report) => report.key === reportKey) ?? null;
}

export function getReportsByCategory(category: ReportCategory) {
  return REPORT_DEFINITIONS.filter((report) => report.category === category);
}
