import { hasAnyPermission, type Principal } from "@/features/authorization/access-control";
import type { AdminDirectoryUser } from "@/repositories/user-repository";
import {
  listRegisteredClientsForAdmin,
  listStaffForAdmin,
} from "@/repositories/user-repository";

export type DashboardAlert = {
  severity: "critical" | "high" | "medium" | "informational";
  title: string;
  count: number;
  action: string;
  href: string;
};

export type DashboardKpi = {
  label: string;
  value: string;
  helper: string;
  trend: string;
  href: string;
  financeOnly?: boolean;
};

export type PipelineStage = {
  label: string;
  count: number;
  averageTime: string;
  delayed: number;
  conversion: string;
};

export type WorkflowGate = {
  stage: string;
  owner: string;
  evidence: string;
  decision: string;
  href: string;
  status: "Connected" | "Ready" | "Pending model";
};

export type ActionQueueItem = {
  priority: "Critical" | "High" | "Medium" | "Info";
  recordType: string;
  client: string;
  reference: string;
  issue: string;
  age: string;
  assignee: string;
  due: string;
  action: string;
  secondaryActions: string[];
  href: string;
};

export type StaffWorkload = {
  name: string;
  role: string;
  activeEngagements: number;
  overdueTasks: number;
  dueThisWeek: number;
  pendingReviews: number;
  utilization: "Available" | "Balanced" | "High" | "Overloaded";
};

export type ActivityItem = {
  actor: string;
  action: string;
  resource: string;
  timestamp: string;
  href: string;
};

export type DeadlineItem = {
  type: string;
  engagement: string;
  client: string;
  owner: string;
  due: string;
  urgency: "Critical" | "High" | "Medium" | "Low";
  action: string;
  href: string;
};

export type PerformanceMetric = {
  label: string;
  value: string;
  helper: string;
};

export type OperationsDashboardData = {
  generatedAt: string;
  hasFinanceAccess: boolean;
  clients: AdminDirectoryUser[];
  staff: AdminDirectoryUser[];
  alerts: DashboardAlert[];
  kpis: DashboardKpi[];
  pipeline: PipelineStage[];
  workflowGates: WorkflowGate[];
  actionQueue: ActionQueueItem[];
  staffWorkload: StaffWorkload[];
  deadlines: DeadlineItem[];
  performance: PerformanceMetric[];
  activity: ActivityItem[];
};

function displayName(user: AdminDirectoryUser) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.email;
}

function daysSince(value: string | null) {
  if (!value) {
    return null;
  }

  const created = new Date(value).getTime();
  const now = Date.now();

  if (!Number.isFinite(created)) {
    return null;
  }

  return Math.max(0, Math.floor((now - created) / 86_400_000));
}

function roleLabel(user: AdminDirectoryUser) {
  const preferredRole =
    user.roleKeys.find((role) => role !== "client" && role !== "client_representative") ??
    user.roleKeys[0];

  return preferredRole
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function getWorkload(member: AdminDirectoryUser): StaffWorkload {
  const activeEngagements = member.assignedEngagementCount;
  const utilization =
    activeEngagements >= 8
      ? "Overloaded"
      : activeEngagements >= 5
        ? "High"
        : activeEngagements >= 2
          ? "Balanced"
          : "Available";

  return {
    name: displayName(member),
    role: roleLabel(member),
    activeEngagements,
    overdueTasks: 0,
    dueThisWeek: 0,
    pendingReviews: 0,
    utilization,
  };
}

function getRecentActivity(clients: AdminDirectoryUser[], staff: AdminDirectoryUser[]): ActivityItem[] {
  return [...clients, ...staff]
    .filter((user) => user.createdAt)
    .sort((first, second) => {
      const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
      const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
      return secondTime - firstTime;
    })
    .slice(0, 6)
    .map((user) => ({
      actor: "System",
      action: "registered account",
      resource: displayName(user),
      timestamp: user.createdAt ?? "",
      href: user.roleKeys.some((role) => role === "client" || role === "client_representative")
        ? "/admin/clients"
        : "/admin/staff",
    }));
}

function getAlerts(clients: AdminDirectoryUser[], staff: AdminDirectoryUser[]): DashboardAlert[] {
  const unverifiedClients = clients.filter((client) => !client.emailVerifiedAt).length;
  const suspendedStaff = staff.filter((member) => member.status === "suspended").length;
  const unassignedStaff = staff.filter((member) => member.assignedEngagementCount === 0).length;
  const alerts: DashboardAlert[] = [];

  if (unverifiedClients > 0) {
    alerts.push({
      severity: "medium",
      title: "Client email verification pending",
      count: unverifiedClients,
      action: "Review client access",
      href: "/admin/clients",
    });
  }

  if (suspendedStaff > 0) {
    alerts.push({
      severity: "high",
      title: "Suspended staff accounts need review",
      count: suspendedStaff,
      action: "Open staff directory",
      href: "/admin/staff",
    });
  }

  if (staff.length === 0) {
    alerts.push({
      severity: "critical",
      title: "No staff accounts available for assignment",
      count: 1,
      action: "Invite staff",
      href: "/admin/staff",
    });
  } else if (unassignedStaff > 0) {
    alerts.push({
      severity: "informational",
      title: "Staff without assigned engagement references",
      count: unassignedStaff,
      action: "Review workload",
      href: "/admin/staff",
    });
  }

  return alerts;
}

function getActionQueue(alerts: DashboardAlert[], clients: AdminDirectoryUser[]): ActionQueueItem[] {
  const pendingClientRows = clients
    .filter((client) => !client.emailVerifiedAt)
    .slice(0, 4)
    .map((client) => ({
      priority: "Medium" as const,
      recordType: "Client",
      client: displayName(client),
      reference: client.id.slice(-6).toUpperCase(),
      issue: "Email verification pending",
      age: `${daysSince(client.createdAt) ?? 0}d`,
      assignee: "Admin",
      due: "Review today",
      action: "Open client",
      secondaryActions: ["Resend verification", "Update status"],
      href: "/admin/clients",
    }));

  const alertRows = alerts
    .filter((alert) => alert.severity !== "medium")
    .map((alert) => ({
      priority:
        alert.severity === "critical"
          ? ("Critical" as const)
          : alert.severity === "high"
            ? ("High" as const)
            : ("Info" as const),
      recordType: "System",
      client: "Platform",
      reference: alert.title,
      issue: alert.action,
      age: "now",
      assignee: "Admin",
      due: "Today",
      action: "Review",
      secondaryActions: ["Assign owner", "Dismiss if resolved"],
      href: alert.href,
    }));

  return [...alertRows, ...pendingClientRows].slice(0, 6);
}

export async function getOperationsDashboardData(
  principal: Principal,
): Promise<OperationsDashboardData> {
  const [clients, staff] = await Promise.all([
    listRegisteredClientsForAdmin(),
    listStaffForAdmin(),
  ]);

  const hasFinanceAccess = hasAnyPermission(principal, [
    "invoices.read",
    "invoices.create",
    "invoices.approve",
    "payments.record",
    "payments.reconcile",
    "reports.read",
  ]);

  const unverifiedClients = clients.filter((client) => !client.emailVerifiedAt).length;
  const activeStaff = staff.filter((member) => member.status === "active").length;
  const linkedEngagements = staff.reduce(
    (total, member) => total + member.assignedEngagementCount,
    0,
  );
  const alerts = getAlerts(clients, staff);

  const kpis: DashboardKpi[] = [
    {
      label: "Pending engagement requests",
      value: "0",
      helper: "Request records will appear after the engagement request model is connected.",
      trend: "No request model yet",
      href: "/admin/requests",
    },
    {
      label: "Active engagements",
      value: String(linkedEngagements),
      helper: "Current linked engagement references on staff accounts.",
      trend: `${activeStaff} active staff accounts`,
      href: "/admin/active-engagements",
    },
    {
      label: "Pending KYC reviews",
      value: "0",
      helper: "KYC queue awaits the submission model and review workflow.",
      trend: "Queue ready",
      href: "/admin/kyc",
    },
    {
      label: "Outstanding invoices",
      value: "0",
      helper: "Invoice balances will render after finance models are wired.",
      trend: "Finance model pending",
      href: "/admin/invoices",
      financeOnly: true,
    },
    {
      label: "Overdue tasks",
      value: "0",
      helper: "Task SLA tracking will activate when task records are available.",
      trend: "No overdue task records",
      href: "/admin/tasks",
    },
    {
      label: "Client actions required",
      value: String(unverifiedClients),
      helper: "Clients needing access or verification review.",
      trend: `${clients.length} registered clients`,
      href: "/admin/clients",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    hasFinanceAccess,
    clients,
    staff,
    alerts,
    kpis: kpis.filter((kpi) => !kpi.financeOnly || hasFinanceAccess),
    pipeline: [
      { label: "Request submitted", count: 0, averageTime: "-", delayed: 0, conversion: "-" },
      { label: "Admin review", count: 0, averageTime: "-", delayed: 0, conversion: "-" },
      { label: "KYC in progress", count: 0, averageTime: "-", delayed: 0, conversion: "-" },
      { label: "KYC review", count: 0, averageTime: "-", delayed: 0, conversion: "-" },
      { label: "Engagement letter", count: 0, averageTime: "-", delayed: 0, conversion: "-" },
      { label: "Awaiting signature", count: 0, averageTime: "-", delayed: 0, conversion: "-" },
      { label: "Ready to start", count: 0, averageTime: "-", delayed: 0, conversion: "-" },
      { label: "Active", count: linkedEngagements, averageTime: "-", delayed: 0, conversion: "-" },
      { label: "Completed", count: 0, averageTime: "-", delayed: 0, conversion: "-" },
    ],
    workflowGates: [
      {
        stage: "Request intake",
        owner: "Engagement manager",
        evidence: "Submitted scope, selected service and payment preference",
        decision: "Accept, reject or request clarification",
        href: "/admin/requests",
        status: "Pending model",
      },
      {
        stage: "KYC review",
        owner: "Reviewer",
        evidence: "Questionnaire, required documents and risk classification",
        decision: "Approve, escalate or request replacement",
        href: "/admin/kyc",
        status: "Pending model",
      },
      {
        stage: "Engagement letter",
        owner: "Engagement manager",
        evidence: "Final scope, price snapshot and workflow template",
        decision: "Generate, send for signature or revise",
        href: "/admin/letter-templates",
        status: "Ready",
      },
      {
        stage: "Active delivery",
        owner: "Assigned team",
        evidence: "Tasks, milestones, documents, messages and blockers",
        decision: "Reassign, escalate, mark blocked or complete",
        href: "/admin/active-engagements",
        status: linkedEngagements > 0 ? "Connected" : "Pending model",
      },
      {
        stage: "Finance closeout",
        owner: "Finance officer",
        evidence: "Invoice approval, payments and reconciliation",
        decision: "Issue, record payment, reconcile or flag exception",
        href: "/admin/invoices",
        status: "Pending model",
      },
      {
        stage: "Archive",
        owner: "Document controller",
        evidence: "Final deliverables, retention class and audit trail",
        decision: "Archive, restore review or apply legal hold",
        href: "/admin/archive",
        status: "Ready",
      },
    ],
    actionQueue: getActionQueue(alerts, clients),
    staffWorkload: staff.map(getWorkload),
    deadlines: [],
    performance: [
      {
        label: "Completion rate",
        value: "0%",
        helper: "Requires completed engagement records.",
      },
      {
        label: "Average completion time",
        value: "-",
        helper: "Requires stage transition timestamps.",
      },
      {
        label: "On-time delivery",
        value: "0",
        helper: "Requires milestone due dates and completion dates.",
      },
      {
        label: "At-risk engagements",
        value: "0",
        helper: "Requires risk and blocker records.",
      },
    ],
    activity: getRecentActivity(clients, staff),
  };
}
