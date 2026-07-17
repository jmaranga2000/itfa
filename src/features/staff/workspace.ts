import type { DashboardNavItem } from "@/components/layout/dashboard-shell";
import { ROLE_LABELS, type AppRole } from "@/features/authorization/roles";
import {
  STAFF_ACCOUNT_ROLES,
  type StaffAccountRole,
} from "@/features/staff/types";

export type StaffRouteKey =
  | "dashboard"
  | "profile"
  | "notifications"
  | "calendar"
  | "messages"
  | "requests"
  | "team-workload"
  | "engagements"
  | "tasks"
  | "clients"
  | "kyc"
  | "reviews"
  | "documents"
  | "notes"
  | "ai"
  | "invoices"
  | "payments"
  | "reports"
  | "templates"
  | "archive"
  | "audit"
  | "team";

type WorkspaceLink = {
  label: string;
  href: string;
  description: string;
};

export type StaffWorkspace = {
  role: StaffAccountRole;
  roleLabel: string;
  title: string;
  subtitle: string;
  description: string;
  priorities: readonly string[];
  primaryLinks: readonly WorkspaceLink[];
};

const routeAccess: Record<StaffAccountRole, readonly StaffRouteKey[]> = {
  engagement_manager: [
    "dashboard", "notifications", "calendar", "messages", "requests", "team-workload",
    "engagements", "tasks", "clients", "kyc", "documents", "notes", "ai", "reports",
    "templates", "archive",
  ],
  consultant: [
    "dashboard", "notifications", "calendar", "messages", "engagements", "tasks", "clients",
    "documents", "notes", "ai", "reports", "templates", "archive",
  ],
  reviewer: [
    "dashboard", "notifications", "calendar", "messages", "engagements", "tasks", "clients",
    "kyc", "reviews", "documents", "notes", "ai", "reports", "templates", "archive",
  ],
  finance_officer: [
    "dashboard", "notifications", "calendar", "messages", "engagements", "clients", "invoices",
    "payments", "reports", "templates", "archive",
  ],
  document_controller: [
    "dashboard", "notifications", "calendar", "engagements", "clients", "documents", "reports",
    "templates", "archive",
  ],
  support_staff: [
    "dashboard", "notifications", "calendar", "messages", "engagements", "tasks", "clients",
    "documents",
  ],
  auditor: [
    "dashboard", "notifications", "calendar", "engagements", "clients", "kyc", "documents",
    "invoices", "reports", "templates", "archive", "audit", "team",
  ],
};

const workspaceDetails: Record<StaffAccountRole, Omit<StaffWorkspace, "role" | "roleLabel">> = {
  engagement_manager: {
    title: "Engagement management",
    subtitle: "Requests, assignments, progress and delivery oversight",
    description: "Coordinate new requests, assign work and keep every engagement moving toward completion.",
    priorities: ["Review new client requests", "Balance team workload", "Resolve blocked engagements"],
    primaryLinks: [
      { label: "Review requests", href: "/staff/requests", description: "Accept, clarify or decline new work." },
      { label: "Check team workload", href: "/staff/team-workload", description: "Assign work to staff with capacity." },
      { label: "Open engagements", href: "/staff/engagements", description: "Monitor active client work and deadlines." },
    ],
  },
  consultant: {
    title: "Consulting workspace",
    subtitle: "Assigned client work, tasks and deliverables",
    description: "Focus on assigned engagements, complete professional tasks and keep clients informed.",
    priorities: ["Complete due tasks", "Prepare client deliverables", "Record important engagement notes"],
    primaryLinks: [
      { label: "My engagements", href: "/staff/engagements", description: "Open work currently assigned to you." },
      { label: "My tasks", href: "/staff/tasks", description: "See deadlines, dependencies and blockers." },
      { label: "Documents", href: "/staff/documents", description: "Upload and review engagement files." },
    ],
  },
  reviewer: {
    title: "Review workspace",
    subtitle: "KYC, evidence and quality decisions",
    description: "Review assigned evidence, record clear decisions and escalate risks that need senior attention.",
    priorities: ["Process assigned KYC reviews", "Resolve missing evidence", "Record review decisions"],
    primaryLinks: [
      { label: "KYC queue", href: "/staff/kyc", description: "Review questionnaires, evidence and risk." },
      { label: "Review tasks", href: "/staff/reviews", description: "Open your pending quality checks." },
      { label: "Documents", href: "/staff/documents", description: "Inspect files linked to each review." },
    ],
  },
  finance_officer: {
    title: "Finance workspace",
    subtitle: "Invoices, payments and financial reporting",
    description: "Prepare invoices, record client payments and keep financial records reconciled.",
    priorities: ["Prepare approved invoices", "Record incoming payments", "Resolve reconciliation differences"],
    primaryLinks: [
      { label: "Invoices", href: "/staff/invoices", description: "Create, review and issue client invoices." },
      { label: "Payments", href: "/staff/payments", description: "Record and reconcile client payments." },
      { label: "Finance reports", href: "/staff/reports", description: "Review billing and payment summaries." },
    ],
  },
  document_controller: {
    title: "Document control workspace",
    subtitle: "Documents, templates, retention and records",
    description: "Control document quality, classification, versions and retention across client work.",
    priorities: ["Classify new documents", "Resolve document review issues", "Maintain retention records"],
    primaryLinks: [
      { label: "Document library", href: "/staff/documents", description: "Review, classify and manage files." },
      { label: "Templates", href: "/staff/templates", description: "Maintain approved document templates." },
      { label: "Archive", href: "/staff/archive", description: "Manage retained and completed records." },
    ],
  },
  support_staff: {
    title: "Client support workspace",
    subtitle: "Client enquiries, coordination and follow-up",
    description: "Handle client communication, coordinate routine requests and keep support tasks moving.",
    priorities: ["Respond to client messages", "Follow up open support tasks", "Organize requested documents"],
    primaryLinks: [
      { label: "Client messages", href: "/staff/messages", description: "Respond to assigned conversations." },
      { label: "Support tasks", href: "/staff/tasks", description: "Open follow-ups and coordination work." },
      { label: "Clients", href: "/staff/clients", description: "View client details needed for support." },
    ],
  },
  auditor: {
    title: "Audit workspace",
    subtitle: "Read-only assurance, records and activity history",
    description: "Review evidence, controls and activity history without changing operational records.",
    priorities: ["Review audit exceptions", "Inspect retained evidence", "Export assurance reports"],
    primaryLinks: [
      { label: "Activity history", href: "/staff/audit", description: "Review recorded system and user changes." },
      { label: "Reports", href: "/staff/reports", description: "Open operational and assurance summaries." },
      { label: "Archive", href: "/staff/archive", description: "Inspect retained records and legal holds." },
    ],
  },
};

function link(label: string, href: string, icon: DashboardNavItem["icon"], symbol: string, badge?: string) {
  return { label, href, icon, symbol, ...(badge ? { badge } : {}) } satisfies DashboardNavItem;
}

const roleNavigation: Record<StaffAccountRole, DashboardNavItem> = {
  engagement_manager: {
    label: "Engagement management", icon: "briefcase", defaultOpen: true,
    children: [
      link("Engagement requests", "/staff/requests", "inbox", "R"),
      link("All engagements", "/staff/engagements", "briefcase", "E"),
      link("Team workload", "/staff/team-workload", "staff", "W"),
      link("Tasks", "/staff/tasks", "listTodo", "T"),
      link("Clients", "/staff/clients", "users", "C"),
      link("KYC coordination", "/staff/kyc", "fileCheck", "K"),
    ],
  },
  consultant: {
    label: "Consulting work", icon: "briefcase", defaultOpen: true,
    children: [
      link("My engagements", "/staff/engagements", "briefcase", "E"),
      link("My tasks", "/staff/tasks", "listTodo", "T"),
      link("Clients", "/staff/clients", "users", "C"),
      link("Documents", "/staff/documents", "documents", "D"),
      link("Internal notes", "/staff/notes", "fileClock", "N"),
      link("AI workspace", "/staff/ai", "sparkles", "AI"),
    ],
  },
  reviewer: {
    label: "Review work", icon: "clipboard", defaultOpen: true,
    children: [
      link("KYC queue", "/staff/kyc", "fileCheck", "K"),
      link("Review queue", "/staff/reviews", "clipboard", "R"),
      link("Review tasks", "/staff/tasks", "listTodo", "T"),
      link("Documents", "/staff/documents", "documents", "D"),
      link("Clients", "/staff/clients", "users", "C"),
      link("Assigned engagements", "/staff/engagements", "briefcase", "E"),
      link("Internal notes", "/staff/notes", "fileClock", "N"),
      link("AI workspace", "/staff/ai", "sparkles", "AI"),
    ],
  },
  finance_officer: {
    label: "Finance work", icon: "finance", defaultOpen: true,
    children: [
      link("Invoices", "/staff/invoices", "invoice", "I"),
      link("Payments", "/staff/payments", "money", "P"),
      link("Finance reports", "/staff/reports", "reports", "R"),
      link("Clients", "/staff/clients", "users", "C"),
      link("Engagements", "/staff/engagements", "briefcase", "E"),
      link("Invoice templates", "/staff/templates", "fileText", "T"),
      link("Finance archive", "/staff/archive", "archive", "A"),
    ],
  },
  document_controller: {
    label: "Records work", icon: "documents", defaultOpen: true,
    children: [
      link("Document library", "/staff/documents", "documents", "D"),
      link("Template library", "/staff/templates", "fileText", "T"),
      link("Records archive", "/staff/archive", "archive", "A"),
      link("Document reports", "/staff/reports", "reports", "R"),
      link("Engagements", "/staff/engagements", "briefcase", "E"),
      link("Clients", "/staff/clients", "users", "C"),
    ],
  },
  support_staff: {
    label: "Client support", icon: "users", defaultOpen: true,
    children: [
      link("Clients", "/staff/clients", "users", "C"),
      link("Support tasks", "/staff/tasks", "listTodo", "T"),
      link("Engagements", "/staff/engagements", "briefcase", "E"),
      link("Documents", "/staff/documents", "documents", "D"),
    ],
  },
  auditor: {
    label: "Audit and assurance", icon: "activity", defaultOpen: true,
    children: [
      link("Activity history", "/staff/audit", "activity", "AL"),
      link("Reports", "/staff/reports", "reports", "R"),
      link("Archive", "/staff/archive", "archive", "A"),
      link("KYC records", "/staff/kyc", "fileCheck", "K"),
      link("Finance records", "/staff/invoices", "invoice", "I"),
      link("Client records", "/staff/clients", "users", "C"),
      link("Staff records", "/staff/team", "staff", "S"),
      link("Engagement records", "/staff/engagements", "briefcase", "E"),
      link("Document records", "/staff/documents", "documents", "D"),
      link("Template records", "/staff/templates", "fileText", "T"),
    ],
  },
};

export function getPrimaryStaffRole(roleKeys: readonly AppRole[]) {
  return STAFF_ACCOUNT_ROLES.find((role) => roleKeys.includes(role)) ?? null;
}

export function canAccessStaffRoute(roleKeys: readonly AppRole[], route: StaffRouteKey) {
  if (route === "profile") {
    return Boolean(getPrimaryStaffRole(roleKeys));
  }

  return roleKeys.some(
    (role) => STAFF_ACCOUNT_ROLES.includes(role as StaffAccountRole) && routeAccess[role as StaffAccountRole].includes(route),
  );
}

export function getStaffWorkspace(role: StaffAccountRole): StaffWorkspace {
  return { role, roleLabel: ROLE_LABELS[role], ...workspaceDetails[role] };
}

export function getStaffNavItems(role: StaffAccountRole): DashboardNavItem[] {
  const canMessage = routeAccess[role].includes("messages");
  const overview: DashboardNavItem = {
    label: "Overview",
    icon: "gauge",
    defaultOpen: true,
    children: [
      link("Dashboard", "/staff", "gauge", "D"),
      link("Notifications", "/staff/notifications", "bell", "N"),
      link("Calendar", "/staff/calendar", "calendar", "CA"),
      link("My profile", "/staff/profile", "profile", "P"),
      ...(canMessage ? [link("Messages", "/staff/messages", "message", "M")] : []),
    ],
  };

  const supportingChildren: DashboardNavItem[] = [];
  if (routeAccess[role].includes("reports") && role !== "finance_officer" && role !== "document_controller" && role !== "auditor") {
    supportingChildren.push(link("Reports", "/staff/reports", "reports", "R"));
  }
  if (routeAccess[role].includes("templates") && role !== "finance_officer" && role !== "document_controller" && role !== "auditor") {
    supportingChildren.push(link("Templates", "/staff/templates", "fileText", "T"));
  }
  if (routeAccess[role].includes("archive") && role !== "finance_officer" && role !== "document_controller" && role !== "auditor") {
    supportingChildren.push(link("Archive", "/staff/archive", "archive", "A"));
  }

  return [
    overview,
    roleNavigation[role],
    ...(supportingChildren.length > 0
      ? [{ label: "Reference", icon: "folderArchive" as const, children: supportingChildren }]
      : []),
  ];
}
