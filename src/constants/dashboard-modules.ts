export type DashboardPortal = "client" | "staff" | "admin";

export type DashboardModuleConfig = {
  key: string;
  portal: DashboardPortal;
  eyebrow: string;
  title: string;
  description: string;
  metrics: Array<{
    label: string;
    value: string;
    helper: string;
  }>;
  services: string[];
  actions: string[];
  workflow: string[];
};

function moduleConfig(
  portal: DashboardPortal,
  key: string,
  title: string,
  description: string,
  services: string[],
  actions: string[],
  workflow: string[],
): DashboardModuleConfig {
  return {
    key,
    portal,
    eyebrow:
      portal === "admin"
        ? "Administration"
        : portal === "staff"
          ? "Staff workspace"
          : "Client workspace",
    title,
    description,
    metrics: [
      { label: "Open items", value: "0", helper: "Live records appear when activity is available." },
      { label: "Actions due", value: "0", helper: "Only permission-scoped work is shown." },
      { label: "Access control", value: "On", helper: "Sensitive changes follow protected actions." },
    ],
    services,
    actions,
    workflow,
  };
}

export const clientModules = {
  engagements: moduleConfig(
    "client",
    "engagements",
    "Engagements",
    "Track requested, accepted, active, completed and archived consulting engagements.",
    ["Engagement request history", "Client progress timeline", "Assigned staff visibility"],
    ["Request new engagement", "Review engagement status", "Open active workspace"],
    ["Request submitted", "Admin review", "KYC opened", "Workspace active"],
  ),
  cart: moduleConfig(
    "client",
    "cart",
    "Engagement cart",
    "Review selected services before checkout and engagement request creation.",
    ["Selected service review", "Scope notes", "Checkout readiness"],
    ["Update cart", "Proceed to checkout", "Request quotation"],
    ["Select services", "Confirm scope", "Choose payment option", "Submit request"],
  ),
  kyc: moduleConfig(
    "client",
    "kyc",
    "KYC",
    "Complete questionnaires and upload required onboarding documents.",
    ["KYC questionnaire", "Required document checklist", "Review feedback"],
    ["Continue questionnaire", "Upload replacement", "Submit for review"],
    ["KYC opened", "Client submits", "Staff reviews", "Approved"],
  ),
  documents: moduleConfig(
    "client",
    "documents",
    "Documents",
    "Upload and access engagement-scoped documents through protected workflows.",
    ["Secure uploads", "Shared deliverables", "Document feedback"],
    ["Upload document", "View shared files", "Respond to feedback"],
    ["Upload", "Classify", "Review", "Share"],
  ),
  messages: moduleConfig(
    "client",
    "messages",
    "Messages",
    "Keep engagement-linked communication separated from internal staff notes.",
    ["Client thread inbox", "Engagement-linked replies", "Notification history"],
    ["Start message", "Reply to staff", "View thread history"],
    ["Message sent", "Staff responds", "Client action", "Resolved"],
  ),
  invoices: moduleConfig(
    "client",
    "invoices",
    "Invoices",
    "Review invoices, balances and billing records for your organization.",
    ["Invoice list", "Balance summary", "Downloadable billing records"],
    ["View invoice", "Download invoice", "Ask billing question"],
    ["Invoice created", "Client notified", "Payment recorded", "Reconciled"],
  ),
  payments: moduleConfig(
    "client",
    "payments",
    "Payments",
    "Track payment options, receipts and reconciliation status.",
    ["Payment instructions", "Receipt tracking", "Reconciliation status"],
    ["Record payment reference", "View receipt", "Contact finance"],
    ["Payment initiated", "Reference submitted", "Finance review", "Reconciled"],
  ),
  ai: moduleConfig(
    "client",
    "ai",
    "AI Assistant",
    "Access client-safe AI summaries and guided advisory prompts.",
    ["Client-safe summaries", "Research question drafts", "Engagement context prompts"],
    ["Draft question", "Review summary", "Send to staff"],
    ["Question drafted", "Context checked", "Staff reviewed", "Summary shared"],
  ),
  archive: moduleConfig(
    "client",
    "archive",
    "Archive",
    "Access completed workspaces, final deliverables and historical billing records.",
    ["Archived workspaces", "Final deliverables", "Historical invoices"],
    ["Open archive", "Download deliverable", "Request follow-up"],
    ["Engagement completed", "Client confirmation", "Archived", "Read-only access"],
  ),
} as const;

export const staffModules = {
  engagements: moduleConfig(
    "staff",
    "engagements",
    "Assigned engagements",
    "Work on engagement records assigned to you or permitted by your role.",
    ["Assigned workspace list", "Client context", "Milestone overview"],
    ["Open assigned work", "Update milestone", "Request client action"],
    ["Assigned", "Reviewed", "In progress", "Completed"],
  ),
  tasks: moduleConfig(
    "staff",
    "tasks",
    "Tasks",
    "Manage workflow tasks, deadlines, blockers and dependencies.",
    ["Task queue", "Dependency checks", "Deadline tracking"],
    ["Start task", "Mark blocked", "Complete task"],
    ["Queued", "Accepted", "Blocked or active", "Done"],
  ),
  clients: moduleConfig(
    "staff",
    "clients",
    "Clients",
    "Review client profiles, organizations and assignment-specific context.",
    ["Client profile access", "Organization overview", "Assignment scope"],
    ["Open client file", "Review organization", "Request update"],
    ["Assigned access", "Profile reviewed", "Documents checked", "Updated"],
  ),
  documents: moduleConfig(
    "staff",
    "documents",
    "Documents",
    "Review, classify and share engagement-scoped documents.",
    ["Document review queue", "Visibility controls", "Replacement requests"],
    ["Review document", "Request replacement", "Share deliverable"],
    ["Uploaded", "Reviewed", "Approved or returned", "Shared"],
  ),
  reviews: moduleConfig(
    "staff",
    "reviews",
    "Reviews",
    "Process KYC, document and engagement quality reviews.",
    ["KYC review", "Document review", "Completion review"],
    ["Approve item", "Reject item", "Request clarification"],
    ["Review opened", "Evidence checked", "Decision logged", "Client notified"],
  ),
  messages: moduleConfig(
    "staff",
    "messages",
    "Messages",
    "Respond to client communication with engagement context and audit visibility.",
    ["Client inbox", "Action requests", "Thread status"],
    ["Reply to client", "Create action request", "Close thread"],
    ["Incoming", "Assigned", "Responded", "Resolved"],
  ),
  notes: moduleConfig(
    "staff",
    "notes",
    "Internal notes",
    "Capture staff-only context that never appears in the client portal.",
    ["Internal note stream", "Risk observations", "Decision context"],
    ["Add note", "Link note to task", "Review history"],
    ["Note drafted", "Linked", "Reviewed", "Retained"],
  ),
  ai: moduleConfig(
    "staff",
    "ai",
    "AI Workspace",
    "Use AI-assisted professional research with staff-only review controls.",
    ["Research prompts", "Draft advisory notes", "Source-aware summaries"],
    ["Start research", "Save internal note", "Prepare client-safe summary"],
    ["Prompt", "Research", "Review", "Publish summary"],
  ),
  calendar: moduleConfig(
    "staff",
    "calendar",
    "Calendar",
    "Track engagement deadlines, review dates and staff workload.",
    ["Deadline calendar", "Review reminders", "Assignment schedule"],
    ["Add deadline", "Reschedule review", "Open day plan"],
    ["Scheduled", "Due soon", "Escalated", "Completed"],
  ),
} as const;

export const adminModules = {
  clients: moduleConfig(
    "admin",
    "clients",
    "Clients",
    "Manage client profiles, organizations, representatives and access status.",
    ["Client directory", "Organization profiles", "Representative access"],
    ["Create client", "Update profile", "Archive client"],
    ["Profile created", "Organization linked", "Access reviewed", "Archived"],
  ),
  staff: moduleConfig(
    "admin",
    "staff",
    "Staff",
    "Manage staff profiles, assignments, departments and account status.",
    ["Staff directory", "Assignment overview", "Access status"],
    ["Invite staff", "Assign role", "Suspend access"],
    ["Invited", "Role assigned", "Assigned to work", "Reviewed"],
  ),
  permissions: moduleConfig(
    "admin",
    "permissions",
    "Roles and access",
    "Choose what each team role can view and change.",
    ["Role list", "Access review", "Role assignments"],
    ["Assign role", "Review access", "Check account access"],
    ["Choose role", "Check access", "Save assignment", "Record change"],
  ),
  services: moduleConfig(
    "admin",
    "services",
    "Services",
    "Manage the services clients can request, their prices and whether they are available.",
    ["Service list", "Pricing", "Client availability"],
    ["Create service", "Edit pricing", "Publish service"],
    ["Draft", "Priced", "Reviewed", "Published"],
  ),
  requests: moduleConfig(
    "admin",
    "requests",
    "Engagement requests",
    "Review new client requests and start approved work.",
    ["New requests", "Service details", "Staff assignment"],
    ["Accept request", "Reject request", "Request clarification"],
    ["Submitted", "Admin review", "Decision", "KYC opened"],
  ),
  workflows: moduleConfig(
    "admin",
    "workflows",
    "Workflows",
    "Set up repeatable steps, tasks and progress stages for client work.",
    ["Workflow templates", "Task order", "Client progress labels"],
    ["Create template", "Update stage", "Publish workflow"],
    ["Template drafted", "Dependencies checked", "Approved", "Published"],
  ),
  templates: moduleConfig(
    "admin",
    "templates",
    "Templates",
    "Manage reusable templates for documents, messages and regular client work.",
    ["Template library", "Saved versions", "Approval review"],
    ["Create template", "Review changes", "Publish template"],
    ["Draft", "Reviewed", "Approved", "Published"],
  ),
  kyc: moduleConfig(
    "admin",
    "kyc",
    "Client verification (KYC)",
    "Review client identity information and decide what is approved or needs replacing.",
    ["Verification forms", "Items to review", "Problems to resolve"],
    ["Open review", "Approve KYC", "Request replacement"],
    ["Submitted", "Under review", "Decision logged", "Engagement unlocked"],
  ),
  invoices: moduleConfig(
    "admin",
    "invoices",
    "Invoices",
    "Create and send invoices, then match them with client payments.",
    ["Invoice list", "Approval checks", "Matched payments"],
    ["Create invoice", "Approve invoice", "Record payment"],
    ["Draft", "Approved", "Sent", "Reconciled"],
  ),
  reports: moduleConfig(
    "admin",
    "reports",
    "Reports",
    "Review operating metrics, engagement performance and finance summaries.",
    ["Pipeline reports", "Finance summaries", "AI usage reports"],
    ["Generate report", "Filter period", "Export summary"],
    ["Data collected", "Reviewed", "Exported", "Archived"],
  ),
  archive: moduleConfig(
    "admin",
    "archive",
    "Archive",
    "Review completed workspaces, archived users and retained historical records.",
    ["Archived accounts", "Completed workspaces", "Restore review"],
    ["Open archive", "Review record", "Restore item"],
    ["Completed", "Archived", "Read-only", "Retained"],
  ),
  audit: moduleConfig(
    "admin",
    "audit",
    "Activity history",
    "See who changed important information and when the change happened.",
    ["Search activity", "User activity", "Record history"],
    ["Search activity", "Open details", "Download history"],
    ["Change saved", "Added to history", "Reviewed", "Kept for reference"],
  ),
  settings: moduleConfig(
    "admin",
    "settings",
    "Settings",
    "Manage general portal options, security choices, notifications and connected services.",
    ["Security choices", "Notifications", "Connected services"],
    ["Change setting", "Update connection", "Review service"],
    ["Choose change", "Check details", "Save", "Record change"],
  ),
} as const;
