"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/features/audit/audit-service";
import { requirePermission } from "@/features/auth/server";
import { isIntegrationKey } from "@/features/integrations/catalog";
import { getIntegrationConnection, setIntegrationEnabled, testIntegrationConnection } from "@/repositories/integration-repository";

export async function toggleIntegrationAction(formData: FormData) {
  const actor = await requirePermission("settings.manage");
  const key = String(formData.get("connectionKey") ?? "");
  if (!isIntegrationKey(key)) redirect("/admin/integrations");
  const previous = await getIntegrationConnection(key);
  if (!previous) redirect("/admin/integrations");
  const enabled = formData.get("enabled") === "true";
  await setIntegrationEnabled(key, enabled);
  await writeAuditLog({
    actor,
    action: enabled ? "integration.enabled" : "integration.disabled",
    resourceType: "IntegrationConnection",
    resourceId: key,
    previousValues: { enabled: previous.enabled, status: previous.status },
    newValues: { enabled },
  });
  revalidatePath("/admin/integrations");
  revalidatePath(`/admin/integrations/${key}`);
  redirect(`/admin/integrations/${key}?updated=1`);
}

export async function testIntegrationAction(formData: FormData) {
  const actor = await requirePermission("settings.manage");
  const key = String(formData.get("connectionKey") ?? "");
  if (!isIntegrationKey(key)) redirect("/admin/integrations");
  const result = await testIntegrationConnection(key, actor.id);
  await writeAuditLog({
    actor,
    action: result.success ? "integration.test_passed" : "integration.test_failed",
    resourceType: "IntegrationConnection",
    resourceId: key,
    newValues: { success: result.success, message: result.message },
  });
  revalidatePath("/admin/integrations");
  revalidatePath(`/admin/integrations/${key}`);
  redirect(`/admin/integrations/${key}?test=${result.success ? "passed" : "failed"}&message=${encodeURIComponent(result.message)}`);
}
