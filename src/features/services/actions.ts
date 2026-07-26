"use server";

import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/features/auth/server";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import {
  CATALOG_STATUSES,
  createPricingPlan,
  createService,
  updatePricingPlan,
  updateService,
  type CatalogStatus,
  type ServiceImageInput,
} from "@/repositories/service-catalog-repository";

const sharedSchema = z.object({
  slug: z.string().trim().max(80),
  status: z.enum(CATALOG_STATUSES),
  displayOrder: z.coerce.number().int().min(0).max(999),
});

const serviceSchema = sharedSchema.extend({
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(10).max(1200),
  imageAlt: z.string().trim().max(180),
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
    imageAlt: formData.get("imageAlt") ?? "",
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

const MAX_SERVICE_IMAGE_SIZE = 8 * 1024 * 1024;
const serviceImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type ServiceImageSelection =
  | { ok: true; file: File | null }
  | { ok: false; reason: "image-size" | "image-type" };

function selectedServiceImage(formData: FormData): ServiceImageSelection {
  const value = formData.get("serviceImage");
  if (!(value instanceof File) || value.size === 0) return { ok: true, file: null };
  if (value.size > MAX_SERVICE_IMAGE_SIZE) return { ok: false, reason: "image-size" };
  if (!serviceImageTypes.has(value.type)) return { ok: false, reason: "image-type" };
  return { ok: true, file: value };
}

async function uploadServiceImage(file: File): Promise<ServiceImageInput> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "service-image";
  const storageKey = `service-images/${randomUUID()}-${cleanName}`;
  const configuration = getR2Configuration();
  await getR2Client().send(new PutObjectCommand({
    Bucket: configuration.bucketName,
    Key: storageKey,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
    ContentDisposition: `inline; filename="${cleanName}"`,
  }));
  return { storageKey, contentType: file.type, size: file.size, originalName: cleanName };
}

async function deleteServiceImage(storageKey?: string | null) {
  if (!storageKey) return;
  const configuration = getR2Configuration();
  await getR2Client().send(new DeleteObjectCommand({
    Bucket: configuration.bucketName,
    Key: storageKey,
  })).catch(() => undefined);
}

function refreshServiceCatalog(serviceId?: string) {
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/client/services");
  revalidatePath("/admin/services");
  if (serviceId) revalidatePath(`/admin/services/${serviceId}`);
}

function catalogStatus(value: string): CatalogStatus {
  return CATALOG_STATUSES.includes(value as CatalogStatus) ? (value as CatalogStatus) : "draft";
}

export async function createServiceAction(formData: FormData) {
  const actor = await requirePermission("services.manage");
  const input = serviceInput(formData);
  if (!input) redirect("/admin/services/new?error=invalid");
  const selection = selectedServiceImage(formData);
  if (!selection.ok) redirect(`/admin/services/new?error=${selection.reason}`);

  let image: ServiceImageInput | null = null;
  if (selection.file) {
    try {
      image = await uploadServiceImage(selection.file);
    } catch (error) {
      console.error("Unable to upload service image.", error);
      redirect("/admin/services/new?error=image-upload");
    }
  }

  let id: string;
  try {
    id = await createService({ ...input, imageAlt: input.imageAlt || `${input.title} consulting service`, status: "draft" }, actor, image);
  } catch (error) {
    await deleteServiceImage(image?.storageKey);
    console.error("Unable to create service.", error);
    redirect("/admin/services/new?error=save");
  }
  refreshServiceCatalog(id);
  redirect(`/admin/pricing/new?serviceId=${id}&fromService=1`);
}

export async function updateServiceAction(formData: FormData) {
  const actor = await requirePermission("services.manage");
  const serviceId = String(formData.get("serviceId") ?? "");
  const input = serviceInput(formData);
  if (!input) redirect(`/admin/services/${serviceId}?error=invalid`);
  const selection = selectedServiceImage(formData);
  if (!selection.ok) redirect(`/admin/services/${serviceId}?error=${selection.reason}`);

  let image: ServiceImageInput | null = null;
  if (selection.file) {
    try {
      image = await uploadServiceImage(selection.file);
    } catch (error) {
      console.error("Unable to upload service image.", error);
      redirect(`/admin/services/${serviceId}?error=image-upload`);
    }
  }

  let updated: Awaited<ReturnType<typeof updateService>>;
  try {
    updated = await updateService(
      serviceId,
      { ...input, imageAlt: input.imageAlt || `${input.title} consulting service`, status: catalogStatus(input.status) },
      actor,
      image,
    );
  } catch (error) {
    await deleteServiceImage(image?.storageKey);
    console.error("Unable to update service.", error);
    redirect(`/admin/services/${serviceId}?error=save`);
  }
  if (updated === "pricing_required") {
    await deleteServiceImage(image?.storageKey);
    redirect(`/admin/services/${serviceId}?error=pricing-required`);
  }
  if (!updated) {
    await deleteServiceImage(image?.storageKey);
    redirect("/admin/services");
  }
  if (image && updated.previousImageStorageKey !== image.storageKey) {
    await deleteServiceImage(updated.previousImageStorageKey);
  }
  refreshServiceCatalog(serviceId);
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
