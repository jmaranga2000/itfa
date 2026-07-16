import { Types } from "mongoose";
import {
  hasAnyPermission,
  hasPermission,
  type Principal,
} from "@/features/authorization/access-control";
import type { Permission } from "@/features/authorization/permissions";
import {
  calculateAverage,
  calculateCompletionRate,
  calculateDaysOverdue,
  calculateFinancialSnapshot,
  calculateStaffWorkload,
  compareMetric,
  isTaskOverdue,
  previousEquivalentPeriod,
  resolveReportDateRange,
  type ComparisonResult,
  type DateRange,
} from "@/features/reports/calculations";
import {
  REPORT_CATEGORY_META,
  REPORT_DEFINITIONS,
  REPORT_METRIC_RULES,
  getReportDefinition,
  getReportsByCategory,
  type ReportCategory,
  type ReportDateRangeKey,
  type ReportDefinition,
  type ReportInterpretation,
  type ReportTrendDirection,
} from "@/features/reports/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuthorizationError } from "@/lib/errors";
import { AuditLogModel } from "@/models/audit-log";
import { CommunicationConversationModel } from "@/models/communication-conversation";
import { CommunicationMessageModel } from "@/models/communication-message";
import { CommunicationNotificationModel } from "@/models/communication-notification";
import { ReportExportModel } from "@/models/report-export";
import { ReportSavedViewModel } from "@/models/report-saved-view";
import { ReportScheduleModel } from "@/models/report-schedule";
import { TemplateModel } from "@/models/template";
import { TemplateUsageModel } from "@/models/template-usage";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";

export type ReportFilters = {
  dateRange?: ReportDateRangeKey;
  service?: string;
  status?: string;
  stage?: string;
  riskLevel?: string;
  currency?: string;
  invoiceStatus?: string;
  paymentStatus?: string;
  archivedStatus?: string;
  compare?: boolean;
};

export type ReportKpi = {
  key: string;
  label: string;
  value: string;
  rawValue: number;
  format: "number" | "currency" | "percent" | "days";
  explanation: string;
  drillDownHref: string;
  comparison: {
    label: string;
    value: string;
    direction: ReportTrendDirection;
    interpretation: ReportInterpretation;
  };
};

export type ReportChart = {
  title: string;
  type: "line" | "bar" | "stacked_bar" | "donut" | "pipeline";
  description: string;
  data: Array<{ label: string; value: number; secondaryValue?: number }>;
};

export type ReportTable = {
  title: string;
  columns: ReportDefinition["columns"];
  rows: Array<Record<string, string | number>>;
};

export type ReportCategoryCard = {
  key: ReportCategory;
  label: string;
  description: string;
  icon: string;
  reportCount: number;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  lastGeneratedAt: string | null;
  href: string;
};

export type SavedReportSummary = {
  id: string;
  name: string;
  category: string;
  ownerName: string;
  lastOpenedAt: string | null;
  visibility: string;
  href: string;
};

export type ScheduledReportSummary = {
  id: string;
  name: string;
  reportKey: string;
  frequency: string;
  nextDeliveryAt: string | null;
  active: boolean;
};

export type ExportHistorySummary = {
  id: string;
  reportName: string;
  category: string;
  format: string;
  status: string;
  generatedByName: string;
  createdAt: string | null;
};

export type ReportAlert = {
  tone: "red" | "gold" | "green" | "slate";
  title: string;
  description: string;
  href: string;
};

export type ReportsLandingData = {
  dataFreshness: string;
  dateRange: DateRange;
  summary: ReportKpi[];
  categories: ReportCategoryCard[];
  recentlyViewed: SavedReportSummary[];
  savedReports: SavedReportSummary[];
  scheduledReports: ScheduledReportSummary[];
  exportHistory: ExportHistorySummary[];
  alerts: ReportAlert[];
  builderSteps: string[];
};

export type ReportDetailData = {
  definition: ReportDefinition;
  dataFreshness: string;
  dateRange: DateRange;
  previousDateRange: DateRange;
  filters: ReportFilters;
  kpis: ReportKpi[];
  charts: ReportChart[];
  table: ReportTable;
  insights: string[];
  exportHistory: ExportHistorySummary[];
  calculationNotes: string[];
};

type RawWorkflow = {
  _id: Types.ObjectId;
  reference: string;
  clientName: string;
  organizationName?: string;
  serviceName: string;
  status: string;
  currentStageKey: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskReason?: string;
  nextAction: string;
  responsibleUserName?: string;
  responsibleUserId?: Types.ObjectId | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  lastActivityAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  team?: Array<{
    userId?: Types.ObjectId | null;
    name: string;
    email?: string;
    role: string;
    department?: string;
    workloadLevel?: "available" | "balanced" | "high" | "overloaded";
  }>;
  stages?: Array<{
    key: string;
    name: string;
    status: string;
    dueAt?: Date | null;
    enteredAt?: Date | null;
    completedAt?: Date | null;
    clientVisible?: boolean;
  }>;
  tasks?: Array<{
    key: string;
    title: string;
    assignedUserName?: string;
    assignedRole: string;
    priority?: string;
    status: string;
    stageKey?: string;
    dueDate?: Date | null;
    estimatedHours?: number | null;
    approvalRequired?: boolean;
    blockerReason?: string | null;
    completedAt?: Date | null;
  }>;
  approvals?: Array<{
    title: string;
    status: string;
    approverName?: string;
    submittedAt?: Date | null;
    approvalDate?: Date | null;
  }>;
  clientActions?: Array<{
    title: string;
    status: string;
    dueDate?: Date | null;
    priority?: string;
  }>;
  documents?: Array<{
    documentId: string;
    name: string;
    status: string;
    version?: number;
    visibility?: string;
    uploadedAt?: Date | null;
  }>;
  financial?: {
    invoiceStatus?: string;
    paymentStatus?: string;
    balanceDue?: number;
    currency?: string;
  };
  archive?: {
    status?: string;
    retentionUntil?: Date | null;
    archivedAt?: Date | null;
    legalHoldReason?: string;
  };
  archivedAt?: Date | null;
};

type RawSavedReport = {
  _id: Types.ObjectId;
  name: string;
  category: ReportCategory;
  reportKey: string;
  ownerName?: string;
  visibility?: string;
  lastOpenedAt?: Date | null;
};

type RawExport = {
  _id: Types.ObjectId;
  reportName: string;
  category: ReportCategory;
  format: string;
  status: string;
  generatedByName?: string;
  createdAt?: Date | null;
};

type RawSchedule = {
  _id: Types.ObjectId;
  name: string;
  reportKey: string;
  frequency: string;
  nextDeliveryAt?: Date | null;
  active?: boolean;
};

type RawAudit = {
  _id: Types.ObjectId;
  actorEmail?: string | null;
  actorRoleSnapshot?: string[];
  action: string;
  resourceType: string;
  resourceId?: string | null;
  reason?: string | null;
  createdAt?: Date | null;
};

type DataBundle = {
  workflows: RawWorkflow[];
  previousWorkflows: RawWorkflow[];
  users: Array<{ _id: Types.ObjectId; email: string; firstName?: string; lastName?: string; roleKeys?: string[]; status?: string }>;
  conversations: Array<{ _id: Types.ObjectId; title: string; status: string; relatedModule?: string; lastActivityAt?: Date | null; lastMessageAt?: Date | null; participants?: Array<{ role: string; displayName: string }> }>;
  messageCount: number;
  notifications: Array<{ _id: Types.ObjectId; type: string; title: string; readAt?: Date | null; createdAt?: Date | null }>;
  templates: Array<{ _id: Types.ObjectId; name: string; category: string; status: string; currentVersionNumber?: number; usageSummary?: { totalUses?: number; activeEngagements?: number }; lastUsedAt?: Date | null; updatedAt?: Date | null }>;
  templateUsageCount: number;
  auditLogs: RawAudit[];
};

const REPORT_READ_PERMISSIONS = [
  "permissions.manage",
] as const satisfies ReadonlyArray<Permission>;

const adminReportPermissions = [
  "permissions.manage",
  "reports.view_executive",
  "reports.view_finance",
  "reports.view_audit",
] as const satisfies ReadonlyArray<Permission>;

function assertCanViewReport(principal: Principal, definition: ReportDefinition) {
  if (
    !hasPermission(principal, definition.requiredPermission) &&
    !hasAnyPermission(principal, REPORT_READ_PERMISSIONS)
  ) {
    throw new AuthorizationError(`Missing report permission: ${definition.requiredPermission}`);
  }
}

function canViewCategory(principal: Principal, category: ReportCategory) {
  const meta = REPORT_CATEGORY_META[category];
  return (
    hasPermission(principal, meta.requiredPermission) ||
    hasAnyPermission(principal, REPORT_READ_PERMISSIONS)
  );
}

function objectId(value: string | null | undefined) {
  if (!value || !Types.ObjectId.isValid(value)) {
    return null;
  }

  return new Types.ObjectId(value);
}

function workflowScopeFilter(principal: Principal, includeArchived: boolean) {
  const base: Record<string, unknown> = includeArchived ? {} : { archivedAt: null };

  if (
    hasAnyPermission(principal, adminReportPermissions) ||
    hasPermission(principal, "engagements.read_all")
  ) {
    return base;
  }

  const principalId = objectId(principal.id);
  const engagementIds = principal.assignedEngagementIds.map(objectId).filter(Boolean);
  const orgIds = principal.clientOrganizationIds.map(objectId).filter(Boolean);
  const clauses: Record<string, unknown>[] = [];

  if (principalId) {
    clauses.push({ responsibleUserId: principalId });
    clauses.push({ "team.userId": principalId });
    clauses.push({ "tasks.assignedUserId": principalId });
    clauses.push({ clientUserId: principalId });
  }

  if (engagementIds.length > 0) {
    clauses.push({ engagementId: { $in: engagementIds } });
  }

  if (orgIds.length > 0) {
    clauses.push({ organizationId: { $in: orgIds } });
  }

  return clauses.length > 0 ? { ...base, $or: clauses } : { ...base, _id: null };
}

function withDateFilter(
  filter: Record<string, unknown>,
  range: DateRange,
  dateField = "lastActivityAt",
) {
  return {
    ...filter,
    [dateField]: { $gte: range.start, $lte: range.end },
  };
}

function applyWorkflowFilters(workflows: RawWorkflow[], filters: ReportFilters) {
  return workflows.filter((workflow) => {
    if (filters.service && workflow.serviceName !== filters.service) {
      return false;
    }

    if (filters.status && workflow.status !== filters.status) {
      return false;
    }

    if (filters.stage && workflow.currentStageKey !== filters.stage) {
      return false;
    }

    if (filters.riskLevel && workflow.riskLevel !== filters.riskLevel) {
      return false;
    }

    if (filters.currency && workflow.financial?.currency !== filters.currency) {
      return false;
    }

    if (filters.invoiceStatus && workflow.financial?.invoiceStatus !== filters.invoiceStatus) {
      return false;
    }

    if (filters.paymentStatus && workflow.financial?.paymentStatus !== filters.paymentStatus) {
      return false;
    }

    return true;
  });
}

function serializeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.toISOString();
}

function formatDate(value: Date | string | null | undefined) {
  const serialized = serializeDate(value);

  if (!serialized) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(serialized));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

function formatCurrency(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function userName(user: DataBundle["users"][number]) {
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name || user.email;
}

function taskProgress(workflow: RawWorkflow) {
  const tasks = workflow.tasks ?? [];
  const required = tasks.filter((task) => task.status !== "cancelled");

  return calculateCompletionRate(
    required.filter((task) => task.status === "completed").length,
    required.length,
  );
}

function activeWorkflows(workflows: RawWorkflow[]) {
  return workflows.filter((workflow) => ["active", "on_hold", "request"].includes(workflow.status));
}

function completedWorkflows(workflows: RawWorkflow[]) {
  return workflows.filter((workflow) => ["completed", "read_only", "archived"].includes(workflow.status));
}

function financialsFor(workflow: RawWorkflow, now = new Date()) {
  return calculateFinancialSnapshot(
    {
      balanceDue: workflow.financial?.balanceDue ?? 0,
      paymentStatus: workflow.financial?.paymentStatus ?? "pending",
      dueDate: workflow.dueDate,
    },
    now,
  );
}

function summarizeWorkflows(workflows: RawWorkflow[], now = new Date()) {
  const clients = new Set(workflows.map((workflow) => workflow.clientName).filter(Boolean));
  const active = activeWorkflows(workflows);
  const completed = completedWorkflows(workflows);
  const risky = workflows.filter((workflow) => ["high", "critical"].includes(workflow.riskLevel));
  const allTasks = workflows.flatMap((workflow) =>
    (workflow.tasks ?? []).map((task) => ({ ...task, workflow })),
  );
  const overdueTasks = allTasks.filter((task) => isTaskOverdue(task, now));
  const financials = workflows.map((workflow) => financialsFor(workflow, now));
  const totalEngagementValue = financials.reduce((sum, item) => sum + item.total, 0);
  const revenueCollected = financials.reduce((sum, item) => sum + item.paid, 0);
  const outstandingBalance = financials.reduce((sum, item) => sum + item.balance, 0);
  const overdueBalance = financials.reduce((sum, item) => sum + item.overdueBalance, 0);
  const pendingKyc = workflows.filter(
    (workflow) =>
      workflow.currentStageKey === "kyc" ||
      (workflow.tasks ?? []).some(
        (task) => task.stageKey === "kyc" && task.status !== "completed" && task.status !== "cancelled",
      ),
  ).length;
  const durations = workflows
    .map((workflow) => {
      if (!workflow.startDate) {
        return 0;
      }

      const end = workflow.status === "completed" ? workflow.updatedAt ?? now : now;
      return Math.max(0, Math.round((new Date(end).getTime() - new Date(workflow.startDate).getTime()) / 86_400_000));
    })
    .filter((duration) => duration > 0);
  const staffWorkloads = buildStaffWorkloadRows(workflows, now);
  const staffUtilization = calculateAverage(staffWorkloads.map((staff) => Number(staff.workloadPercentage)));

  return {
    totalClients: clients.size,
    newClients: clients.size,
    activeClients: new Set(active.map((workflow) => workflow.clientName)).size,
    activeEngagements: active.length,
    completedEngagements: completed.length,
    engagementsAtRisk: risky.length,
    totalEngagementValue,
    revenueCollected,
    outstandingInvoices: financials.filter((item) => item.balance > 0).length,
    outstandingBalance,
    overdueBalance,
    averageEngagementDuration: calculateAverage(durations),
    staffUtilization,
    pendingKycReviews: pendingKyc,
    overdueTasks: overdueTasks.length,
  };
}

function findMetricRule(key: string) {
  return REPORT_METRIC_RULES.find((rule) => rule.key === key) ?? REPORT_METRIC_RULES[0];
}

function metricValue(summary: ReturnType<typeof summarizeWorkflows>, key: string) {
  const map: Record<string, number> = {
    total_clients: summary.totalClients,
    new_clients: summary.newClients,
    active_clients: summary.activeClients,
    active_engagements: summary.activeEngagements,
    completed_engagements: summary.completedEngagements,
    engagements_at_risk: summary.engagementsAtRisk,
    total_engagement_value: summary.totalEngagementValue,
    revenue_collected: summary.revenueCollected,
    outstanding_invoices: summary.outstandingInvoices,
    outstanding_balance: summary.outstandingBalance,
    overdue_balance: summary.overdueBalance,
    average_engagement_duration: summary.averageEngagementDuration,
    staff_utilization: summary.staffUtilization,
    pending_kyc_reviews: summary.pendingKycReviews,
    overdue_tasks: summary.overdueTasks,
  };

  return map[key] ?? 0;
}

function formatMetricValue(value: number, format: ReportKpi["format"]) {
  if (format === "currency") {
    return formatCurrency(value);
  }

  if (format === "percent") {
    return `${formatNumber(value)}%`;
  }

  if (format === "days") {
    return `${formatNumber(value)} days`;
  }

  return formatNumber(value);
}

function buildKpis(
  metricKeys: string[],
  currentSummary: ReturnType<typeof summarizeWorkflows>,
  previousSummary: ReturnType<typeof summarizeWorkflows>,
): ReportKpi[] {
  return metricKeys.map((key) => {
    const rule = findMetricRule(key);
    const current = metricValue(currentSummary, key);
    const previous = metricValue(previousSummary, key);
    const comparison = compareMetric(current, previous, rule);

    return {
      key,
      label: rule.label,
      value: formatMetricValue(current, rule.format),
      rawValue: current,
      format: rule.format,
      explanation: rule.description,
      drillDownHref: rule.drillDownHref,
      comparison: {
        label: formatComparison(comparison, rule.format),
        value: formatMetricValue(Math.abs(comparison.absoluteChange), rule.format),
        direction: comparison.direction,
        interpretation: comparison.interpretation,
      },
    };
  });
}

function formatComparison(comparison: ComparisonResult, format: ReportKpi["format"]) {
  if (comparison.direction === "flat") {
    return "No change";
  }

  const prefix = comparison.direction === "up" ? "Up" : "Down";
  const change = formatMetricValue(Math.abs(comparison.absoluteChange), format);

  return `${prefix} ${change} (${Math.round(Math.abs(comparison.percentChange))}%)`;
}

async function loadDataBundle(
  principal: Principal,
  range: DateRange,
  previousRange: DateRange,
  filters: ReportFilters,
): Promise<DataBundle> {
  await connectToDatabase();

  const includeArchived = filters.archivedStatus === "included";
  const currentWorkflowQuery = withDateFilter(workflowScopeFilter(principal, includeArchived), range);
  const previousWorkflowQuery = withDateFilter(workflowScopeFilter(principal, includeArchived), previousRange);

  const [
    workflows,
    previousWorkflows,
    users,
    conversations,
    messageCount,
    notifications,
    templates,
    templateUsageCount,
    auditLogs,
  ] = await Promise.all([
    WorkflowInstanceModel.find(currentWorkflowQuery).sort({ lastActivityAt: -1 }).limit(200).lean().exec(),
    WorkflowInstanceModel.find(previousWorkflowQuery).sort({ lastActivityAt: -1 }).limit(200).lean().exec(),
    UserModel.find({ archivedAt: null }).select("email firstName lastName roleKeys status").lean().exec(),
    CommunicationConversationModel.find({ archivedAt: null }).sort({ lastActivityAt: -1 }).limit(80).lean().exec(),
    CommunicationMessageModel.countDocuments({ deletedAt: null }).exec(),
    CommunicationNotificationModel.find({ archivedAt: null }).sort({ createdAt: -1 }).limit(100).lean().exec(),
    TemplateModel.find({ archivedAt: null }).sort({ updatedAt: -1 }).limit(100).lean().exec(),
    TemplateUsageModel.countDocuments({}).exec(),
    AuditLogModel.find({ createdAt: { $gte: range.start, $lte: range.end } })
      .sort({ createdAt: -1 })
      .limit(80)
      .lean()
      .exec(),
  ]);

  return {
    workflows: applyWorkflowFilters(workflows as unknown as RawWorkflow[], filters),
    previousWorkflows: applyWorkflowFilters(previousWorkflows as unknown as RawWorkflow[], filters),
    users: users as unknown as DataBundle["users"],
    conversations: conversations as unknown as DataBundle["conversations"],
    messageCount,
    notifications: notifications as unknown as DataBundle["notifications"],
    templates: templates as unknown as DataBundle["templates"],
    templateUsageCount,
    auditLogs: auditLogs as unknown as RawAudit[],
  };
}

function categoryPrimaryMetric(
  category: ReportCategory,
  bundle: DataBundle,
  summary: ReturnType<typeof summarizeWorkflows>,
) {
  if (category === "executive") {
    return { label: "Active engagements", value: formatNumber(summary.activeEngagements) };
  }

  if (category === "clients") {
    return { label: "Active clients", value: formatNumber(summary.activeClients) };
  }

  if (category === "engagements") {
    return { label: "At-risk engagements", value: formatNumber(summary.engagementsAtRisk) };
  }

  if (category === "workflows_tasks") {
    return { label: "Overdue tasks", value: formatNumber(summary.overdueTasks) };
  }

  if (category === "staff") {
    return { label: "Utilization", value: `${summary.staffUtilization}%` };
  }

  if (category === "kyc_compliance") {
    return { label: "Pending KYC", value: formatNumber(summary.pendingKycReviews) };
  }

  if (category === "documents") {
    return {
      label: "Workflow documents",
      value: formatNumber(bundle.workflows.reduce((sum, workflow) => sum + (workflow.documents?.length ?? 0), 0)),
    };
  }

  if (category === "finance") {
    return { label: "Outstanding", value: formatCurrency(summary.outstandingBalance) };
  }

  if (category === "services") {
    return { label: "Services active", value: formatNumber(new Set(bundle.workflows.map((workflow) => workflow.serviceName)).size) };
  }

  if (category === "communication") {
    return { label: "Open conversations", value: formatNumber(bundle.conversations.filter((item) => item.status !== "closed").length) };
  }

  if (category === "notifications") {
    return { label: "Unread", value: formatNumber(bundle.notifications.filter((item) => !item.readAt).length) };
  }

  if (category === "ai_usage") {
    return { label: "AI requests", value: "0" };
  }

  if (category === "template_usage") {
    return { label: "Template uses", value: formatNumber(bundle.templateUsageCount) };
  }

  if (category === "archive") {
    return {
      label: "Archived records",
      value: formatNumber(bundle.workflows.filter((workflow) => workflow.archive?.status === "archived").length),
    };
  }

  return { label: "Audit events", value: formatNumber(bundle.auditLogs.length) };
}

function buildCategoryCards(bundle: DataBundle, summary: ReturnType<typeof summarizeWorkflows>) {
  return Object.values(REPORT_CATEGORY_META).map((category) => {
    const metric = categoryPrimaryMetric(category.key, bundle, summary);

    return {
      key: category.key,
      label: category.label,
      description: category.description,
      icon: category.icon,
      reportCount: getReportsByCategory(category.key).length,
      primaryMetricLabel: metric.label,
      primaryMetricValue: metric.value,
      lastGeneratedAt: new Date().toISOString(),
      href: `/admin/reports/${category.primaryReportKey}`,
    };
  });
}

function buildAlerts(bundle: DataBundle, summary: ReturnType<typeof summarizeWorkflows>): ReportAlert[] {
  const alerts: ReportAlert[] = [];

  if (summary.overdueTasks > 0) {
    alerts.push({
      tone: "red",
      title: "Overdue tasks require attention",
      description: `${summary.overdueTasks} open tasks are past their due date.`,
      href: "/admin/reports/overdue-tasks",
    });
  }

  if (summary.overdueBalance > 0) {
    alerts.push({
      tone: "gold",
      title: "Overdue receivables detected",
      description: `${formatCurrency(summary.overdueBalance)} is overdue based on workflow target dates.`,
      href: "/admin/reports/finance-overview",
    });
  }

  if (bundle.notifications.some((notification) => !notification.readAt)) {
    alerts.push({
      tone: "slate",
      title: "Unread notifications exist",
      description: "Notification reports include unread and action-required items.",
      href: "/admin/reports/notification-activity",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      tone: "green",
      title: "No report alerts",
      description: "No overdue task, overdue balance or notification issues were detected.",
      href: "/admin/reports",
    });
  }

  return alerts;
}

function buildSavedReportSummary(report: RawSavedReport): SavedReportSummary {
  return {
    id: report._id.toString(),
    name: report.name,
    category: REPORT_CATEGORY_META[report.category]?.label ?? report.category,
    ownerName: report.ownerName ?? "System",
    lastOpenedAt: serializeDate(report.lastOpenedAt),
    visibility: report.visibility ?? "private",
    href: `/admin/reports/${report.reportKey}`,
  };
}

function buildExportSummary(record: RawExport): ExportHistorySummary {
  return {
    id: record._id.toString(),
    reportName: record.reportName,
    category: REPORT_CATEGORY_META[record.category]?.label ?? record.category,
    format: record.format.toUpperCase(),
    status: record.status,
    generatedByName: record.generatedByName ?? "System",
    createdAt: serializeDate(record.createdAt),
  };
}

async function loadReportSupportRecords(principal: Principal, reportKey?: string) {
  const principalId = objectId(principal.id);
  const savedFilter: Record<string, unknown> = {
    archivedAt: null,
    $or: [
      { visibility: "all_authorized_admins" },
      { ownerUserId: principalId },
      { sharedRole: { $in: principal.roleKeys } },
    ],
  };

  if (reportKey) {
    savedFilter.reportKey = reportKey;
  }

  const exportFilter: Record<string, unknown> = { deletedAt: null };

  if (reportKey) {
    exportFilter.reportKey = reportKey;
  }

  const [saved, schedules, exports] = await Promise.all([
    ReportSavedViewModel.find(savedFilter).sort({ lastOpenedAt: -1, updatedAt: -1 }).limit(12).lean().exec(),
    ReportScheduleModel.find(reportKey ? { reportKey } : {}).sort({ nextDeliveryAt: 1 }).limit(8).lean().exec(),
    ReportExportModel.find(exportFilter).sort({ createdAt: -1 }).limit(10).lean().exec(),
  ]);

  return {
    savedReports: (saved as unknown as RawSavedReport[]).map(buildSavedReportSummary),
    scheduledReports: (schedules as unknown as RawSchedule[]).map((schedule) => ({
      id: schedule._id.toString(),
      name: schedule.name,
      reportKey: schedule.reportKey,
      frequency: schedule.frequency,
      nextDeliveryAt: serializeDate(schedule.nextDeliveryAt),
      active: Boolean(schedule.active),
    })),
    exportHistory: (exports as unknown as RawExport[]).map(buildExportSummary),
  };
}

export async function getReportsLandingData(
  principal: Principal,
  filters: ReportFilters = {},
): Promise<ReportsLandingData> {
  const range = resolveReportDateRange(filters.dateRange ?? "last_30_days");
  const previousRange = previousEquivalentPeriod(range);
  const bundle = await loadDataBundle(principal, range, previousRange, filters);
  const currentSummary = summarizeWorkflows(bundle.workflows);
  const previousSummary = summarizeWorkflows(bundle.previousWorkflows);
  const support = await loadReportSupportRecords(principal);
  const availableCategories = buildCategoryCards(bundle, currentSummary).filter((category) =>
    canViewCategory(principal, category.key),
  );

  return {
    dataFreshness: new Date().toISOString(),
    dateRange: range,
    summary: buildKpis(
      [
        "active_engagements",
        "engagements_at_risk",
        "revenue_collected",
        "outstanding_invoices",
        "pending_kyc_reviews",
        "overdue_tasks",
      ],
      currentSummary,
      previousSummary,
    ),
    categories: availableCategories,
    recentlyViewed: support.savedReports.filter((report) => report.lastOpenedAt).slice(0, 5),
    savedReports: support.savedReports,
    scheduledReports: support.scheduledReports,
    exportHistory: support.exportHistory,
    alerts: buildAlerts(bundle, currentSummary),
    builderSteps: [
      "Select Report Category",
      "Select Data Source",
      "Choose Metrics",
      "Choose Dimensions",
      "Add Filters",
      "Choose Visualization",
      "Preview",
      "Save or Export",
    ],
  };
}

export async function getReportDetailData(
  principal: Principal,
  reportKey: string,
  filters: ReportFilters = {},
): Promise<ReportDetailData | null> {
  const definition = getReportDefinition(reportKey);

  if (!definition) {
    return null;
  }

  assertCanViewReport(principal, definition);

  const range = resolveReportDateRange(filters.dateRange ?? definition.defaultDateRange);
  const previousRange = previousEquivalentPeriod(range);
  const bundle = await loadDataBundle(principal, range, previousRange, filters);
  const currentSummary = summarizeWorkflows(bundle.workflows);
  const previousSummary = summarizeWorkflows(bundle.previousWorkflows);
  const support = await loadReportSupportRecords(principal, reportKey);

  return {
    definition,
    dataFreshness: new Date().toISOString(),
    dateRange: range,
    previousDateRange: previousRange,
    filters,
    kpis: buildKpis(definition.metrics, currentSummary, previousSummary),
    charts: buildChartsForReport(definition.key, bundle),
    table: buildTableForReport(definition, bundle),
    insights: buildInsights(definition.key, bundle, currentSummary),
    exportHistory: support.exportHistory,
    calculationNotes: [
      "Archived records are excluded unless the archived status filter includes them.",
      "Financial values use workflow financial state until dedicated invoice and payment collections are added.",
      "Task, document and KYC metrics are calculated from workflow instance subrecords.",
      "Comparison uses the previous equivalent period for the selected date range.",
    ],
  };
}

function buildChartsForReport(reportKey: string, bundle: DataBundle): ReportChart[] {
  if (reportKey === "finance-overview") {
    return [
      {
        title: "Outstanding balance by aging bucket",
        type: "stacked_bar",
        description: "Aging buckets are calculated from workflow due dates.",
        data: groupFinanceAging(bundle.workflows),
      },
      {
        title: "Revenue by service",
        type: "bar",
        description: "Collected value is estimated from workflow financial status.",
        data: groupRevenueByService(bundle.workflows),
      },
    ];
  }

  if (reportKey === "engagement-register" || reportKey === "executive-overview") {
    return [
      {
        title: "Engagement pipeline",
        type: "pipeline",
        description: "Workflows grouped by current stage.",
        data: groupBy(bundle.workflows, (workflow) => workflow.currentStageKey),
      },
      {
        title: "Engagements by service",
        type: "bar",
        description: "Engagement volume for each service line.",
        data: groupBy(bundle.workflows, (workflow) => workflow.serviceName),
      },
      {
        title: "Risk distribution",
        type: "donut",
        description: "Engagement risk levels from workflow records.",
        data: groupBy(bundle.workflows, (workflow) => workflow.riskLevel),
      },
    ];
  }

  if (reportKey === "staff-workload") {
    return [
      {
        title: "Workload by staff",
        type: "bar",
        description: "Workload score combines active engagements, open tasks, overdue tasks and estimated hours.",
        data: buildStaffWorkloadRows(bundle.workflows).map((row) => ({
          label: String(row.staffMember),
          value: Number(row.workloadPercentage),
        })),
      },
    ];
  }

  if (reportKey === "template-usage") {
    return [
      {
        title: "Templates by category",
        type: "bar",
        description: "Template records grouped by reusable template category.",
        data: groupBy(bundle.templates, (template) => template.category),
      },
    ];
  }

  return [
    {
      title: "Records by status",
      type: "bar",
      description: "Primary records grouped by their current status.",
      data: groupBy(bundle.workflows, (workflow) => workflow.status),
    },
  ];
}

function buildTableForReport(definition: ReportDefinition, bundle: DataBundle): ReportTable {
  const rowsByReport: Record<string, Array<Record<string, string | number>>> = {
    "executive-overview": buildExecutiveRows(bundle),
    "engagement-register": buildEngagementRows(bundle.workflows),
    "finance-overview": buildFinanceRows(bundle.workflows),
    "overdue-tasks": buildOverdueTaskRows(bundle.workflows),
    "staff-workload": buildStaffWorkloadRows(bundle.workflows),
    "kyc-status": buildKycRows(bundle.workflows),
    "document-register": buildDocumentRows(bundle.workflows),
    "service-performance": buildServiceRows(bundle.workflows),
    "communication-response": buildCommunicationRows(bundle),
    "notification-activity": buildNotificationRows(bundle),
    "template-usage": buildTemplateRows(bundle),
    "archive-retention": buildArchiveRows(bundle.workflows),
    "audit-activity": buildAuditRows(bundle.auditLogs),
    "client-register": buildClientRows(bundle.workflows),
    "ai-usage-overview": [],
  };

  return {
    title: definition.title,
    columns: definition.columns,
    rows: rowsByReport[definition.key] ?? buildEngagementRows(bundle.workflows),
  };
}

function buildInsights(
  reportKey: string,
  bundle: DataBundle,
  summary: ReturnType<typeof summarizeWorkflows>,
) {
  const insights: string[] = [];

  if (summary.overdueTasks > 0) {
    insights.push(`${summary.overdueTasks} tasks are overdue in the selected period.`);
  }

  if (summary.engagementsAtRisk > 0) {
    insights.push(`${summary.engagementsAtRisk} engagements have high or critical risk levels.`);
  }

  if (summary.overdueBalance > 0) {
    insights.push(`${formatCurrency(summary.overdueBalance)} is overdue based on target dates.`);
  }

  if (reportKey === "finance-overview" && summary.revenueCollected < summary.outstandingBalance) {
    insights.push("Outstanding balance is higher than collected revenue for the selected period.");
  }

  if (reportKey === "communication-response" && bundle.conversations.some((item) => item.status.includes("waiting"))) {
    insights.push("At least one conversation is waiting for a participant response.");
  }

  if (insights.length === 0) {
    insights.push("No rule-based exceptions were detected for this report.");
  }

  return insights;
}

function buildExecutiveRows(bundle: DataBundle) {
  const summary = summarizeWorkflows(bundle.workflows);

  return [
    ["Total Clients", summary.totalClients, "Client register"],
    ["Active Engagements", summary.activeEngagements, "Engagement register"],
    ["Engagements at Risk", summary.engagementsAtRisk, "Risk report"],
    ["Revenue Collected", summary.revenueCollected, "Finance overview"],
    ["Outstanding Invoices", summary.outstandingInvoices, "Invoice aging"],
    ["Overdue Tasks", summary.overdueTasks, "Overdue tasks"],
  ].map(([metric, current, drillDown]) => ({
    metric: String(metric),
    current: typeof current === "number" && metric === "Revenue Collected" ? formatCurrency(current) : String(current),
    previous: "See comparison",
    change: "Calculated above",
    status: Number(current) > 0 ? "Active" : "Clear",
    drillDown: String(drillDown),
  }));
}

function buildEngagementRows(workflows: RawWorkflow[]) {
  return workflows.map((workflow) => {
    const financial = financialsFor(workflow);

    return {
      reference: workflow.reference,
      client: workflow.clientName,
      service: workflow.serviceName,
      status: workflow.status,
      stage: workflow.stages?.find((stage) => stage.key === workflow.currentStageKey)?.name ?? workflow.currentStageKey,
      progress: `${taskProgress(workflow)}%`,
      manager: workflow.responsibleUserName ?? "Unassigned",
      team: (workflow.team ?? []).map((member) => member.name).join(", ") || "Unassigned",
      startDate: formatDate(workflow.startDate),
      dueDate: formatDate(workflow.dueDate),
      engagementValue: formatCurrency(financial.total, workflow.financial?.currency),
      amountInvoiced: formatCurrency(financial.total, workflow.financial?.currency),
      amountPaid: formatCurrency(financial.paid, workflow.financial?.currency),
      riskLevel: workflow.riskLevel,
      lastActivity: formatDate(workflow.lastActivityAt),
    };
  });
}

function buildFinanceRows(workflows: RawWorkflow[]) {
  return workflows.map((workflow) => {
    const financial = financialsFor(workflow);

    return {
      invoice: `INV-${workflow.reference.replace(/\D/g, "").slice(-5) || workflow.reference}`,
      client: workflow.clientName,
      engagement: workflow.reference,
      service: workflow.serviceName,
      dueDate: formatDate(workflow.dueDate),
      currency: workflow.financial?.currency ?? "KES",
      total: formatCurrency(financial.total, workflow.financial?.currency),
      paid: formatCurrency(financial.paid, workflow.financial?.currency),
      balance: formatCurrency(financial.balance, workflow.financial?.currency),
      status: workflow.financial?.invoiceStatus ?? "draft",
      daysOverdue: financial.daysOverdue,
    };
  });
}

function buildOverdueTaskRows(workflows: RawWorkflow[]) {
  return workflows.flatMap((workflow) =>
    (workflow.tasks ?? [])
      .filter((task) => isTaskOverdue(task))
      .map((task) => ({
        task: task.title,
        engagement: workflow.reference,
        client: workflow.clientName,
        assignee: task.assignedUserName || task.assignedRole,
        department: workflow.team?.find((member) => member.name === task.assignedUserName)?.department ?? "Consulting",
        priority: task.priority ?? "medium",
        dueDate: formatDate(task.dueDate),
        daysOverdue: calculateDaysOverdue(task.dueDate),
        status: task.status,
        blockingReason: task.blockerReason ?? "",
        manager: workflow.responsibleUserName ?? "Unassigned",
      })),
  );
}

function buildStaffWorkloadRows(workflows: RawWorkflow[], now = new Date()) {
  const staff = new Map<string, StaffRowAccumulator>();

  for (const workflow of workflows) {
    for (const member of workflow.team ?? []) {
      const key = member.email || member.name;
      const current =
        staff.get(key) ??
        {
          staffMember: member.name,
          role: member.role,
          department: member.department ?? "Consulting",
          activeEngagements: 0,
          openTasks: 0,
          overdueTasks: 0,
          pendingReviews: 0,
          estimatedHours: 0,
          availability: member.workloadLevel === "overloaded" ? "Limited" : "Available",
        };

      current.activeEngagements += ["active", "on_hold", "request"].includes(workflow.status) ? 1 : 0;

      for (const task of workflow.tasks ?? []) {
        if ((task.assignedUserName && task.assignedUserName === member.name) || task.assignedRole === member.role) {
          if (!["completed", "cancelled"].includes(task.status)) {
            current.openTasks += 1;
            current.estimatedHours += task.estimatedHours ?? 2;
          }

          if (isTaskOverdue(task, now)) {
            current.overdueTasks += 1;
          }

          if (task.approvalRequired && !["completed", "cancelled"].includes(task.status)) {
            current.pendingReviews += 1;
          }
        }
      }

      staff.set(key, current);
    }
  }

  return [...staff.values()].map((row) => {
    const workload = calculateStaffWorkload(row);

    return {
      ...row,
      workloadPercentage: workload.workloadPercentage,
      workloadLevel: workload.workloadLevel,
    };
  });
}

type StaffRowAccumulator = {
  staffMember: string;
  role: string;
  department: string;
  activeEngagements: number;
  openTasks: number;
  overdueTasks: number;
  pendingReviews: number;
  estimatedHours: number;
  availability: string;
};

function buildKycRows(workflows: RawWorkflow[]) {
  return workflows.map((workflow) => {
    const kycTasks = (workflow.tasks ?? []).filter((task) => task.stageKey === "kyc");
    const completed = kycTasks.filter((task) => task.status === "completed").length;
    const completion = calculateCompletionRate(completed, kycTasks.length || 1);

    return {
      client: workflow.clientName,
      clientType: workflow.organizationName ? "Corporate" : "Individual",
      engagement: workflow.reference,
      kycTemplate: "Corporate Client KYC",
      completion: `${completion}%`,
      submissionStatus: workflow.currentStageKey === "kyc" ? "pending review" : "submitted",
      reviewStatus: completion === 100 ? "approved" : "pending review",
      riskLevel: workflow.riskLevel,
      reviewer: workflow.team?.find((member) => member.role === "reviewer")?.name ?? "Reviewer",
      submittedDate: formatDate(workflow.startDate),
      approvalDate: completion === 100 ? formatDate(workflow.updatedAt) : "Not approved",
      missingItems: (workflow.documents ?? []).filter((document) => document.status !== "approved").length,
    };
  });
}

function buildDocumentRows(workflows: RawWorkflow[]) {
  return workflows.flatMap((workflow) =>
    (workflow.documents ?? []).map((document) => ({
      documentName: document.name,
      client: workflow.clientName,
      engagement: workflow.reference,
      category: document.status,
      fileType: document.name.split(".").pop() ?? "file",
      version: document.version ?? 1,
      uploadedBy: "Portal user",
      uploadDate: formatDate(document.uploadedAt),
      reviewStatus: document.status,
      visibility: document.visibility ?? "staff",
      archiveStatus: workflow.archive?.status ?? "not_ready",
    })),
  );
}

function buildClientRows(workflows: RawWorkflow[]) {
  const clients = new Map<string, RawWorkflow[]>();

  for (const workflow of workflows) {
    const key = workflow.organizationName || workflow.clientName;
    clients.set(key, [...(clients.get(key) ?? []), workflow]);
  }

  return [...clients.entries()].map(([client, records]) => {
    const outstanding = records.reduce((sum, workflow) => sum + (workflow.financial?.balanceDue ?? 0), 0);

    return {
      client,
      clientType: records.some((workflow) => workflow.organizationName) ? "Corporate" : "Individual",
      registrationNumber: "Stored on client profile",
      primaryContact: records[0]?.clientName ?? client,
      industry: "Consultancy client",
      location: "Kenya",
      accountManager: records[0]?.responsibleUserName ?? "Unassigned",
      kycStatus: records.some((workflow) => workflow.currentStageKey === "kyc") ? "Pending" : "Approved",
      riskLevel: records.some((workflow) => ["high", "critical"].includes(workflow.riskLevel)) ? "High" : "Standard",
      activeEngagements: records.filter((workflow) => workflow.status === "active").length,
      outstandingBalance: formatCurrency(outstanding),
      lastActivity: formatDate(records[0]?.lastActivityAt),
      status: records.some((workflow) => workflow.status === "active") ? "Active" : "Inactive",
    };
  });
}

function buildServiceRows(workflows: RawWorkflow[]) {
  const services = new Map<string, RawWorkflow[]>();

  for (const workflow of workflows) {
    services.set(workflow.serviceName, [...(services.get(workflow.serviceName) ?? []), workflow]);
  }

  return [...services.entries()].map(([service, records]) => {
    const completed = completedWorkflows(records).length;
    const financial = records.map((workflow) => financialsFor(workflow));

    return {
      service,
      engagementCount: records.length,
      activeEngagements: activeWorkflows(records).length,
      completedEngagements: completed,
      completionRate: `${calculateCompletionRate(completed, records.length)}%`,
      averageDuration: `${summarizeWorkflows(records).averageEngagementDuration} days`,
      totalEngagementValue: formatCurrency(financial.reduce((sum, item) => sum + item.total, 0)),
      totalRevenue: formatCurrency(financial.reduce((sum, item) => sum + item.paid, 0)),
      outstandingBalance: formatCurrency(financial.reduce((sum, item) => sum + item.balance, 0)),
      atRiskEngagements: records.filter((workflow) => ["high", "critical"].includes(workflow.riskLevel)).length,
    };
  });
}

function buildCommunicationRows(bundle: DataBundle) {
  return bundle.conversations.map((conversation) => {
    const client = conversation.participants?.find((participant) => participant.role === "client");
    const staff = conversation.participants?.find((participant) => participant.role === "staff");
    const daysWaiting = calculateDaysOverdue(conversation.lastMessageAt ?? conversation.lastActivityAt);

    return {
      conversation: conversation.title,
      client: client?.displayName ?? "Not linked",
      engagement: conversation.relatedModule ?? "messages",
      assignedStaff: staff?.displayName ?? "Unassigned",
      waitingFor: conversation.status.replaceAll("_", " "),
      lastMessageDate: formatDate(conversation.lastMessageAt),
      waitingDuration: daysWaiting,
      status: conversation.status,
    };
  });
}

function buildNotificationRows(bundle: DataBundle) {
  return bundle.notifications.map((notification) => ({
    title: notification.title,
    type: notification.type,
    recipient: "Portal user",
    role: "Authorized role",
    readStatus: notification.readAt ? "Read" : "Unread",
    actionUrl: "Open related record",
    createdDate: formatDate(notification.createdAt),
  }));
}

function buildTemplateRows(bundle: DataBundle) {
  return bundle.templates.map((template) => ({
    templateName: template.name,
    category: template.category,
    version: template.currentVersionNumber ?? 1,
    status: template.status,
    usageCount: template.usageSummary?.totalUses ?? 0,
    activeEngagementUsage: template.usageSummary?.activeEngagements ?? 0,
    lastUsed: formatDate(template.lastUsedAt),
    updatedBy: "Template owner",
  }));
}

function buildArchiveRows(workflows: RawWorkflow[]) {
  return workflows
    .filter((workflow) => workflow.archive?.status && workflow.archive.status !== "not_ready")
    .map((workflow) => ({
      record: workflow.reference,
      recordType: "Engagement",
      client: workflow.clientName,
      engagement: workflow.reference,
      archiveDate: formatDate(workflow.archive?.archivedAt),
      retentionExpiry: formatDate(workflow.archive?.retentionUntil),
      legalHold: workflow.archive?.legalHoldReason ? "Yes" : "No",
      restoreEligibility: workflow.archive?.status === "legal_hold" ? "Restricted" : "Eligible",
    }));
}

function buildAuditRows(auditLogs: RawAudit[]) {
  return auditLogs.map((record) => ({
    timestamp: formatDate(record.createdAt),
    actor: record.actorEmail ?? "System",
    roleSnapshot: record.actorRoleSnapshot?.join(", ") ?? "System",
    action: record.action,
    resourceType: record.resourceType,
    resourceReference: record.resourceId ?? "Not recorded",
    reason: record.reason ?? "",
  }));
}

function groupBy<T>(items: T[], labelFor: (item: T) => string | undefined | null) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const label = labelFor(item) || "Unassigned";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()].map(([label, value]) => ({ label, value }));
}

function groupFinanceAging(workflows: RawWorkflow[]) {
  const labels: Record<string, string> = {
    current: "Current",
    "1_30": "1-30 days",
    "31_60": "31-60 days",
    "61_90": "61-90 days",
    over_90: "Over 90 days",
  };
  const buckets = new Map<string, number>();

  for (const workflow of workflows) {
    const financial = financialsFor(workflow);
    buckets.set(financial.agingBucket, (buckets.get(financial.agingBucket) ?? 0) + financial.balance);
  }

  return Object.entries(labels).map(([key, label]) => ({ label, value: buckets.get(key) ?? 0 }));
}

function groupRevenueByService(workflows: RawWorkflow[]) {
  const totals = new Map<string, number>();

  for (const workflow of workflows) {
    const financial = financialsFor(workflow);
    totals.set(workflow.serviceName, (totals.get(workflow.serviceName) ?? 0) + financial.paid);
  }

  return [...totals.entries()].map(([label, value]) => ({ label, value }));
}
