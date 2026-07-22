"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyPermission } from "@/features/auth/server";
import {
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
} from "@/features/templates/types";
import {
  archiveTemplate,
  createNewTemplateVersion,
  createTemplateDraft,
  duplicateTemplate,
  publishTemplateVersion,
  restoreTemplate,
  submitTemplateForReview,
} from "@/repositories/template-repository";

function parseCategory(value: FormDataEntryValue | null): TemplateCategory {
  const category = String(value ?? "engagement_letter");

  if (TEMPLATE_CATEGORIES.includes(category as TemplateCategory)) {
    return category as TemplateCategory;
  }

  return "engagement_letter";
}

function pathForTemplate(templateId: string) {
  return `/admin/templates/${templateId}`;
}

export async function createTemplateDraftAction(formData: FormData) {
  const actor = await requireAnyPermission(["templates.create", "templates.manage", "permissions.manage"]);
  const category = parseCategory(formData.get("category"));
  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");
  const service = String(formData.get("service") ?? "");
  const clientType = String(formData.get("clientType") ?? "");
  const templateId = await createTemplateDraft({
    actor,
    category,
    name,
    description,
    applicableServices: service ? [service] : undefined,
    applicableClientTypes: clientType ? [clientType] : undefined,
  });

  revalidatePath("/admin/templates");
  redirect(pathForTemplate(templateId));
}

export async function duplicateTemplateAction(formData: FormData) {
  const actor = await requireAnyPermission(["templates.create", "templates.manage", "permissions.manage"]);
  const templateId = String(formData.get("templateId") ?? "");
  const duplicateId = await duplicateTemplate({ actor, templateId });

  revalidatePath("/admin/templates");
  redirect(pathForTemplate(duplicateId));
}

export async function createNewTemplateVersionAction(formData: FormData) {
  const actor = await requireAnyPermission(["templates.edit_draft", "templates.manage", "permissions.manage"]);
  const templateId = String(formData.get("templateId") ?? "");

  await createNewTemplateVersion({ actor, templateId });
  revalidatePath("/admin/templates");
  revalidatePath(pathForTemplate(templateId));
}

export async function submitTemplateForReviewAction(formData: FormData) {
  const actor = await requireAnyPermission(["templates.submit_review", "templates.manage", "permissions.manage"]);
  const templateId = String(formData.get("templateId") ?? "");

  await submitTemplateForReview({ actor, templateId });
  revalidatePath("/admin/templates");
  revalidatePath(pathForTemplate(templateId));
}

export async function publishTemplateVersionAction(formData: FormData) {
  const actor = await requireAnyPermission(["templates.publish", "templates.manage", "permissions.manage"]);
  const templateId = String(formData.get("templateId") ?? "");

  await publishTemplateVersion({ actor, templateId });
  revalidatePath("/admin/templates");
  revalidatePath(pathForTemplate(templateId));
}

export async function archiveTemplateAction(formData: FormData) {
  const actor = await requireAnyPermission(["templates.archive", "templates.manage", "permissions.manage"]);
  const templateId = String(formData.get("templateId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  await archiveTemplate({ actor, templateId, reason });
  revalidatePath("/admin/templates");
  revalidatePath(pathForTemplate(templateId));
}

export async function restoreTemplateAction(formData: FormData) {
  const actor = await requireAnyPermission(["templates.restore", "templates.manage", "permissions.manage"]);
  const templateId = String(formData.get("templateId") ?? "");

  await restoreTemplate({ actor, templateId });
  revalidatePath("/admin/templates");
  revalidatePath(pathForTemplate(templateId));
}
