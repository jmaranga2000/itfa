export type AdminRequest = {
  id: string;
  reference: string;
  client: string;
  clientContact: string;
  service: string;
  status: "Admin review" | "Clarification" | "Ready to convert" | "KYC required" | "Quotation requested" | "Quotation preparing" | "Quotation sent" | "Converted";
  priority: "High" | "Medium";
  owner: string;
  submitted: string;
  nextAction: string;
  requestSummary: string;
  requestedOutcome: string;
  scope: string[];
  documents: Array<{ label: string; status: "Received" | "Needed" }>;
  timeline: Array<{ at: string; title: string; detail: string }>;
  source?: "legacy" | "database";
  workflowId?: string | null;
};

export const adminRequests: readonly AdminRequest[] = [
  {
    id: "req-2026-014",
    reference: "REQ-2026-014",
    client: "Amani Holdings",
    clientContact: "Njeri Mwangi, Finance Director",
    service: "Corporate tax planning",
    status: "Admin review",
    priority: "High",
    owner: "Engagement manager",
    submitted: "Jul 15, 2026",
    nextAction: "Confirm scope and assign reviewer",
    requestSummary: "The client is seeking a quarterly tax planning review before its next board meeting.",
    requestedOutcome: "A practical tax-planning plan with identified reliefs, risks and next-quarter actions.",
    scope: [
      "Review the current corporate income tax position.",
      "Assess available incentives and reliefs for planned investments.",
      "Prepare a board-ready summary of risks and recommended actions.",
    ],
    documents: [
      { label: "Latest management accounts", status: "Received" },
      { label: "Current tax computation", status: "Received" },
      { label: "Investment and expansion plan", status: "Needed" },
    ],
    timeline: [
      { at: "Jul 15, 2026, 09:24", title: "Request submitted", detail: "Client selected Corporate tax planning." },
      { at: "Jul 15, 2026, 09:31", title: "Files attached", detail: "Management accounts and tax computation received." },
      { at: "Jul 15, 2026, 10:02", title: "Assigned to intake", detail: "Waiting for engagement manager scope confirmation." },
    ],
  },
  {
    id: "req-2026-013",
    reference: "REQ-2026-013",
    client: "Nairobi Trade Co.",
    clientContact: "David Otieno, Chief Financial Officer",
    service: "Transfer pricing review",
    status: "Clarification",
    priority: "Medium",
    owner: "Consultant",
    submitted: "Jul 14, 2026",
    nextAction: "Request missing entity structure",
    requestSummary: "The client needs an independent review of its cross-border related-party transactions.",
    requestedOutcome: "A prioritized transfer-pricing risk report and an evidence checklist for the finance team.",
    scope: [
      "Map related-party transactions across the group.",
      "Review intercompany pricing documentation.",
      "Identify immediate documentation and policy gaps.",
    ],
    documents: [
      { label: "Related-party transaction schedule", status: "Received" },
      { label: "Group entity structure", status: "Needed" },
      { label: "Prior transfer-pricing report", status: "Needed" },
    ],
    timeline: [
      { at: "Jul 14, 2026, 14:10", title: "Request submitted", detail: "Client selected Transfer pricing review." },
      { at: "Jul 14, 2026, 15:05", title: "Initial review complete", detail: "Entity structure is needed before scope can be confirmed." },
      { at: "Jul 15, 2026, 08:30", title: "Clarification requested", detail: "Client has been asked for the group structure and prior report." },
    ],
  },
  {
    id: "req-2026-012",
    reference: "REQ-2026-012",
    client: "Kilele Foods",
    clientContact: "Esther Wanjiru, People Operations Lead",
    service: "Payroll compliance",
    status: "Ready to convert",
    priority: "Medium",
    owner: "Reviewer",
    submitted: "Jul 13, 2026",
    nextAction: "Open active engagement workspace",
    requestSummary: "The client has supplied payroll records and requested a compliance review before the next filing period.",
    requestedOutcome: "A payroll compliance findings report and a corrective-action tracker.",
    scope: [
      "Review payroll tax and statutory deduction calculations.",
      "Check filing and payment timing.",
      "Prepare an issue register with owners and due dates.",
    ],
    documents: [
      { label: "Payroll register", status: "Received" },
      { label: "Statutory filing history", status: "Received" },
      { label: "Employee changes register", status: "Received" },
    ],
    timeline: [
      { at: "Jul 13, 2026, 11:16", title: "Request submitted", detail: "Client selected Payroll compliance." },
      { at: "Jul 13, 2026, 12:05", title: "Intake review complete", detail: "Scope and documents are complete." },
      { at: "Jul 14, 2026, 09:00", title: "Ready to start", detail: "Create the engagement workspace and assign the review team." },
    ],
  },
  {
    id: "req-2026-011",
    reference: "REQ-2026-011",
    client: "Blue Rift Advisory",
    clientContact: "Kevin Mutua, Managing Partner",
    service: "KRA notice response",
    status: "KYC required",
    priority: "High",
    owner: "Support staff",
    submitted: "Jul 12, 2026",
    nextAction: "Trigger KYC review checklist",
    requestSummary: "The client has received a KRA notice and needs immediate support preparing a complete response.",
    requestedOutcome: "A reviewed response package and a schedule of required evidence before the notice deadline.",
    scope: [
      "Review the KRA notice and stated deadline.",
      "Create an evidence and response checklist.",
      "Draft and review the response package with the client.",
    ],
    documents: [
      { label: "KRA notice", status: "Received" },
      { label: "Company registration certificate", status: "Needed" },
      { label: "KRA PIN certificate", status: "Needed" },
    ],
    timeline: [
      { at: "Jul 12, 2026, 13:42", title: "Request submitted", detail: "Client selected KRA notice response." },
      { at: "Jul 12, 2026, 13:51", title: "KRA notice attached", detail: "Notice deadline recorded for the intake team." },
      { at: "Jul 12, 2026, 14:20", title: "KYC check required", detail: "Client verification must be complete before engagement creation." },
    ],
  },
];

export function getAdminRequest(requestId: string) {
  return adminRequests.find((request) => request.id === requestId) ?? null;
}
