"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/features/audit/audit-service";
import { requirePermission } from "@/features/auth/server";
import { getPlatformSettings, updatePlatformSettingsSection } from "@/repositories/platform-settings-repository";

const optionalEmail = z.union([z.string().trim().email(), z.literal("")]);
const optionalUrl = z.union([z.string().trim().url(), z.literal("")]);

const companySchema = z.object({
  tradingName: z.string().trim().min(2).max(120),
  legalName: z.string().trim().min(2).max(160),
  registrationNumber: z.string().trim().max(80),
  kraPin: z.string().trim().max(40),
  email: optionalEmail,
  phone: z.string().trim().max(40),
  website: optionalUrl,
  address: z.string().trim().max(300),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
});

const engagementSchema = z.object({
  autoGenerateLetters: z.boolean(),
  requireInternalSignature: z.boolean(),
  allowTypedSignatures: z.boolean(),
  requireDeliverableApproval: z.boolean(),
  defaultCurrency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  paymentTerms: z.string().trim().min(10).max(1000),
  governingLaw: z.string().trim().min(3).max(200),
  disputeResolution: z.string().trim().min(10).max(1000),
  signatoryName: z.string().trim().min(2).max(120),
  signatoryTitle: z.string().trim().min(2).max(120),
  letterValidityDays: z.coerce.number().int().min(1).max(90),
  signatureReminderDays: z.coerce.number().int().min(1).max(30),
});

const portalSchema = z.object({
  timezone: z.string().trim().min(3).max(80),
  supportEmail: optionalEmail,
  clientWelcomeMessage: z.string().trim().min(5).max(500),
  notifyClientOnLetterReady: z.boolean(),
  notifyAdminOnClientSignature: z.boolean(),
});

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function updatePlatformSettingsAction(formData: FormData) {
  const actor = await requirePermission("settings.manage");
  const section = String(formData.get("section") ?? "");
  const previous = await getPlatformSettings();
  let parsed;
  if (section === "company") {
    parsed = companySchema.safeParse(Object.fromEntries(formData));
  } else if (section === "engagement") {
    parsed = engagementSchema.safeParse({
      ...Object.fromEntries(formData),
      autoGenerateLetters: checked(formData, "autoGenerateLetters"),
      requireInternalSignature: checked(formData, "requireInternalSignature"),
      allowTypedSignatures: checked(formData, "allowTypedSignatures"),
      requireDeliverableApproval: checked(formData, "requireDeliverableApproval"),
    });
  } else if (section === "portal") {
    parsed = portalSchema.safeParse({
      ...Object.fromEntries(formData),
      notifyClientOnLetterReady: checked(formData, "notifyClientOnLetterReady"),
      notifyAdminOnClientSignature: checked(formData, "notifyAdminOnClientSignature"),
    });
  } else {
    redirect("/admin/settings?error=section");
  }

  if (!parsed.success) redirect(`/admin/settings?error=invalid&section=${section}`);
  await updatePlatformSettingsSection({
    section,
    values: parsed.data,
    actorUserId: actor.id,
  });
  await writeAuditLog({
    actor,
    action: "settings.updated",
    resourceType: "PlatformSettings",
    resourceId: section,
    previousValues: previous[section],
    newValues: parsed.data,
  });
  revalidatePath("/admin/settings");
  redirect(`/admin/settings?saved=${section}`);
}
