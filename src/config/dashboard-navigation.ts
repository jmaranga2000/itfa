import type { DashboardNavItem } from "@/components/layout/dashboard-shell";

export function getClientNavItems(cartCount = 0, kycOpen = false): DashboardNavItem[] {
  return [
  {
    label: "Overview",
    icon: "gauge",
    defaultOpen: true,
    children: [
      { label: "Dashboard", href: "/client", icon: "gauge", symbol: "D" },
      { label: "Notifications", href: "/client/notifications", icon: "bell", symbol: "N" },
      { label: "Calendar", href: "/client/calendar", icon: "calendar", symbol: "CA" },
      { label: "My profile", href: "/client/profile", icon: "profile", symbol: "P" },
    ],
  },
  {
    label: "Engagements",
    icon: "briefcase",
    defaultOpen: true,
    children: [
      { label: "Browse services", href: "/client/services", icon: "briefcase", symbol: "S" },
      { label: "My engagements", href: "/client/engagements", icon: "briefcase", symbol: "E" },
      { label: "Engagement letters", href: "/client/engagement-letters", icon: "fileText", symbol: "EL" },
      { label: "Service cart", href: "/client/cart", icon: "creditCard", symbol: "C", ...(cartCount > 0 ? { badge: String(cartCount) } : {}) },
      { label: "KYC", href: "/client/kyc", icon: "fileCheck", symbol: "K", badge: kycOpen ? "Open" : "Locked" },
    ],
  },
  {
    label: "Workspace",
    icon: "documents",
    children: [
      { label: "Documents", href: "/client/documents", icon: "documents", symbol: "F" },
      { label: "Messages", href: "/client/messages", icon: "message", symbol: "M" },
      { label: "AI Assistant", href: "/client/ai", icon: "sparkles", symbol: "AI" },
    ],
  },
  {
    label: "Billing and records",
    icon: "finance",
    children: [
      { label: "Invoices", href: "/client/invoices", icon: "invoice", symbol: "I" },
      { label: "Quotations", href: "/client/quotations", icon: "money", symbol: "Q" },
      { label: "Payments", href: "/client/payments", icon: "money", symbol: "P" },
      { label: "Archive", href: "/client/archive", icon: "archive", symbol: "A" },
    ],
  },
  ];
}

export const staffNavItems: DashboardNavItem[] = [
  {
    label: "Overview",
    icon: "gauge",
    defaultOpen: true,
    children: [
      { label: "Dashboard", href: "/staff", icon: "gauge", symbol: "D" },
      { label: "Notifications", href: "/staff/notifications", icon: "bell", symbol: "N" },
      { label: "Calendar", href: "/staff/calendar", icon: "calendar", symbol: "CA" },
    ],
  },
  {
    label: "Client work",
    icon: "briefcase",
    defaultOpen: true,
    children: [
      { label: "Assigned engagements", href: "/staff/engagements", icon: "briefcase", symbol: "E" },
      { label: "Tasks", href: "/staff/tasks", icon: "listTodo", symbol: "T", badge: "4" },
      { label: "Clients", href: "/staff/clients", icon: "users", symbol: "C" },
      { label: "Reviews", href: "/staff/reviews", icon: "clipboard", symbol: "R" },
    ],
  },
  {
    label: "Workspace",
    icon: "documents",
    children: [
      { label: "Documents", href: "/staff/documents", icon: "documents", symbol: "F" },
      { label: "Messages", href: "/staff/messages", icon: "message", symbol: "M" },
      { label: "Internal notes", href: "/staff/notes", icon: "fileClock", symbol: "N" },
      { label: "AI Workspace", href: "/staff/ai", icon: "sparkles", symbol: "AI" },
    ],
  },
];

export const adminNavItems: DashboardNavItem[] = [
  {
    label: "Home",
    icon: "operations",
    defaultOpen: true,
    children: [
      { label: "Dashboard", href: "/admin/dashboard", icon: "gauge", symbol: "D" },
      { label: "Notifications", href: "/admin/notifications", icon: "bell", symbol: "N" },
    ],
  },
  {
    label: "Clients and work",
    icon: "users",
    defaultOpen: true,
    children: [
      { label: "Clients", href: "/admin/clients", icon: "users", symbol: "C" },
      {
        label: "Requests",
        href: "/admin/requests",
        icon: "inbox",
        symbol: "ER",
      },
      {
        label: "Active work",
        href: "/admin/active-engagements",
        icon: "briefcase",
        symbol: "AE",
      },
      { label: "Client checks (KYC)", href: "/admin/kyc", icon: "fileCheck", symbol: "K" },
      { label: "Messages", href: "/admin/messages", icon: "message", symbol: "M" },
    ],
  },
  {
    label: "Daily work",
    icon: "workflow",
    defaultOpen: false,
    children: [
      { label: "Tasks", href: "/admin/tasks", icon: "listTodo", symbol: "T" },
      { label: "Workflows", href: "/admin/workflows", icon: "workflow", symbol: "W" },
      { label: "Documents", href: "/admin/documents", icon: "documents", symbol: "F" },
      { label: "Engagement letters", href: "/admin/engagement-letters", icon: "fileText", symbol: "EL" },
    ],
  },
  {
    label: "Services and templates",
    icon: "documents",
    defaultOpen: false,
    children: [
      { label: "Services", href: "/admin/services", icon: "briefcase", symbol: "SV" },
      { label: "Pricing", href: "/admin/pricing", icon: "money", symbol: "PR" },
      { label: "All templates", href: "/admin/templates", icon: "fileText", symbol: "T" },
      {
        label: "Workflow templates",
        href: "/admin/workflow-templates",
        icon: "workflow",
        symbol: "WT",
      },
      {
        label: "Letter templates",
        href: "/admin/letter-templates",
        icon: "fileText",
        symbol: "LT",
      },
      {
        label: "Invoice templates",
        href: "/admin/invoice-templates",
        icon: "invoice",
        symbol: "IT",
      },
    ],
  },
  {
    label: "Money and reports",
    icon: "finance",
    defaultOpen: false,
    children: [
      { label: "Invoices", href: "/admin/invoices", icon: "invoice", symbol: "I" },
      { label: "Quotations", href: "/admin/quotations", icon: "money", symbol: "Q" },
      { label: "Payments", href: "/admin/payments", icon: "creditCard", symbol: "P" },
      { label: "Reports", href: "/admin/reports", icon: "reports", symbol: "R" },
      { label: "Archive", href: "/admin/archive", icon: "archive", symbol: "A" },
    ],
  },
  {
    label: "Team and system",
    icon: "settings",
    defaultOpen: false,
    children: [
      { label: "Staff", href: "/admin/staff", icon: "staff", symbol: "S" },
      {
        label: "Roles and access",
        href: "/admin/permissions",
        icon: "permissions",
        symbol: "RP",
      },
      { label: "AI activity", href: "/admin/ai-usage", icon: "sparkles", symbol: "AI" },
      { label: "Activity log", href: "/admin/audit", icon: "activity", symbol: "AL" },
      { label: "Connections", href: "/admin/integrations", icon: "lock", symbol: "IN" },
      { label: "Settings", href: "/admin/settings", icon: "settings", symbol: "ST" },
    ],
  },
];

export function getAdminNavItems(newRequestCount = 0): DashboardNavItem[] {
  return adminNavItems.map((group) => ({
    ...group,
    children: group.children?.map((item) => item.href === "/admin/requests"
      ? {
          ...item,
          ...(newRequestCount > 0
            ? { badge: newRequestCount > 99 ? "99+" : String(newRequestCount), badgeTone: "danger" as const }
            : {}),
        }
      : item),
  }));
}
