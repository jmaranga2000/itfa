export const publicNavItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Client Portal", href: "/client-portal" },
  { label: "AI Research", href: "/ai-research" },
  { label: "Contact", href: "/contact" },
] as const;

export const services = [
  {
    id: "tax-advisory",
    title: "Tax advisory and compliance",
    href: "/services#tax-advisory",
    summary:
      "KRA assessment reviews, objection support, reconciliations, compliance planning and tax-risk memos.",
    inclusions: ["Assessment review", "Compliance calendar", "Advisory response pack"],
    bestFor: "Organizations managing assessments, recurring compliance or material tax decisions.",
    outcome: "A documented position, practical action plan and controlled response timeline.",
  },
  {
    id: "financial-reporting",
    title: "Financial reporting and analysis",
    href: "/services#financial-reporting",
    summary:
      "Management accounts, financial analysis, reporting reviews and decision-ready performance insights.",
    inclusions: ["Reporting review", "Financial analysis", "Management insights"],
    bestFor: "Organizations strengthening financial visibility, reporting quality and management decisions.",
    outcome: "Clear financial findings, reliable reporting and practical recommendations for management.",
  },
  {
    id: "finance-process",
    title: "Finance process consulting",
    href: "/services#finance-process",
    summary:
      "Controls, reporting, payment reconciliation, billing reviews and board-ready advisory packs.",
    inclusions: ["Control review", "Payment reconciliation", "Reporting pack"],
    bestFor: "Finance teams improving control quality, reporting confidence and decision visibility.",
    outcome: "A prioritized improvement plan supported by clear findings and management reporting.",
  },
] as const;

export const pricingOptions = [
  {
    name: "Advisory request",
    price: "From KES 15,000",
    description: "Best for focused professional opinions, short reviews and documented next steps.",
    cadence: "Per engagement request",
    features: ["Defined question and deliverable", "Named reviewer", "Written recommendation"],
    featured: false,
  },
  {
    name: "Managed engagement",
    price: "Custom quotation",
    description: "Best for KYC-backed workspaces, multi-stage reviews and assigned staff collaboration.",
    cadence: "Scoped after admin review",
    features: ["Structured onboarding", "Secure document workspace", "Milestone-based delivery"],
    featured: true,
  },
  {
    name: "Retainer workspace",
    price: "Monthly terms",
    description: "Best for recurring tax and finance advisory with shared documents and reporting.",
    cadence: "Monthly or quarterly",
    features: ["Recurring advisory capacity", "Priority workflow", "Periodic management reporting"],
    featured: false,
  },
] as const;

export const workflowSteps = [
  "Browse services",
  "Add to engagement cart",
  "Checkout and account setup",
  "Admin review",
  "KYC and document review",
  "Engagement letter",
  "Active workspace",
  "Invoice, completion and archive",
] as const;

export const researchFeatures = [
  {
    title: "Engagement-scoped research",
    description: "Tax, compliance and finance research stays connected to the relevant client engagement and assigned team.",
  },
  {
    title: "Source-aware working notes",
    description: "Staff can preserve references, assumptions and review context alongside developing analysis.",
  },
  {
    title: "Controlled client summaries",
    description: "Internal exploration remains separate from the professional output approved for client use.",
  },
  {
    title: "Auditable usage",
    description: "Permissions and activity records support responsible oversight of AI-assisted work.",
  },
] as const;
