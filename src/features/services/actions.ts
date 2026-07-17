"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/features/auth/server";
import {
  CATALOG_STATUSES,
  createPricingPlan,
  createService,
  updatePricingPlan,
  updateService,
  type CatalogStatus,
} from "@/repositories/service-catalog-repository";

const sharedSchema = z.object({
  slug: z.string().trim().max(80),
  status: z.enum(CATALOG_STATUSES),
  displayOrder: z.coerce.number().int().min(0).max(999),
});

const serviceSchema = sharedSchema.extend({
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(10).max(1200),
  inclusions: z.string().trim(),
  bestFor: z.string().trim().min(5).max(800),
  outcome: z.string().trim().min(5).max(800),
});

const pricingSchema = sharedSchema.extend({
  name: z.string().trim().min(2).max(160),
  priceLabel: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1200),
  cadence: z.string().trim().min(2).max(160),
  features: z.string().trim(),
  serviceId: z.string().trim(),
});

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function serviceInput(formData: FormData) {
  const parsed = serviceSchema.safeParse({
    slug: formData.get("slug") ?? "",
    title: formData.get("title"),
    summary: formData.get("summary"),
    inclusions: formData.get("inclusions") ?? "",
    bestFor: formData.get("bestFor"),
    outcome: formData.get("outcome"),
    status: formData.get("status"),
    displayOrder: formData.get("displayOrder") ?? 0,
  });
  if (!parsed.success) return null;
  return { ...parsed.data, inclusions: lines(parsed.data.inclusions) };
}

function pricingInput(formData: FormData) {
  const parsed = pricingSchema.safeParse({
    slug: formData.get("slug") ?? "",
    name: formData.get("name"),
    priceLabel: formData.get("priceLabel"),
    description: formData.get("description"),
    cadence: formData.get("cadence"),
    features: formData.get("features") ?? "",
    serviceId: formData.get("serviceId") ?? "",
    status: formData.get("status"),
    displayOrder: formData.get("displayOrder") ?? 0,
  });
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    features: lines(parsed.data.features),
    featured: formData.get("featured") === "on",
  };
}

function catalogStatus(value: string): CatalogStatus {
  return CATALOG_STATUSES.includes(value as CatalogStatus) ? (value as CatalogStatus) : "draft";
}

export async function createServiceAction(formData: FormData) {
  const actor = await requirePermission("services.manage");
  const input = serviceInput(formData);
  if (!input) redirect("/admin/services/new?error=invalid");
  const id = await createService({ ...input, status: "draft" }, actor);
  revalidatePath("/admin/services");
  revalidatePath("/services");
  redirect(`/admin/pricing/new?serviceId=${id}&fromService=1`);
}

export async function updateServiceAction(formData: FormData) {
  const actor = await requirePermission("services.manage");
  const serviceId = String(formData.get("serviceId") ?? "");
  const input = serviceInput(formData);
  if (!input) redirect(`/admin/services/${serviceId}?error=invalid`);
  const updated = await updateService(
    serviceId,
    { ...input, status: catalogStatus(input.status) },
    actor,
  );
  if (updated === "pricing_required") {
    redirect(`/admin/services/${serviceId}?error=pricing-required`);
  }
  if (!updated) redirect("/admin/services");
  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${serviceId}`);
  revalidatePath("/services");
  redirect(`/admin/services/${serviceId}?saved=1`);
}

export async function createPricingPlanAction(formData: FormData) {
  const actor = await requirePermission("services.manage");
  const input = pricingInput(formData);
  if (!input) redirect("/admin/pricing/new?error=invalid");
  const id = await createPricingPlan({ ...input, status: catalogStatus(input.status) }, actor);
  const returnToServiceId = String(formData.get("returnToServiceId") ?? "");
  revalidatePath("/admin/pricing");
  revalidatePath("/pricing");
  if (returnToServiceId && returnToServiceId === input.serviceId) {
    revalidatePath(`/admin/services/${returnToServiceId}`);
    redirect(`/admin/services/${returnToServiceId}?pricingCreated=1`);
  }
  redirect(`/admin/pricing/${id}?created=1`);
}

export async function updatePricingPlanAction(formData: FormData) {
  const actor = await requirePermission("services.manage");
  const planId = String(formData.get("planId") ?? "");
  const input = pricingInput(formData);
  if (!input) redirect(`/admin/pricing/${planId}?error=invalid`);
  const updated = await updatePricingPlan(
    planId,
    { ...input, status: catalogStatus(input.status) },
    actor,
  );
  if (!updated) redirect("/admin/pricing");
  revalidatePath("/admin/pricing");
  revalidatePath(`/admin/pricing/${planId}`);
  revalidatePath("/pricing");
  redirect(`/admin/pricing/${planId}?saved=1`);
}
