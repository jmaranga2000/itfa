import { Types } from "mongoose";
import { validateTemplateForPublish } from "@/features/templates/lifecycle";
import {
  TEMPLATE_CATEGORY_META,
  TEMPLATE_CLIENT_TYPES,
  TEMPLATE_SERVICES,
  getVariablesForCategory,
  type TemplateCategory,
  type TemplateStatus,
} from "@/features/templates/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { TemplateModel } from "@/models/template";
import { TemplateUsageModel } from "@/models/template-usage";
import { TemplateVersionModel } from "@/models/template-version";
import { UserModel } from "@/models/user";

type SeedTemplate = {
  name: string;
  slug: string;
  category: TemplateCategory;
  description: string;
  status: TemplateStatus;
  services: string[];
  clientTypes: string[];
  ownerRole: string;
  currentVersion: number;
  publishedVersion: number | null;
  content: string;
  draftContent?: string;
  usageCount: number;
};

const seedTemplates: SeedTemplate[] = [
  {
    name: "Standard Engagement Letter",
    slug: "standard-engagement-letter",
    category: "engagement_letter",
    description: "Approved letter of engagement covering scope, fees, duties and signatures.",
    status: "published",
    services: ["Tax Advisory", "KRA Assessment Review"],
    clientTypes: ["Corporate", "SME"],
    ownerRole: "engagement_manager",
    currentVersion: 2,
    publishedVersion: 2,
    usageCount: 24,
    content: `# Engagement Letter

## Client details
Client: {{clientName}}
Engagement: {{engagementNumber}}

## Engagement purpose
IFTA Consulting will support {{clientName}} on {{serviceName}}.

## Scope of services
{{scopeOfWork}}

## Deliverables
Professional advice, review notes and final deliverables will be provided through the portal.

## Responsibilities
The client will provide complete and accurate information.

## Professional fees
Fees are {{currency}} {{engagementFee}}.

## Payment terms
{{paymentTerms}}

## Confidentiality
Both parties will protect confidential information.

## Data protection
Client information will be handled under applicable data protection requirements.

## Termination
Either party may terminate according to the approved engagement terms.

## Dispute resolution
Disputes will first be escalated to the engagement manager.

## Limitation of liability
Professional liability is limited to the agreed engagement scope.

## Signature section
Signed by {{clientName}} and {{engagementManager}}.`,
  },
  {
    name: "Consultancy Workflow Blueprint",
    slug: "consultancy-workflow-blueprint",
    category: "workflow",
    description: "Standard workflow pattern for accepted consultancy engagements.",
    status: "published",
    services: ["General Consultancy", "Tax Advisory"],
    clientTypes: ["Corporate", "Individual"],
    ownerRole: "engagement_manager",
    currentVersion: 1,
    publishedVersion: 1,
    usageCount: 11,
    content: `# Workflow Template

## Stages
Intake, KYC, engagement letter, active work, client review, finance, completion and archive.

## Tasks
Each stage contains role-owned tasks for {{serviceName}} and {{engagementNumber}}.

## Approval points
KYC approval, engagement letter approval and final deliverable approval.

## Completion conditions
All required tasks, client actions and approvals must be completed.`,
  },
  {
    name: "Corporate KYC Checklist",
    slug: "corporate-kyc-checklist",
    category: "kyc",
    description: "Reusable KYC requirements for corporate clients and high-risk matters.",
    status: "published",
    services: ["Compliance Review", "Legal Representation"],
    clientTypes: ["Corporate", "High-risk client"],
    ownerRole: "reviewer",
    currentVersion: 1,
    publishedVersion: 1,
    usageCount: 18,
    content: `# KYC Template

## Client information
Collect company information for {{companyName}}, {{clientName}} and tax PIN {{taxNumber}}.

## Required documents
Certificate of incorporation, tax PIN, director identification and authorization letter.

## Review rules
Reviewer confirms completeness, expiry dates and risk classification before approval.`,
  },
  {
    name: "Tax Assessment Document Request",
    slug: "tax-assessment-document-request",
    category: "document_request",
    description: "Standard request for KRA assessment review document packs.",
    status: "published",
    services: ["KRA Assessment Review", "Tax Objection"],
    clientTypes: ["Corporate", "Individual"],
    ownerRole: "consultant",
    currentVersion: 1,
    publishedVersion: 1,
    usageCount: 31,
    content: `# Document Request

## Request title
Tax Assessment Review Documents

## Client instructions
Hello {{clientName}}, please upload the documents needed for {{serviceName}} before {{dueDate}}.

## Required documents
KRA assessment notice, tax ledger, tax returns, payment records and KRA correspondence.

## Reminder rule
Send reminders three days before the due date and on the due date.`,
  },
  {
    name: "Professional Services Invoice",
    slug: "professional-services-invoice",
    category: "invoice",
    description: "Invoice layout with branding, line items, tax, terms and payment details.",
    status: "pending_review",
    services: ["Tax Advisory", "Legal Representation"],
    clientTypes: ["Corporate", "SME"],
    ownerRole: "finance_officer",
    currentVersion: 2,
    publishedVersion: 1,
    usageCount: 13,
    content: `# Invoice

## Client information
Bill to {{clientName}} for engagement {{engagementNumber}}.

## Invoice details
Invoice {{invoiceNumber}} issued on {{issueDate}} and due on {{dueDate}}.

## Line items
Subtotal {{currency}} {{subtotal}}
Tax {{currency}} {{tax}}
Total {{currency}} {{total}}
Balance {{currency}} {{balance}}

## Payment instructions
{{paymentInstructions}}

## Terms
{{paymentTerms}}`,
    draftContent: `# Invoice

## Client information
Bill to {{clientName}} for engagement {{engagementNumber}}.

## Invoice details
Invoice {{invoiceNumber}} issued on {{issueDate}} and due on {{dueDate}}.

## Line items
Subtotal {{currency}} {{subtotal}}
Tax {{currency}} {{tax}}
Total {{currency}} {{total}}
Balance {{currency}} {{balance}}

## Payment instructions
{{paymentInstructions}}

## Terms
{{paymentTerms}}

## Notes
This invoice is generated from the latest finance-approved template draft.`,
  },
  {
    name: "Engagement Request Received Email",
    slug: "engagement-request-received-email",
    category: "email",
    description: "Email sent after a client submits an engagement request.",
    status: "published",
    services: ["General Consultancy"],
    clientTypes: ["Corporate", "Individual"],
    ownerRole: "support_staff",
    currentVersion: 1,
    publishedVersion: 1,
    usageCount: 46,
    content: `Subject
We received your {{serviceName}} request

## Body
Hello {{clientName}},

Your engagement request has been received. We will review the scope and respond through the portal.

## Action
Open {{portalLink}}`,
  },
  {
    name: "KYC Review Required Notification",
    slug: "kyc-review-required-notification",
    category: "notification",
    description: "Short in-app alert for staff when KYC review is waiting.",
    status: "published",
    services: ["Compliance Review"],
    clientTypes: ["Corporate", "Individual"],
    ownerRole: "reviewer",
    currentVersion: 1,
    publishedVersion: 1,
    usageCount: 29,
    content: `## Title
KYC Review Required

## Message
{{clientName}} submitted KYC documents for {{engagementNumber}}.

## Action
Review KYC at {{portalLink}}`,
  },
  {
    name: "Request Additional Documents Message",
    slug: "request-additional-documents-message",
    category: "message",
    description: "Reusable staff message requesting missing documents from a client.",
    status: "published",
    services: ["KRA Assessment Review", "Compliance Review"],
    clientTypes: ["Corporate", "Individual"],
    ownerRole: "consultant",
    currentVersion: 1,
    publishedVersion: 1,
    usageCount: 22,
    content: `## Message body
Hello {{clientName}}, we need additional documents to continue {{serviceName}}.

## Action requested
Please upload the missing items through {{portalLink}} before {{dueDate}}.`,
  },
  {
    name: "KRA Assessment Analysis Prompt",
    slug: "kra-assessment-analysis-prompt",
    category: "ai_prompt",
    description: "Controlled prompt for tax assessment analysis with required human review.",
    status: "draft",
    services: ["KRA Assessment Review", "Tax Objection"],
    clientTypes: ["Corporate", "SME"],
    ownerRole: "admin",
    currentVersion: 1,
    publishedVersion: null,
    usageCount: 0,
    content: `## System instructions
Analyze {{serviceName}} using professional tax advisory standards.

## Required inputs
Use the engagement scope: {{scopeOfWork}}.

## Output structure
1. Background
2. Facts
3. Issues
4. Tax analysis
5. Supporting evidence
6. Recommended action

## Human review
All AI output must be reviewed by qualified staff before use.`,
  },
  {
    name: "Engagement Status Report",
    slug: "engagement-status-report",
    category: "report",
    description: "Reusable management report for engagement progress and workload visibility.",
    status: "published",
    services: ["General Consultancy", "Tax Advisory"],
    clientTypes: ["Corporate", "Individual"],
    ownerRole: "admin",
    currentVersion: 1,
    publishedVersion: 1,
    usageCount: 9,
    content: `# Engagement Status Report

## Default filters
Date range {{startDate}} to {{completionDate}} and service {{serviceName}}.

## Columns
Client, engagement, stage, assignee, due date, risk and next action.

## Grouping
Group by service, status and responsible consultant.

## Export formats
PDF and CSV.`,
  },
];

function variableDefinitions(category: TemplateCategory) {
  const meta = TEMPLATE_CATEGORY_META[category];

  return getVariablesForCategory(category).map((variable) => ({
    key: variable.key,
    label: variable.label,
    description: variable.description,
    required: meta.requiredVariables.includes(variable.key),
    sampleValue: variable.sampleValue,
  }));
}

function versionSettings(category: TemplateCategory) {
  if (category === "invoice") {
    return {
      logo: "IFTA Consulting",
      currency: "KES",
      pdfPreview: true,
      taxSection: true,
    };
  }

  if (category === "ai_prompt") {
    return {
      roleRestricted: true,
      humanReviewRequired: true,
      clientAccess: false,
    };
  }

  return {
    desktopPreview: true,
    mobilePreview: true,
    approvalRequired: true,
  };
}

function statusForVersion(template: SeedTemplate, versionNumber: number): TemplateStatus {
  if (template.publishedVersion === versionNumber) {
    return template.currentVersion === versionNumber ? template.status : "superseded";
  }

  if (template.currentVersion === versionNumber) {
    return template.status;
  }

  return "superseded";
}

export async function seedTemplateData() {
  await connectToDatabase();

  const admin = await UserModel.findOne({ roleKeys: "admin" })
    .select("_id email")
    .lean()
    .exec();
  const adminId = (admin?._id as Types.ObjectId | undefined) ?? null;
  let templates = 0;
  let versions = 0;
  let usageRecords = 0;

  for (const seed of seedTemplates) {
    const meta = TEMPLATE_CATEGORY_META[seed.category];
    const template = await TemplateModel.findOneAndUpdate(
      { slug: seed.slug },
      {
        $set: {
          name: seed.name,
          category: seed.category,
          description: seed.description,
          purpose: meta.description,
          status: seed.status,
          currentVersionNumber: seed.currentVersion,
          publishedVersionNumber: seed.publishedVersion,
          applicableServices: seed.services,
          applicableClientTypes: seed.clientTypes,
          tags: [meta.shortLabel.toLowerCase(), seed.ownerRole],
          ownerRole: seed.ownerRole,
          approvalRules: {
            requiredApproval: true,
            requiredReviewerRole: seed.ownerRole,
            signatureRequired: seed.category === "engagement_letter",
            humanReviewRequired: true,
          },
          usageSummary: {
            totalUses: seed.usageCount,
            activeEngagements: Math.ceil(seed.usageCount * 0.35),
            historicalEngagements: Math.floor(seed.usageCount * 0.65),
            generatedDocuments: ["engagement_letter", "invoice", "document_request", "report"].includes(seed.category)
              ? seed.usageCount
              : 0,
            generatedMessages: ["email", "notification", "message"].includes(seed.category)
              ? seed.usageCount
              : 0,
            generatedReports: seed.category === "report" ? seed.usageCount : 0,
          },
          lastUsedAt: seed.usageCount > 0 ? new Date(Date.now() - 3 * 86_400_000) : null,
          updatedByUserId: adminId,
          publishedByUserId: seed.publishedVersion ? adminId : null,
          publishedAt: seed.publishedVersion ? new Date(Date.now() - 8 * 86_400_000) : null,
          archivedAt: null,
        },
        $setOnInsert: {
          slug: seed.slug,
          createdByUserId: adminId,
        },
      },
      { returnDocument: "after", upsert: true },
    ).exec();
    const templateId = template._id as Types.ObjectId;
    const definitions = variableDefinitions(seed.category);
    const versionNumbers = Array.from({ length: seed.currentVersion }, (_, index) => index + 1);

    templates += 1;

    for (const versionNumber of versionNumbers) {
      const content =
        versionNumber === seed.currentVersion && seed.draftContent ? seed.draftContent : seed.content;
      const validation = validateTemplateForPublish({
        content,
        variables: definitions,
        requiredVariables: meta.requiredVariables,
        requiredSections: meta.requiredSections,
      });
      const status = statusForVersion(seed, versionNumber);

      await TemplateVersionModel.findOneAndUpdate(
        { templateId, versionNumber },
        {
          $set: {
            status,
            subject: seed.category === "email" ? `Update for {{clientName}}` : "",
            previewText: seed.description,
            content,
            plainTextContent: content.replace(/[#*]/g, ""),
            outputFormat: meta.outputFormat,
            variables: definitions,
            requiredSections: meta.requiredSections,
            applicableServices: seed.services,
            applicableClientTypes: seed.clientTypes,
            settings: versionSettings(seed.category),
            changeSummary:
              versionNumber === 1
                ? "Initial approved version."
                : `Version ${versionNumber} updated for current company standards.`,
            validation: {
              publishReady: validation.publishReady,
              errors: validation.errors,
              warnings: validation.warnings,
              lastValidatedAt: new Date(),
            },
            usageCount: versionNumber === seed.publishedVersion ? seed.usageCount : 0,
            createdByUserId: adminId,
            reviewedByUserId: status === "pending_review" ? adminId : null,
            publishedByUserId: status === "published" || status === "superseded" ? adminId : null,
            reviewedAt: status === "pending_review" ? new Date(Date.now() - 2 * 86_400_000) : null,
            publishedAt:
              status === "published" || status === "superseded"
                ? new Date(Date.now() - 8 * 86_400_000)
                : null,
            archivedAt: null,
          },
        },
        { upsert: true },
      ).exec();

      versions += 1;
    }

    const publishedVersion = seed.publishedVersion
      ? await TemplateVersionModel.findOne({
          templateId,
          versionNumber: seed.publishedVersion,
        }).exec()
      : null;

    if (publishedVersion && seed.usageCount > 0) {
      const usageId = `${seed.slug}-sample-usage`;

      await TemplateUsageModel.findOneAndUpdate(
        { generatedRecordType: "seed_sample", generatedRecordId: usageId },
        {
          $set: {
            templateId,
            versionId: publishedVersion._id,
            templateVersion: seed.publishedVersion,
            templateCategory: seed.category,
            clientName: "Amina Holdings Ltd",
            engagementReference: "IFT-ENG-2026-0042",
            renderedContent: seed.content,
            variableSnapshot: {
              clientName: "Amina Holdings Ltd",
              serviceName: seed.services[0],
            },
            usedByUserId: adminId,
            usedByName: admin?.email ?? "system",
            usedAt: new Date(Date.now() - 3 * 86_400_000),
          },
        },
        { upsert: true },
      ).exec();

      usageRecords += 1;
    }
  }

  return {
    templates,
    versions,
    usageRecords,
  };
}
