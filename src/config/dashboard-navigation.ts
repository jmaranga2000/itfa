import type { DashboardNavItem } from "@/components/layout/dashboard-shell";

export const clientNavItems: DashboardNavItem[] = [
  {
    label: "Overview",
    icon: "gauge",
    defaultOpen: true,
    children: [
      { label: "Dashboard", href: "/client", icon: "gauge", symbol: "D" },
      { label: "Notifications", href: "/client/notifications", icon: "bell", symbol: "N" },
    ],
  },
  {
    label: "Engagements",
    icon: "briefcase",
    defaultOpen: true,
    children: [
      { label: "My engagements", href: "/client/engagements", icon: "briefcase", symbol: "E" },
      { label: "Service cart", href: "/client/cart", icon: "creditCard", symbol: "C" },
      { label: "KYC", href: "/client/kyc", icon: "fileCheck", symbol: "K", badge: "Open" },
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
      { label: "Payments", href: "/client/payments", icon: "money", symbol: "P" },
      { label: "Archive", href: "/client/archive", icon: "archive", symbol: "A" },
    ],
  },
];

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
    label: "Overview",
    icon: "operations",
    defaultOpen: true,
    children: [
      { label: "Dashboard", href: "/admin/dashboard", icon: "gauge", symbol: "D" },
      { label: "Notifications", href: "/admin/notifications", icon: "bell", symbol: "N" },
    ],
  },
  {
    label: "Client work",
    icon: "users",
    defaultOpen: true,
    children: [
      { label: "Clients", href: "/admin/clients", icon: "users", symbol: "C" },
      {
        label: "New requests",
        href: "/admin/requests",
        icon: "inbox",
        symbol: "ER",
        badge: "6",
      },
      {
        label: "Active client work",
        href: "/admin/active-engagements",
        icon: "briefcase",
        symbol: "AE",
      },
      { label: "Client verification (KYC)", href: "/admin/kyc", icon: "fileCheck", symbol: "K" },
      { label: "Messages", href: "/admin/messages", icon: "message", symbol: "M" },
    ],
  },
  {
    label: "Tasks and workflows",
    icon: "workflow",
    defaultOpen: false,
    children: [
      { label: "Workflows", href: "/admin/workflows", icon: "workflow", symbol: "W" },
      {
        label: "Workflow templates",
        href: "/admin/workflow-templates",
        icon: "workflow",
        symbol: "WT",
      },
      { label: "Tasks", href: "/admin/tasks", icon: "listTodo", symbol: "T" },
    ],
  },
  {
    label: "Documents and templates",
    icon: "documents",
    defaultOpen: false,
    children: [
      { label: "Documents", href: "/admin/documents", icon: "documents", symbol: "F" },
      { label: "Templates", href: "/admin/templates", icon: "fileText", symbol: "T" },
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
      { label: "Archive", href: "/admin/archive", icon: "archive", symbol: "A" },
    ],
  },
  {
    label: "Services and payments",
    icon: "finance",
    defaultOpen: false,
    children: [
      { label: "Services", href: "/admin/services", icon: "briefcase", symbol: "SV" },
      { label: "Pricing", href: "/admin/pricing", icon: "money", symbol: "PR" },
      { label: "Invoices", href: "/admin/invoices", icon: "invoice", symbol: "I" },
      { label: "Payments", href: "/admin/payments", icon: "creditCard", symbol: "P" },
      { label: "Reports", href: "/admin/reports", icon: "reports", symbol: "R" },
    ],
  },
  {
    label: "AI tools",
    icon: "sparkles",
    defaultOpen: false,
    children: [{ label: "AI activity", href: "/admin/ai-usage", icon: "sparkles", symbol: "AI" }],
  },
  {
    label: "Team and settings",
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
      { label: "Activity history", href: "/admin/audit", icon: "activity", symbol: "AL" },
      { label: "Connected services", href: "/admin/integrations", icon: "lock", symbol: "IN" },
      { label: "Settings", href: "/admin/settings", icon: "settings", symbol: "ST" },
    ],
  },
];
