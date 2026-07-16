import {
  TEMPLATE_SAMPLE_DATA,
  TEMPLATE_VARIABLES,
  type TemplateStatus,
} from "@/features/templates/types";

export type TemplateVariableInput = {
  key: string;
  label?: string;
  required?: boolean;
  description?: string;
  sampleValue?: string;
};

export type TemplateValidationInput = {
  content: string;
  variables: TemplateVariableInput[];
  requiredVariables: string[];
  allowedVariables?: string[];
  requiredSections?: string[];
};

export type TemplateValidationReport = {
  publishReady: boolean;
  usedVariables: string[];
  unknownVariables: string[];
  missingRequiredVariables: string[];
  duplicateVariableDefinitions: string[];
  duplicatePlaceholders: string[];
  invalidPlaceholders: string[];
  missingRequiredSections: string[];
  brokenLinks: string[];
  errors: string[];
  warnings: string[];
};

const PLACEHOLDER_PATTERN = /{{\s*([A-Za-z][A-Za-z0-9]*)\s*}}/g;
const BRACE_PATTERN = /{{([^}]*)}}/g;
const knownVariableKeys = new Set(TEMPLATE_VARIABLES.map((variable) => variable.key));

export const TEMPLATE_STATUS_TRANSITIONS: Record<TemplateStatus, TemplateStatus[]> = {
  draft: ["pending_review", "archived"],
  pending_review: ["draft", "published", "archived"],
  published: ["superseded", "archived"],
  superseded: ["archived"],
  archived: ["draft"],
};

export function canTransitionTemplateStatus(from: TemplateStatus, to: TemplateStatus) {
  return TEMPLATE_STATUS_TRANSITIONS[from].includes(to);
}

export function assertTemplateStatusTransition(from: TemplateStatus, to: TemplateStatus) {
  if (!canTransitionTemplateStatus(from, to)) {
    throw new Error(`Template status cannot move from ${from} to ${to}.`);
  }
}

export function isTemplateVersionEditable(status: TemplateStatus) {
  return status === "draft" || status === "pending_review";
}

export function assertTemplateVersionEditable(status: TemplateStatus) {
  if (!isTemplateVersionEditable(status)) {
    throw new Error("Published, superseded and archived template versions are immutable.");
  }
}

export function extractTemplateVariables(content: string) {
  const variables: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = PLACEHOLDER_PATTERN.exec(content)) !== null) {
    variables.push(match[1]);
  }

  return variables;
}

export function findInvalidPlaceholders(content: string) {
  const invalid: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = BRACE_PATTERN.exec(content)) !== null) {
    const raw = match[1].trim();

    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(raw)) {
      invalid.push(`{{${match[1]}}}`);
    }
  }

  return invalid;
}

export function renderTemplateContent(
  content: string,
  variableValues: Record<string, string> = TEMPLATE_SAMPLE_DATA,
) {
  return content.replace(PLACEHOLDER_PATTERN, (placeholder, key: string) => {
    const value = variableValues[key];
    return value ? value : `[Unresolved: ${placeholder}]`;
  });
}

export function validateTemplateForPublish(
  input: TemplateValidationInput,
): TemplateValidationReport {
  const allowedVariables = new Set(input.allowedVariables ?? [...knownVariableKeys]);
  const variableDefinitions = input.variables.map((variable) => variable.key);
  const definitionCounts = countBy(variableDefinitions);
  const usedVariables = extractTemplateVariables(input.content);
  const usedCounts = countBy(usedVariables);
  const usedVariableSet = new Set(usedVariables);
  const invalidPlaceholders = findInvalidPlaceholders(input.content);
  const unknownVariables = unique(
    usedVariables.filter((variable) => !allowedVariables.has(variable) || !knownVariableKeys.has(variable)),
  );
  const duplicateVariableDefinitions = Object.entries(definitionCounts)
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
  const duplicatePlaceholders = Object.entries(usedCounts)
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
  const missingRequiredVariables = input.requiredVariables.filter(
    (variable) => !usedVariableSet.has(variable) && !variableDefinitions.includes(variable),
  );
  const normalizedContent = input.content.toLowerCase();
  const missingRequiredSections = (input.requiredSections ?? []).filter(
    (section) => !normalizedContent.includes(section.toLowerCase()),
  );
  const brokenLinks = findBrokenLinks(input.content);
  const errors = [
    ...unknownVariables.map((variable) => `Unknown variable: ${variable}`),
    ...invalidPlaceholders.map((placeholder) => `Invalid placeholder format: ${placeholder}`),
    ...missingRequiredVariables.map((variable) => `Missing required variable: ${variable}`),
    ...duplicateVariableDefinitions.map((variable) => `Duplicate variable definition: ${variable}`),
    ...missingRequiredSections.map((section) => `Missing required section: ${section}`),
    ...brokenLinks.map((link) => `Broken link: ${link}`),
  ];
  const warnings = duplicatePlaceholders.map(
    (variable) => `Variable is used multiple times in content: ${variable}`,
  );

  return {
    publishReady: errors.length === 0,
    usedVariables: unique(usedVariables),
    unknownVariables,
    missingRequiredVariables,
    duplicateVariableDefinitions,
    duplicatePlaceholders,
    invalidPlaceholders,
    missingRequiredSections,
    brokenLinks,
    errors,
    warnings,
  };
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function findBrokenLinks(content: string) {
  const broken: string[] = [];

  if (content.includes("href=\"#\"")) {
    broken.push("#");
  }

  if (content.includes("https://example.com") || content.includes("http://example.com")) {
    broken.push("example.com");
  }

  return broken;
}
