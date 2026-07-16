import type { Permission } from "@/features/authorization/permissions";

export const TEMPLATE_CATEGORIES = [
  "engagement_letter",
  "workflow",
  "kyc",
  "document_request",
  "invoice",
  "email",
  "notification",
  "message",
  "ai_prompt",
  "report",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_STATUSES = [
  "draft",
  "pending_review",
  "published",
  "superseded",
  "archived",
] as const;

export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

export const TEMPLATE_OUTPUT_FORMATS = [
  "rich_text",
  "pdf",
  "email",
  "notification",
  "workflow",
  "form",
  "prompt",
  "report",
] as const;

export type TemplateOutputFormat = (typeof TEMPLATE_OUTPUT_FORMATS)[number];

export const TEMPLATE_CLIENT_TYPES = [
  "Individual",
  "Corporate",
  "SME",
  "Non-profit",
  "High-risk client",
  "Returning client",
] as const;

export const TEMPLATE_SERVICES = [
  "Tax Advisory",
  "Legal Representation",
  "KRA Assessment Review",
  "Tax Objection",
  "TAT Appeal",
  "Compliance Review",
  "Corporate Secretarial",
  "General Consultancy",
] as const;

export type TemplateVariableDefinition = {
  key: string;
  label: string;
  description: string;
  sampleValue: string;
  categories: TemplateCategory[];
};

export const TEMPLATE_VARIABLES: TemplateVariableDefinition[] = [
  {
    key: "clientName",
    label: "Client name",
    description: "The client's display name.",
    sampleValue: "Amina Holdings Ltd",
    categories: ["engagement_letter", "kyc", "document_request", "invoice", "email", "notification", "message", "report"],
  },
  {
    key: "companyName",
    label: "Company name",
    description: "Registered company or organization name.",
    sampleValue: "Amina Holdings Ltd",
    categories: ["engagement_letter", "kyc", "invoice", "report"],
  },
  {
    key: "registrationNumber",
    label: "Registration number",
    description: "Company or client registration identifier.",
    sampleValue: "CPR/2026/11492",
    categories: ["engagement_letter", "kyc", "report"],
  },
  {
    key: "taxNumber",
    label: "Tax number",
    description: "Tax PIN or revenue authority registration number.",
    sampleValue: "P052618349X",
    categories: ["engagement_letter", "kyc", "invoice", "report"],
  },
  {
    key: "engagementNumber",
    label: "Engagement number",
    description: "Unique engagement reference.",
    sampleValue: "IFT-ENG-2026-0042",
    categories: ["engagement_letter", "workflow", "document_request", "invoice", "email", "notification", "message", "report"],
  },
  {
    key: "serviceName",
    label: "Service name",
    description: "Consulting service linked to the template.",
    sampleValue: "KRA Assessment Review",
    categories: ["engagement_letter", "workflow", "document_request", "email", "notification", "message", "report", "ai_prompt"],
  },
  {
    key: "scopeOfWork",
    label: "Scope of work",
    description: "Approved engagement scope.",
    sampleValue: "Review assessment notice and prepare objection strategy.",
    categories: ["engagement_letter", "workflow", "email", "message", "ai_prompt"],
  },
  {
    key: "engagementFee",
    label: "Engagement fee",
    description: "Approved professional fee.",
    sampleValue: "180,000",
    categories: ["engagement_letter", "invoice"],
  },
  {
    key: "currency",
    label: "Currency",
    description: "Billing currency.",
    sampleValue: "KES",
    categories: ["engagement_letter", "invoice", "report"],
  },
  {
    key: "startDate",
    label: "Start date",
    description: "Engagement or report start date.",
    sampleValue: "15 July 2026",
    categories: ["engagement_letter", "workflow", "report"],
  },
  {
    key: "completionDate",
    label: "Completion date",
    description: "Expected completion date.",
    sampleValue: "30 August 2026",
    categories: ["engagement_letter", "workflow", "report"],
  },
  {
    key: "consultantName",
    label: "Consultant name",
    description: "Assigned consultant.",
    sampleValue: "Brian Mwangi",
    categories: ["engagement_letter", "workflow", "email", "message", "report"],
  },
  {
    key: "engagementManager",
    label: "Engagement manager",
    description: "Manager accountable for the engagement.",
    sampleValue: "Admin Portal",
    categories: ["engagement_letter", "workflow", "email", "message", "report"],
  },
  {
    key: "invoiceNumber",
    label: "Invoice number",
    description: "Generated invoice reference.",
    sampleValue: "INV-2026-0188",
    categories: ["invoice", "email", "notification", "message", "report"],
  },
  {
    key: "invoiceAmount",
    label: "Invoice amount",
    description: "Amount due on the invoice.",
    sampleValue: "KES 208,800",
    categories: ["invoice", "email", "notification", "message", "report"],
  },
  {
    key: "paymentTerms",
    label: "Payment terms",
    description: "Payment window or terms.",
    sampleValue: "Payment due within 14 days.",
    categories: ["engagement_letter", "invoice", "email", "message"],
  },
  {
    key: "dueDate",
    label: "Due date",
    description: "Invoice, task or document deadline.",
    sampleValue: "31 July 2026",
    categories: ["document_request", "invoice", "email", "notification", "message", "workflow"],
  },
  {
    key: "portalLink",
    label: "Portal link",
    description: "Direct link to the related portal record.",
    sampleValue: "https://portal.ifta.test/client",
    categories: ["email", "notification", "message", "document_request"],
  },
  {
    key: "issueDate",
    label: "Issue date",
    description: "Date an invoice or document is issued.",
    sampleValue: "15 July 2026",
    categories: ["invoice", "report"],
  },
  {
    key: "subtotal",
    label: "Subtotal",
    description: "Invoice subtotal before taxes.",
    sampleValue: "180,000",
    categories: ["invoice"],
  },
  {
    key: "tax",
    label: "Tax",
    description: "Invoice tax value.",
    sampleValue: "28,800",
    categories: ["invoice"],
  },
  {
    key: "total",
    label: "Total",
    description: "Invoice total.",
    sampleValue: "208,800",
    categories: ["invoice", "report"],
  },
  {
    key: "balance",
    label: "Balance",
    description: "Outstanding invoice balance.",
    sampleValue: "208,800",
    categories: ["invoice", "report"],
  },
  {
    key: "paymentInstructions",
    label: "Payment instructions",
    description: "Bank or payment instructions.",
    sampleValue: "Pay to IFTA Consulting account 123456.",
    categories: ["invoice", "email", "message"],
  },
];

export type TemplateCategoryMeta = {
  key: TemplateCategory;
  label: string;
  shortLabel: string;
  description: string;
  icon: "document" | "workflow" | "shield" | "fileRequest" | "invoice" | "mail" | "bell" | "message" | "sparkles" | "chart";
  outputFormat: TemplateOutputFormat;
  requiredSections: string[];
  requiredVariables: string[];
  permissionScope: Permission[];
};

export const TEMPLATE_CATEGORY_META: Record<TemplateCategory, TemplateCategoryMeta> = {
  engagement_letter: {
    key: "engagement_letter",
    label: "Engagement Letters",
    shortLabel: "Letters",
    description: "Create and manage standardized client engagement agreements.",
    icon: "document",
    outputFormat: "pdf",
    requiredSections: ["Client details", "Scope of services", "Professional fees", "Payment terms", "Signature section"],
    requiredVariables: ["clientName", "engagementNumber", "serviceName", "scopeOfWork", "engagementFee", "currency", "paymentTerms"],
    permissionScope: ["templates.read", "templates.manage_legal"],
  },
  workflow: {
    key: "workflow",
    label: "Workflows",
    shortLabel: "Workflows",
    description: "Define standard stages, tasks, milestones, dependencies and approval gates.",
    icon: "workflow",
    outputFormat: "workflow",
    requiredSections: ["Stages", "Tasks", "Approval points", "Completion conditions"],
    requiredVariables: ["serviceName", "engagementNumber"],
    permissionScope: ["templates.read", "engagements.update_workflow"],
  },
  kyc: {
    key: "kyc",
    label: "KYC",
    shortLabel: "KYC",
    description: "Define reusable client information, questionnaire and document requirements.",
    icon: "shield",
    outputFormat: "form",
    requiredSections: ["Client information", "Required documents", "Review rules"],
    requiredVariables: ["clientName", "companyName", "taxNumber"],
    permissionScope: ["templates.read", "kyc.review"],
  },
  document_request: {
    key: "document_request",
    label: "Document Requests",
    shortLabel: "Documents",
    description: "Prepare reusable document request sets staff can tailor before sending.",
    icon: "fileRequest",
    outputFormat: "form",
    requiredSections: ["Request title", "Client instructions", "Required documents", "Reminder rule"],
    requiredVariables: ["clientName", "serviceName", "dueDate"],
    permissionScope: ["templates.read", "documents.review"],
  },
  invoice: {
    key: "invoice",
    label: "Invoices",
    shortLabel: "Invoices",
    description: "Manage invoice layouts, terms, tax sections and payment instructions.",
    icon: "invoice",
    outputFormat: "pdf",
    requiredSections: ["Client information", "Invoice details", "Line items", "Payment instructions"],
    requiredVariables: ["invoiceNumber", "clientName", "issueDate", "dueDate", "subtotal", "tax", "total", "paymentInstructions"],
    permissionScope: ["templates.read", "templates.manage_financial", "invoices.create"],
  },
  email: {
    key: "email",
    label: "Emails",
    shortLabel: "Emails",
    description: "Control recurring email subjects, bodies, preview text and action links.",
    icon: "mail",
    outputFormat: "email",
    requiredSections: ["Subject", "Body", "Action"],
    requiredVariables: ["clientName", "portalLink"],
    permissionScope: ["templates.read", "messages.send"],
  },
  notification: {
    key: "notification",
    label: "Notifications",
    shortLabel: "Alerts",
    description: "Define concise in-app notifications with roles, severity and destination links.",
    icon: "bell",
    outputFormat: "notification",
    requiredSections: ["Title", "Message", "Action"],
    requiredVariables: ["clientName", "portalLink"],
    permissionScope: ["templates.read", "messages.send"],
  },
  message: {
    key: "message",
    label: "Messages",
    shortLabel: "Messages",
    description: "Help staff respond quickly to common client situations.",
    icon: "message",
    outputFormat: "rich_text",
    requiredSections: ["Message body", "Action requested"],
    requiredVariables: ["clientName", "serviceName"],
    permissionScope: ["templates.read", "messages.send"],
  },
  ai_prompt: {
    key: "ai_prompt",
    label: "AI Prompts",
    shortLabel: "AI Prompts",
    description: "Govern AI assistant instructions, output structure and review requirements.",
    icon: "sparkles",
    outputFormat: "prompt",
    requiredSections: ["System instructions", "Required inputs", "Output structure", "Human review"],
    requiredVariables: ["serviceName", "scopeOfWork"],
    permissionScope: ["templates.read", "templates.manage_ai_prompts", "ai.admin"],
  },
  report: {
    key: "report",
    label: "Reports",
    shortLabel: "Reports",
    description: "Build reusable operational and management report structures.",
    icon: "chart",
    outputFormat: "report",
    requiredSections: ["Default filters", "Columns", "Grouping", "Export formats"],
    requiredVariables: ["serviceName", "startDate", "completionDate"],
    permissionScope: ["templates.read", "reports.read"],
  },
};

export const TEMPLATE_PERMISSION_MATRIX = [
  { label: "View Templates", permission: "templates.read" },
  { label: "Create Templates", permission: "templates.create" },
  { label: "Edit Draft Templates", permission: "templates.edit_draft" },
  { label: "Submit Templates for Review", permission: "templates.submit_review" },
  { label: "Review Templates", permission: "templates.review" },
  { label: "Publish Templates", permission: "templates.publish" },
  { label: "Archive Templates", permission: "templates.archive" },
  { label: "Restore Templates", permission: "templates.restore" },
  { label: "View Template Usage", permission: "templates.view_usage" },
  { label: "Manage AI Prompt Templates", permission: "templates.manage_ai_prompts" },
  { label: "Manage Financial Templates", permission: "templates.manage_financial" },
  { label: "Manage Legal Templates", permission: "templates.manage_legal" },
] as const satisfies ReadonlyArray<{ label: string; permission: Permission }>;

export const TEMPLATE_SAMPLE_DATA: Record<string, string> = Object.fromEntries(
  TEMPLATE_VARIABLES.map((variable) => [variable.key, variable.sampleValue]),
);

export function getVariablesForCategory(category: TemplateCategory) {
  return TEMPLATE_VARIABLES.filter((variable) => variable.categories.includes(category));
}

export function getTemplateCategoryLabel(category: TemplateCategory) {
  return TEMPLATE_CATEGORY_META[category].label;
}

export function getTemplateStatusLabel(status: TemplateStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
