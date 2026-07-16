import { Types } from "mongoose";
import {
  hasAnyPermission,
  hasPermission,
  type Principal,
} from "@/features/authorization/access-control";
import type { Permission } from "@/features/authorization/permissions";
import { writeAuditLog } from "@/features/audit/audit-service";
import {
  assertTemplateStatusTransition,
  renderTemplateContent,
  validateTemplateForPublish,
  type TemplateValidationReport,
} from "@/features/templates/lifecycle";
import {
  TEMPLATE_CATEGORY_META,
  TEMPLATE_CLIENT_TYPES,
  TEMPLATE_PERMISSION_MATRIX,
  TEMPLATE_SAMPLE_DATA,
  TEMPLATE_SERVICES,
  TEMPLATE_VARIABLES,
  getTemplateStatusLabel,
  getVariablesForCategory,
  type TemplateCategoryMeta,
  type TemplateCategory,
  type TemplateOutputFormat,
  type TemplateStatus,
} from "@/features/templates/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuthorizationError } from "@/lib/errors";
import { AuditLogModel } from "@/models/audit-log";
import { TemplateModel } from "@/models/template";
import { TemplateUsageModel } from "@/models/template-usage";
import { TemplateVersionModel } from "@/models/template-version";

type TemplateUsageSummary = {
  totalUses: number;
  activeEngagements: number;
  historicalEngagements: number;
  generatedDocuments: number;
  generatedMessages: number;
  generatedReports: number;
};

type TemplateApprovalRules = {
  requiredApproval: boolean;
  requiredReviewerRole: string;
  signatureRequired: boolean;
  humanReviewRequired: boolean;
};

export type TemplateVariableRecord = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  sampleValue: string;
};

export type TemplateVersionRecord = {
  id: string;
  templateId: string;
  versionNumber: number;
  status: TemplateStatus;
  subject: string;
  previewText: string;
  content: string;
  renderedPreview: string;
  plainTextContent: string;
  outputFormat: TemplateOutputFormat;
  variables: TemplateVariableRecord[];
  requiredSections: string[];
  applicableServices: string[];
  applicableClientTypes: string[];
  settings: Record<string, unknown>;
  changeSummary: string;
  validation: TemplateValidationReport;
  usageCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
};

export type TemplateRecord = {
  id: string;
  name: string;
  slug: string;
  category: TemplateCategory;
  categoryLabel: string;
  description: string;
  purpose: string;
  status: TemplateStatus;
  statusLabel: string;
  currentVersionNumber: number;
  publishedVersionNumber: number | null;
  applicableServices: string[];
  applicableClientTypes: string[];
  tags: string[];
  ownerRole: string;
  approvalRules: TemplateApprovalRules;
  usageSummary: TemplateUsageSummary;
  lastUsedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  currentVersion: TemplateVersionRecord | null;
};

export type TemplateUsageRecord = {
  id: string;
  templateId: string;
  versionId: string;
  templateVersion: number;
  templateCategory: TemplateCategory;
  clientName: string;
  engagementReference: string;
  generatedRecordType: string;
  generatedRecordId: string;
  usedByName: string;
  usedAt: string | null;
};

export type TemplateAuditRecord = {
  id: string;
  action: string;
  actorEmail: string | null;
  reason: string | null;
  createdAt: string | null;
};

export type TemplateVersionComparison = {
  baseVersion: number | null;
  compareVersion: number | null;
  addedText: string[];
  removedText: string[];
  changedVariables: string[];
  changedSettings: string[];
  changedApplicability: string[];
};

export type TemplateCategoryCard = {
  key: TemplateCategory;
  label: string;
  description: string;
  icon: TemplateCategoryMeta["icon"];
  activeTemplates: number;
  drafts: number;
  pendingReview: number;
  lastUpdated: string | null;
  href: string;
};

export type TemplateManagementData = {
  summary: Array<{ label: string; value: string; helper: string }>;
  categoryCards: TemplateCategoryCard[];
  templates: TemplateRecord[];
  permissions: typeof TEMPLATE_PERMISSION_MATRIX;
  savedViews: Array<{ label: string; description: string; href: string }>;
  filterOptions: {
    categories: Array<{ value: TemplateCategory; label: string }>;
    statuses: Array<{ value: TemplateStatus; label: string }>;
    services: string[];
    clientTypes: string[];
  };
  activeCategory: TemplateCategory | null;
  search: string;
};

export type TemplateDetailData = {
  template: TemplateRecord;
  versions: TemplateVersionRecord[];
  usage: TemplateUsageRecord[];
  audit: TemplateAuditRecord[];
  comparison: TemplateVersionComparison;
  variableCatalogue: TemplateVariableRecord[];
};

export type TemplateListFilters = {
  search?: string;
  category?: TemplateCategory;
  status?: TemplateStatus;
  service?: string;
  clientType?: string;
};

type RawTemplate = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  category: TemplateCategory;
  description: string;
  purpose?: string;
  status?: TemplateStatus;
  currentVersionNumber?: number | null;
  publishedVersionNumber?: number | null;
  applicableServices?: string[];
  applicableClientTypes?: string[];
  tags?: string[];
  ownerRole?: string;
  approvalRules?: TemplateApprovalRules;
  usageSummary?: TemplateUsageSummary;
  lastUsedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  reviewedAt?: Date | null;
  publishedAt?: Date | null;
  archivedAt?: Date | null;
};

type RawTemplateVersion = {
  _id: Types.ObjectId;
  templateId: Types.ObjectId;
  versionNumber: number;
  status?: TemplateStatus;
  subject?: string;
  previewText?: string;
  content: string;
  plainTextContent?: string;
  outputFormat?: TemplateOutputFormat;
  variables?: TemplateVariableRecord[];
  requiredSections?: string[];
  applicableServices?: string[];
  applicableClientTypes?: string[];
  settings?: Record<string, unknown>;
  changeSummary?: string;
  validation?: Pick<TemplateValidationReport, "publishReady" | "errors" | "warnings"> & {
    lastValidatedAt?: Date | null;
  };
  usageCount?: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  reviewedAt?: Date | null;
  publishedAt?: Date | null;
  archivedAt?: Date | null;
};

type RawTemplateUsage = {
  _id: Types.ObjectId;
  templateId: Types.ObjectId;
  versionId: Types.ObjectId;
  templateVersion: number;
  templateCategory: TemplateCategory;
  clientName?: string;
  engagementReference?: string;
  generatedRecordType: string;
  generatedRecordId: string;
  usedByName?: string;
  usedAt?: Date | null;
};

type RawAudit = {
  _id: Types.ObjectId;
  action: string;
  actorEmail?: string | null;
  reason?: string | null;
  createdAt?: Date | null;
};

const TEMPLATE_READ_PERMISSIONS = [
  "templates.read",
  "templates.manage",
  "permissions.manage",
] as const satisfies ReadonlyArray<Permission>;

const TEMPLATE_CREATE_PERMISSIONS = [
  "templates.create",
  "templates.manage",
  "permissions.manage",
] as const satisfies ReadonlyArray<Permission>;

const TEMPLATE_EDIT_PERMISSIONS = [
  "templates.edit_draft",
  "templates.manage",
  "permissions.manage",
] as const satisfies ReadonlyArray<Permission>;

const TEMPLATE_REVIEW_PERMISSIONS = [
  "templates.review",
  "templates.manage",
  "permissions.manage",
] as const satisfies ReadonlyArray<Permission>;

const TEMPLATE_PUBLISH_PERMISSIONS = [
  "templates.publish",
  "templates.manage",
  "permissions.manage",
] as const satisfies ReadonlyArray<Permission>;

const TEMPLATE_ARCHIVE_PERMISSIONS = [
  "templates.archive",
  "templates.manage",
  "permissions.manage",
] as const satisfies ReadonlyArray<Permission>;

const TEMPLATE_RESTORE_PERMISSIONS = [
  "templates.restore",
  "templates.manage",
  "permissions.manage",
] as const satisfies ReadonlyArray<Permission>;

function assertAnyTemplatePermission(principal: Principal, permissions: readonly Permission[]) {
  if (!hasAnyPermission(principal, permissions)) {
    throw new AuthorizationError();
  }
}

function canViewCategory(principal: Principal, category: TemplateCategory) {
  const categoryPermissions = TEMPLATE_CATEGORY_META[category].permissionScope;
  return (
    hasAnyPermission(principal, TEMPLATE_READ_PERMISSIONS) ||
    hasAnyPermission(principal, categoryPermissions)
  );
}

function serializeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.toISOString();
}

function objectId(value: string | null | undefined) {
  if (!value || !Types.ObjectId.isValid(value)) {
    return null;
  }

  return new Types.ObjectId(value);
}

function actorObjectId(actor: Principal) {
  return objectId(actor.id);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(name: string) {
  const base = slugify(name) || "template";
  let candidate = base;
  let suffix = 2;

  while (await TemplateModel.exists({ slug: candidate }).exec()) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function defaultUsageSummary(): TemplateUsageSummary {
  return {
    totalUses: 0,
    activeEngagements: 0,
    historicalEngagements: 0,
    generatedDocuments: 0,
    generatedMessages: 0,
    generatedReports: 0,
  };
}

function defaultApprovalRules(): TemplateApprovalRules {
  return {
    requiredApproval: true,
    requiredReviewerRole: "admin",
    signatureRequired: false,
    humanReviewRequired: true,
  };
}

function normalizeVariable(variable: Partial<TemplateVariableRecord>): TemplateVariableRecord {
  const catalogue = TEMPLATE_VARIABLES.find((item) => item.key === variable.key);

  return {
    key: variable.key ?? "",
    label: variable.label ?? catalogue?.label ?? variable.key ?? "",
    description: variable.description ?? catalogue?.description ?? "",
    required: Boolean(variable.required),
    sampleValue: variable.sampleValue ?? catalogue?.sampleValue ?? "",
  };
}

function serializeVersion(version: RawTemplateVersion): TemplateVersionRecord {
  const validationReport = validateTemplateForPublish({
    content: version.content,
    variables: (version.variables ?? []).map(normalizeVariable),
    requiredVariables: (version.variables ?? [])
      .filter((variable) => variable.required)
      .map((variable) => variable.key),
    requiredSections: version.requiredSections ?? [],
  });

  return {
    id: version._id.toString(),
    templateId: version.templateId.toString(),
    versionNumber: version.versionNumber,
    status: version.status ?? "draft",
    subject: version.subject ?? "",
    previewText: version.previewText ?? "",
    content: version.content,
    renderedPreview: renderTemplateContent(version.content),
    plainTextContent: version.plainTextContent ?? "",
    outputFormat: version.outputFormat ?? "rich_text",
    variables: (version.variables ?? []).map(normalizeVariable),
    requiredSections: version.requiredSections ?? [],
    applicableServices: version.applicableServices ?? [],
    applicableClientTypes: version.applicableClientTypes ?? [],
    settings: version.settings ?? {},
    changeSummary: version.changeSummary ?? "",
    validation: {
      ...validationReport,
      errors: version.validation?.errors?.length ? version.validation.errors : validationReport.errors,
      warnings: version.validation?.warnings?.length
        ? version.validation.warnings
        : validationReport.warnings,
      publishReady: version.validation?.publishReady ?? validationReport.publishReady,
    },
    usageCount: version.usageCount ?? 0,
    createdAt: serializeDate(version.createdAt),
    updatedAt: serializeDate(version.updatedAt),
    reviewedAt: serializeDate(version.reviewedAt),
    publishedAt: serializeDate(version.publishedAt),
    archivedAt: serializeDate(version.archivedAt),
  };
}

function serializeTemplate(
  template: RawTemplate,
  currentVersion: TemplateVersionRecord | null,
): TemplateRecord {
  return {
    id: template._id.toString(),
    name: template.name,
    slug: template.slug,
    category: template.category,
    categoryLabel: TEMPLATE_CATEGORY_META[template.category].label,
    description: template.description,
    purpose: template.purpose ?? "",
    status: template.status ?? "draft",
    statusLabel: getTemplateStatusLabel(template.status ?? "draft"),
    currentVersionNumber: template.currentVersionNumber ?? 1,
    publishedVersionNumber: template.publishedVersionNumber ?? null,
    applicableServices: template.applicableServices ?? [],
    applicableClientTypes: template.applicableClientTypes ?? [],
    tags: template.tags ?? [],
    ownerRole: template.ownerRole ?? "admin",
    approvalRules: template.approvalRules ?? defaultApprovalRules(),
    usageSummary: template.usageSummary ?? defaultUsageSummary(),
    lastUsedAt: serializeDate(template.lastUsedAt),
    createdAt: serializeDate(template.createdAt),
    updatedAt: serializeDate(template.updatedAt),
    reviewedAt: serializeDate(template.reviewedAt),
    publishedAt: serializeDate(template.publishedAt),
    archivedAt: serializeDate(template.archivedAt),
    currentVersion,
  };
}

function serializeUsage(usage: RawTemplateUsage): TemplateUsageRecord {
  return {
    id: usage._id.toString(),
    templateId: usage.templateId.toString(),
    versionId: usage.versionId.toString(),
    templateVersion: usage.templateVersion,
    templateCategory: usage.templateCategory,
    clientName: usage.clientName ?? "",
    engagementReference: usage.engagementReference ?? "",
    generatedRecordType: usage.generatedRecordType,
    generatedRecordId: usage.generatedRecordId,
    usedByName: usage.usedByName ?? "",
    usedAt: serializeDate(usage.usedAt),
  };
}

function templateQuery(filters: TemplateListFilters, principal: Principal) {
  const query: Record<string, unknown> = {};

  if (filters.category) {
    query.category = filters.category;
  } else if (!hasAnyPermission(principal, TEMPLATE_READ_PERMISSIONS)) {
    query.category = {
      $in: Object.keys(TEMPLATE_CATEGORY_META).filter((category) =>
        canViewCategory(principal, category as TemplateCategory),
      ),
    };
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.service) {
    query.applicableServices = filters.service;
  }

  if (filters.clientType) {
    query.applicableClientTypes = filters.clientType;
  }

  if (filters.search) {
    const expression = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { name: expression },
      { description: expression },
      { purpose: expression },
      { applicableServices: expression },
      { applicableClientTypes: expression },
      { tags: expression },
    ];
  }

  return query;
}

function buildComparison(versions: TemplateVersionRecord[]): TemplateVersionComparison {
  const [latest, previous] = versions;

  if (!latest || !previous) {
    return {
      baseVersion: previous?.versionNumber ?? null,
      compareVersion: latest?.versionNumber ?? null,
      addedText: [],
      removedText: [],
      changedVariables: [],
      changedSettings: [],
      changedApplicability: [],
    };
  }

  const latestLines = latest.content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const previousLines = previous.content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const latestLineSet = new Set(latestLines);
  const previousLineSet = new Set(previousLines);
  const latestVariables = new Set(latest.variables.map((variable) => variable.key));
  const previousVariables = new Set(previous.variables.map((variable) => variable.key));

  return {
    baseVersion: previous.versionNumber,
    compareVersion: latest.versionNumber,
    addedText: latestLines.filter((line) => !previousLineSet.has(line)).slice(0, 6),
    removedText: previousLines.filter((line) => !latestLineSet.has(line)).slice(0, 6),
    changedVariables: [
      ...latest.variables
        .filter((variable) => !previousVariables.has(variable.key))
        .map((variable) => `Added ${variable.key}`),
      ...previous.variables
        .filter((variable) => !latestVariables.has(variable.key))
        .map((variable) => `Removed ${variable.key}`),
    ],
    changedSettings:
      JSON.stringify(latest.settings) === JSON.stringify(previous.settings)
        ? []
        : ["Template settings changed"],
    changedApplicability:
      JSON.stringify(latest.applicableServices) === JSON.stringify(previous.applicableServices) &&
      JSON.stringify(latest.applicableClientTypes) === JSON.stringify(previous.applicableClientTypes)
        ? []
        : ["Applicable services or client types changed"],
  };
}

async function loadCurrentVersions(templates: RawTemplate[]) {
  const ids = templates.map((template) => template._id);

  if (ids.length === 0) {
    return new Map<string, TemplateVersionRecord>();
  }

  const versions = (await TemplateVersionModel.find({ templateId: { $in: ids } })
    .sort({ versionNumber: -1 })
    .lean()
    .exec()) as unknown as RawTemplateVersion[];
  const byTemplate = new Map<string, TemplateVersionRecord>();

  for (const template of templates) {
    const current = versions.find(
      (version) =>
        version.templateId.toString() === template._id.toString() &&
        version.versionNumber === (template.currentVersionNumber ?? 1),
    );
    const latest = versions.find((version) => version.templateId.toString() === template._id.toString());

    if (current ?? latest) {
      byTemplate.set(template._id.toString(), serializeVersion((current ?? latest) as RawTemplateVersion));
    }
  }

  return byTemplate;
}

export async function getTemplateManagementData(
  principal: Principal,
  filters: TemplateListFilters = {},
): Promise<TemplateManagementData> {
  await connectToDatabase();
  assertAnyTemplatePermission(principal, TEMPLATE_READ_PERMISSIONS);

  if (filters.category && !canViewCategory(principal, filters.category)) {
    throw new AuthorizationError();
  }

  const [templates, allTemplates] = await Promise.all([
    TemplateModel.find(templateQuery(filters, principal))
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean()
      .exec(),
    TemplateModel.find(templateQuery({}, principal)).select("category status updatedAt usageSummary").lean().exec(),
  ]);
  const rawTemplates = templates as unknown as RawTemplate[];
  const currentVersions = await loadCurrentVersions(rawTemplates);
  const records = rawTemplates.map((template) =>
    serializeTemplate(template, currentVersions.get(template._id.toString()) ?? null),
  );
  const rawAllTemplates = allTemplates as unknown as RawTemplate[];
  const categoryCards = Object.values(TEMPLATE_CATEGORY_META).map((category) => {
    const categoryTemplates = rawAllTemplates.filter((template) => template.category === category.key);
    const activeTemplates = categoryTemplates.filter((template) => template.status === "published").length;
    const drafts = categoryTemplates.filter((template) => template.status === "draft").length;
    const pendingReview = categoryTemplates.filter((template) => template.status === "pending_review").length;
    const lastUpdated =
      categoryTemplates
        .map((template) => template.updatedAt)
        .filter(Boolean)
        .sort((a, b) => Number(b) - Number(a))[0] ?? null;

    return {
      key: category.key,
      label: category.label,
      description: category.description,
      icon: category.icon,
      activeTemplates,
      drafts,
      pendingReview,
      lastUpdated: serializeDate(lastUpdated),
      href: `/admin/templates?category=${category.key}`,
    };
  });
  const totalUsage = rawAllTemplates.reduce(
    (sum, template) => sum + (template.usageSummary?.totalUses ?? 0),
    0,
  );

  return {
    summary: [
      {
        label: "Published",
        value: String(rawAllTemplates.filter((template) => template.status === "published").length),
        helper: "Approved templates available for new work.",
      },
      {
        label: "Drafts",
        value: String(rawAllTemplates.filter((template) => template.status === "draft").length),
        helper: "Editable versions not yet in review.",
      },
      {
        label: "Pending review",
        value: String(rawAllTemplates.filter((template) => template.status === "pending_review").length),
        helper: "Templates waiting for approval.",
      },
      {
        label: "Usage records",
        value: String(totalUsage),
        helper: "Generated records linked to template versions.",
      },
    ],
    categoryCards,
    templates: records,
    permissions: TEMPLATE_PERMISSION_MATRIX,
    savedViews: [
      {
        label: "Awaiting review",
        description: "Drafts submitted for approval before publishing.",
        href: "/admin/templates?status=pending_review",
      },
      {
        label: "Published library",
        description: "Templates available for new engagements and staff use.",
        href: "/admin/templates?status=published",
      },
      {
        label: "AI governed prompts",
        description: "Role-restricted prompts that require human review.",
        href: "/admin/templates?category=ai_prompt",
      },
    ],
    filterOptions: {
      categories: Object.values(TEMPLATE_CATEGORY_META).map((category) => ({
        value: category.key,
        label: category.label,
      })),
      statuses: ["draft", "pending_review", "published", "superseded", "archived"].map(
        (status) => ({
          value: status as TemplateStatus,
          label: getTemplateStatusLabel(status as TemplateStatus),
        }),
      ),
      services: [...TEMPLATE_SERVICES],
      clientTypes: [...TEMPLATE_CLIENT_TYPES],
    },
    activeCategory: filters.category ?? null,
    search: filters.search ?? "",
  };
}

export async function getTemplateDetail(
  principal: Principal,
  templateId: string,
): Promise<TemplateDetailData | null> {
  await connectToDatabase();
  assertAnyTemplatePermission(principal, TEMPLATE_READ_PERMISSIONS);

  const id = objectId(templateId);

  if (!id) {
    return null;
  }

  const template = (await TemplateModel.findById(id).lean().exec()) as unknown as RawTemplate | null;

  if (!template || !canViewCategory(principal, template.category)) {
    return null;
  }

  const [versions, usage, audit] = await Promise.all([
    TemplateVersionModel.find({ templateId: id }).sort({ versionNumber: -1 }).lean().exec(),
    TemplateUsageModel.find({ templateId: id }).sort({ usedAt: -1 }).limit(50).lean().exec(),
    AuditLogModel.find({ resourceType: "Template", resourceId: templateId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec(),
  ]);
  const versionRecords = (versions as unknown as RawTemplateVersion[]).map(serializeVersion);
  const currentVersion =
    versionRecords.find((version) => version.versionNumber === (template.currentVersionNumber ?? 1)) ??
    versionRecords[0] ??
    null;

  return {
    template: serializeTemplate(template, currentVersion),
    versions: versionRecords,
    usage: (usage as unknown as RawTemplateUsage[]).map(serializeUsage),
    audit: (audit as unknown as RawAudit[]).map((record) => ({
      id: record._id.toString(),
      action: record.action,
      actorEmail: record.actorEmail ?? null,
      reason: record.reason ?? null,
      createdAt: serializeDate(record.createdAt),
    })),
    comparison: buildComparison(versionRecords),
    variableCatalogue: getVariablesForCategory(template.category).map((variable) => ({
      key: variable.key,
      label: variable.label,
      description: variable.description,
      required: TEMPLATE_CATEGORY_META[template.category].requiredVariables.includes(variable.key),
      sampleValue: variable.sampleValue,
    })),
  };
}

export async function createTemplateDraft(input: {
  actor: Principal;
  category: TemplateCategory;
  name: string;
  description: string;
  applicableServices?: string[];
  applicableClientTypes?: string[];
}) {
  await connectToDatabase();
  assertAnyTemplatePermission(input.actor, TEMPLATE_CREATE_PERMISSIONS);

  const category = TEMPLATE_CATEGORY_META[input.category];
  const name = input.name.trim() || `New ${category.shortLabel} Template`;
  const slug = await uniqueSlug(name);
  const variables = getVariablesForCategory(input.category).map((variable) => ({
    key: variable.key,
    label: variable.label,
    description: variable.description,
    required: category.requiredVariables.includes(variable.key),
    sampleValue: variable.sampleValue,
  }));
  const content = buildStarterContent(input.category);
  const validation = validateTemplateForPublish({
    content,
    variables,
    requiredVariables: category.requiredVariables,
    requiredSections: category.requiredSections,
  });
  const template = await TemplateModel.create({
    name,
    slug,
    category: input.category,
    description: input.description || category.description,
    purpose: category.description,
    status: "draft",
    currentVersionNumber: 1,
    publishedVersionNumber: null,
    applicableServices: input.applicableServices ?? [TEMPLATE_SERVICES[0]],
    applicableClientTypes: input.applicableClientTypes ?? [TEMPLATE_CLIENT_TYPES[0]],
    tags: [category.shortLabel.toLowerCase()],
    ownerRole: "admin",
    approvalRules: {
      requiredApproval: true,
      requiredReviewerRole: input.category === "invoice" ? "finance_officer" : "admin",
      signatureRequired: input.category === "engagement_letter",
      humanReviewRequired: true,
    },
    createdByUserId: actorObjectId(input.actor),
    updatedByUserId: actorObjectId(input.actor),
  });

  await TemplateVersionModel.create({
    templateId: template._id,
    versionNumber: 1,
    status: "draft",
    subject: input.category === "email" ? `${category.shortLabel} update for {{clientName}}` : "",
    previewText: category.description,
    content,
    plainTextContent: content.replace(/[#*]/g, ""),
    outputFormat: category.outputFormat,
    variables,
    requiredSections: category.requiredSections,
    applicableServices: input.applicableServices ?? [TEMPLATE_SERVICES[0]],
    applicableClientTypes: input.applicableClientTypes ?? [TEMPLATE_CLIENT_TYPES[0]],
    settings: buildStarterSettings(input.category),
    changeSummary: "Initial draft created.",
    validation: {
      publishReady: validation.publishReady,
      errors: validation.errors,
      warnings: validation.warnings,
      lastValidatedAt: new Date(),
    },
    createdByUserId: actorObjectId(input.actor),
  });

  await writeAuditLog({
    actor: input.actor,
    action: "template.created",
    resourceType: "Template",
    resourceId: template._id.toString(),
    newValues: { name, category: input.category },
  });

  return template._id.toString();
}

export async function duplicateTemplate(input: { actor: Principal; templateId: string }) {
  await connectToDatabase();
  assertAnyTemplatePermission(input.actor, TEMPLATE_CREATE_PERMISSIONS);

  const templateId = objectId(input.templateId);

  if (!templateId) {
    throw new Error("Template not found.");
  }

  const template = (await TemplateModel.findById(templateId).lean().exec()) as unknown as RawTemplate | null;
  const versions = (await TemplateVersionModel.find({ templateId })
    .sort({ versionNumber: -1 })
    .limit(1)
    .lean()
    .exec()) as unknown as RawTemplateVersion[];
  const sourceVersion = versions[0];

  if (!template || !sourceVersion) {
    throw new Error("Template not found.");
  }

  const name = `${template.name} Copy`;
  const slug = await uniqueSlug(name);
  const duplicate = await TemplateModel.create({
    name,
    slug,
    category: template.category,
    description: template.description,
    purpose: template.purpose,
    status: "draft",
    currentVersionNumber: 1,
    publishedVersionNumber: null,
    applicableServices: template.applicableServices ?? [],
    applicableClientTypes: template.applicableClientTypes ?? [],
    tags: template.tags ?? [],
    ownerRole: template.ownerRole ?? "admin",
    approvalRules: template.approvalRules ?? defaultApprovalRules(),
    createdByUserId: actorObjectId(input.actor),
    updatedByUserId: actorObjectId(input.actor),
  });

  await TemplateVersionModel.create({
    templateId: duplicate._id,
    versionNumber: 1,
    status: "draft",
    subject: sourceVersion.subject,
    previewText: sourceVersion.previewText,
    content: sourceVersion.content,
    plainTextContent: sourceVersion.plainTextContent,
    outputFormat: sourceVersion.outputFormat,
    variables: sourceVersion.variables,
    requiredSections: sourceVersion.requiredSections,
    applicableServices: sourceVersion.applicableServices,
    applicableClientTypes: sourceVersion.applicableClientTypes,
    settings: sourceVersion.settings,
    changeSummary: `Duplicated from ${template.name} v${sourceVersion.versionNumber}.`,
    validation: sourceVersion.validation,
    createdByUserId: actorObjectId(input.actor),
  });

  await writeAuditLog({
    actor: input.actor,
    action: "template.duplicated",
    resourceType: "Template",
    resourceId: duplicate._id.toString(),
    previousValues: { sourceTemplateId: input.templateId },
    newValues: { name, slug },
  });

  return duplicate._id.toString();
}

export async function createNewTemplateVersion(input: { actor: Principal; templateId: string }) {
  await connectToDatabase();
  assertAnyTemplatePermission(input.actor, TEMPLATE_EDIT_PERMISSIONS);

  const templateId = objectId(input.templateId);

  if (!templateId) {
    throw new Error("Template not found.");
  }

  const [template, versions] = await Promise.all([
    TemplateModel.findById(templateId).lean().exec(),
    TemplateVersionModel.find({ templateId }).sort({ versionNumber: -1 }).lean().exec(),
  ]);
  const rawTemplate = template as unknown as RawTemplate | null;
  const rawVersions = versions as unknown as RawTemplateVersion[];
  const source = rawVersions[0];

  if (!rawTemplate || !source) {
    throw new Error("Template not found.");
  }

  const nextVersionNumber = Math.max(...rawVersions.map((version) => version.versionNumber)) + 1;
  const version = await TemplateVersionModel.create({
    templateId,
    versionNumber: nextVersionNumber,
    status: "draft",
    subject: source.subject,
    previewText: source.previewText,
    content: source.content,
    plainTextContent: source.plainTextContent,
    outputFormat: source.outputFormat,
    variables: source.variables,
    requiredSections: source.requiredSections,
    applicableServices: source.applicableServices,
    applicableClientTypes: source.applicableClientTypes,
    settings: source.settings,
    changeSummary: `Draft version created from v${source.versionNumber}.`,
    validation: source.validation,
    createdByUserId: actorObjectId(input.actor),
  });

  await TemplateModel.updateOne(
    { _id: templateId },
    {
      $set: {
        status: "draft",
        currentVersionNumber: nextVersionNumber,
        updatedByUserId: actorObjectId(input.actor),
      },
    },
  ).exec();

  await writeAuditLog({
    actor: input.actor,
    action: "template.version_created",
    resourceType: "Template",
    resourceId: input.templateId,
    previousValues: { versionNumber: source.versionNumber },
    newValues: { versionNumber: nextVersionNumber, versionId: version._id.toString() },
  });

  return version._id.toString();
}

export async function submitTemplateForReview(input: { actor: Principal; templateId: string }) {
  await connectToDatabase();
  assertAnyTemplatePermission(input.actor, ["templates.submit_review", "templates.manage", "permissions.manage"]);

  const { template, version } = await loadTemplateAndCurrentVersion(input.templateId);
  assertTemplateStatusTransition(version.status ?? "draft", "pending_review");

  const category = TEMPLATE_CATEGORY_META[template.category];
  const validation = validateTemplateForPublish({
    content: version.content,
    variables: (version.variables ?? []).map(normalizeVariable),
    requiredVariables: category.requiredVariables,
    requiredSections: category.requiredSections,
  });

  await Promise.all([
    TemplateVersionModel.updateOne(
      { _id: version._id },
      {
        $set: {
          status: "pending_review",
          validation: {
            publishReady: validation.publishReady,
            errors: validation.errors,
            warnings: validation.warnings,
            lastValidatedAt: new Date(),
          },
          reviewedAt: null,
          reviewedByUserId: null,
        },
      },
    ).exec(),
    TemplateModel.updateOne(
      { _id: template._id },
      {
        $set: {
          status: "pending_review",
          updatedByUserId: actorObjectId(input.actor),
          reviewedAt: null,
          reviewedByUserId: null,
        },
      },
    ).exec(),
  ]);

  await writeAuditLog({
    actor: input.actor,
    action: "template.submitted_for_review",
    resourceType: "Template",
    resourceId: input.templateId,
    newValues: { status: "pending_review", validationErrors: validation.errors },
  });
}

export async function publishTemplateVersion(input: { actor: Principal; templateId: string }) {
  await connectToDatabase();
  assertAnyTemplatePermission(input.actor, TEMPLATE_PUBLISH_PERMISSIONS);

  const { template, version } = await loadTemplateAndCurrentVersion(input.templateId);
  assertTemplateStatusTransition(version.status ?? "draft", "published");

  const category = TEMPLATE_CATEGORY_META[template.category];
  const validation = validateTemplateForPublish({
    content: version.content,
    variables: (version.variables ?? []).map(normalizeVariable),
    requiredVariables: category.requiredVariables,
    requiredSections: category.requiredSections,
  });

  if (!validation.publishReady) {
    throw new Error(`Template cannot be published: ${validation.errors.join(", ")}`);
  }

  const actorId = actorObjectId(input.actor);

  await TemplateVersionModel.updateMany(
    {
      templateId: template._id,
      status: "published",
      _id: { $ne: version._id },
    },
    { $set: { status: "superseded" } },
  ).exec();
  await Promise.all([
    TemplateVersionModel.updateOne(
      { _id: version._id },
      {
        $set: {
          status: "published",
          publishedAt: new Date(),
          publishedByUserId: actorId,
          validation: {
            publishReady: true,
            errors: [],
            warnings: validation.warnings,
            lastValidatedAt: new Date(),
          },
        },
      },
    ).exec(),
    TemplateModel.updateOne(
      { _id: template._id },
      {
        $set: {
          status: "published",
          currentVersionNumber: version.versionNumber,
          publishedVersionNumber: version.versionNumber,
          publishedAt: new Date(),
          publishedByUserId: actorId,
          updatedByUserId: actorId,
        },
      },
    ).exec(),
  ]);

  await writeAuditLog({
    actor: input.actor,
    action: "template.published",
    resourceType: "Template",
    resourceId: input.templateId,
    newValues: { version: version.versionNumber, status: "published" },
  });
}

export async function archiveTemplate(input: { actor: Principal; templateId: string; reason?: string }) {
  await connectToDatabase();
  assertAnyTemplatePermission(input.actor, TEMPLATE_ARCHIVE_PERMISSIONS);

  const { template, version } = await loadTemplateAndCurrentVersion(input.templateId);
  assertTemplateStatusTransition(template.status ?? "draft", "archived");

  await Promise.all([
    TemplateModel.updateOne(
      { _id: template._id },
      {
        $set: {
          status: "archived",
          archivedAt: new Date(),
          archivedByUserId: actorObjectId(input.actor),
          updatedByUserId: actorObjectId(input.actor),
        },
      },
    ).exec(),
    TemplateVersionModel.updateOne(
      { _id: version._id },
      {
        $set: {
          status: "archived",
          archivedAt: new Date(),
          archivedByUserId: actorObjectId(input.actor),
        },
      },
    ).exec(),
  ]);

  await writeAuditLog({
    actor: input.actor,
    action: "template.archived",
    resourceType: "Template",
    resourceId: input.templateId,
    reason: input.reason ?? null,
    previousValues: { status: template.status, version: version.versionNumber },
    newValues: { status: "archived" },
  });
}

export async function restoreTemplate(input: { actor: Principal; templateId: string }) {
  await connectToDatabase();
  assertAnyTemplatePermission(input.actor, TEMPLATE_RESTORE_PERMISSIONS);

  const { template, version } = await loadTemplateAndCurrentVersion(input.templateId);
  assertTemplateStatusTransition(template.status ?? "archived", "draft");

  await Promise.all([
    TemplateModel.updateOne(
      { _id: template._id },
      {
        $set: {
          status: "draft",
          archivedAt: null,
          archivedByUserId: null,
          updatedByUserId: actorObjectId(input.actor),
        },
      },
    ).exec(),
    TemplateVersionModel.updateOne(
      { _id: version._id },
      {
        $set: {
          status: "draft",
          archivedAt: null,
          archivedByUserId: null,
        },
      },
    ).exec(),
  ]);

  await writeAuditLog({
    actor: input.actor,
    action: "template.restored",
    resourceType: "Template",
    resourceId: input.templateId,
    previousValues: { status: template.status },
    newValues: { status: "draft" },
  });
}

export async function generateTemplateUsage(input: {
  actor: Principal;
  templateId: string;
  clientName: string;
  engagementReference: string;
  generatedRecordType: string;
  generatedRecordId: string;
  variables?: Record<string, string>;
}) {
  await connectToDatabase();
  assertAnyTemplatePermission(input.actor, ["templates.read", "templates.view_usage", "templates.manage"]);

  const templateId = objectId(input.templateId);

  if (!templateId) {
    throw new Error("Template not found.");
  }

  const template = (await TemplateModel.findById(templateId).lean().exec()) as unknown as RawTemplate | null;

  if (!template || template.status !== "published" || !template.publishedVersionNumber) {
    throw new Error("Only published templates can generate records.");
  }

  const version = (await TemplateVersionModel.findOne({
    templateId,
    versionNumber: template.publishedVersionNumber,
    status: "published",
  })
    .lean()
    .exec()) as unknown as RawTemplateVersion | null;

  if (!version) {
    throw new Error("Published template version not found.");
  }

  const variableSnapshot = { ...TEMPLATE_SAMPLE_DATA, ...(input.variables ?? {}) };
  const renderedContent = renderTemplateContent(version.content, variableSnapshot);

  await TemplateUsageModel.create({
    templateId,
    versionId: version._id,
    templateVersion: version.versionNumber,
    templateCategory: template.category,
    clientName: input.clientName,
    engagementReference: input.engagementReference,
    generatedRecordType: input.generatedRecordType,
    generatedRecordId: input.generatedRecordId,
    renderedContent,
    variableSnapshot,
    usedByUserId: actorObjectId(input.actor),
    usedByName: input.actor.email,
  });

  await Promise.all([
    TemplateModel.updateOne(
      { _id: templateId },
      {
        $inc: {
          "usageSummary.totalUses": 1,
          "usageSummary.activeEngagements": 1,
          "usageSummary.generatedDocuments": input.generatedRecordType.includes("letter") ? 1 : 0,
          "usageSummary.generatedMessages": input.generatedRecordType.includes("message") ? 1 : 0,
          "usageSummary.generatedReports": input.generatedRecordType.includes("report") ? 1 : 0,
        },
        $set: { lastUsedAt: new Date() },
      },
    ).exec(),
    TemplateVersionModel.updateOne({ _id: version._id }, { $inc: { usageCount: 1 } }).exec(),
  ]);

  await writeAuditLog({
    actor: input.actor,
    action: "template.used",
    resourceType: "Template",
    resourceId: input.templateId,
    newValues: {
      version: version.versionNumber,
      generatedRecordType: input.generatedRecordType,
      generatedRecordId: input.generatedRecordId,
    },
  });

  return renderedContent;
}

async function loadTemplateAndCurrentVersion(templateId: string) {
  const id = objectId(templateId);

  if (!id) {
    throw new Error("Template not found.");
  }

  const template = (await TemplateModel.findById(id).lean().exec()) as unknown as RawTemplate | null;

  if (!template) {
    throw new Error("Template not found.");
  }

  const version = (await TemplateVersionModel.findOne({
    templateId: id,
    versionNumber: template.currentVersionNumber ?? 1,
  })
    .lean()
    .exec()) as unknown as RawTemplateVersion | null;

  if (!version) {
    throw new Error("Template version not found.");
  }

  return { template, version };
}

function buildStarterContent(category: TemplateCategory) {
  const meta = TEMPLATE_CATEGORY_META[category];
  const variables = meta.requiredVariables.map((variable) => `{{${variable}}}`).join(", ");
  const sections = meta.requiredSections.map((section) => `## ${section}\n${variables}`).join("\n\n");

  if (category === "email") {
    return `Subject\n${meta.shortLabel} update for {{clientName}}\n\nBody\nHello {{clientName}},\n\n${meta.description}\n\nAction\nOpen {{portalLink}}`;
  }

  if (category === "notification") {
    return `Title\n${meta.shortLabel} required\n\nMessage\n{{clientName}} has an update for {{engagementNumber}}.\n\nAction\nOpen {{portalLink}}`;
  }

  if (category === "ai_prompt") {
    return `## System instructions\nPrepare professional analysis for {{serviceName}}.\n\n## Required inputs\n{{scopeOfWork}}\n\n## Output structure\n1. Background\n2. Facts\n3. Issues\n4. Analysis\n5. Recommended action\n\n## Human review\nAll AI-generated output requires staff review before final use.`;
  }

  return `# ${meta.shortLabel} Template\n\n${sections}`;
}

function buildStarterSettings(category: TemplateCategory) {
  if (category === "invoice") {
    return {
      currency: "KES",
      taxInclusive: false,
      pdfPreview: true,
      paymentTerms: "14 days",
    };
  }

  if (category === "ai_prompt") {
    return {
      roleRestricted: true,
      humanReviewRequired: true,
      disclaimerRequired: true,
    };
  }

  return {
    requiredApproval: true,
    desktopPreview: true,
    mobilePreview: true,
  };
}
