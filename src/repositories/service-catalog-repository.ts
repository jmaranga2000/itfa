import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { assertPermission } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { connectToDatabase } from "@/lib/db/mongoose";
import { pricingOptions, services } from "@/content/public-site";
import { PricingPlanModel } from "@/models/pricing-plan";
import { ServiceCatalogModel } from "@/models/service-catalog";

export const CATALOG_STATUSES = ["draft", "published", "archived"] as const;
export type CatalogStatus = (typeof CATALOG_STATUSES)[number];

export type ServiceCatalogRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  imageAlt: string;
  hasImage: boolean;
  inclusions: string[];
  bestFor: string;
  outcome: string;
  status: CatalogStatus;
  displayOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PricingPlanRecord = {
  id: string;
  slug: string;
  name: string;
  priceLabel: string;
  description: string;
  cadence: string;
  features: string[];
  serviceId: string | null;
  serviceTitle: string | null;
  featured: boolean;
  status: CatalogStatus;
  displayOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ServiceCatalogInput = Pick<
  ServiceCatalogRecord,
  "slug" | "title" | "summary" | "imageAlt" | "inclusions" | "bestFor" | "outcome" | "status" | "displayOrder"
>;

export type ServiceImageInput = {
  storageKey: string;
  contentType: string;
  size: number;
  originalName: string;
};

export type PricingPlanInput = Pick<
  PricingPlanRecord,
  "slug" | "name" | "priceLabel" | "description" | "cadence" | "features" | "serviceId" | "featured" | "status" | "displayOrder"
>;

type RawService = {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  summary: string;
  imageStorageKey?: string;
  imageContentType?: string;
  imageSize?: number;
  imageOriginalName?: string;
  imageAlt?: string;
  inclusions?: string[];
  bestFor: string;
  outcome: string;
  status: CatalogStatus;
  displayOrder?: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

type RawPricingPlan = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  priceLabel: string;
  description: string;
  cadence: string;
  features?: string[];
  serviceId?: Types.ObjectId | null;
  featured?: boolean;
  status: CatalogStatus;
  displayOrder?: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

function iso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function mapService(service: RawService): ServiceCatalogRecord {
  return {
    id: service._id.toString(),
    slug: service.slug,
    title: service.title,
    summary: service.summary,
    imageUrl: service.imageStorageKey ? `/api/services/${service._id.toString()}/image` : null,
    imageAlt: service.imageAlt?.trim() || `${service.title} consulting service`,
    hasImage: Boolean(service.imageStorageKey),
    inclusions: service.inclusions ?? [],
    bestFor: service.bestFor,
    outcome: service.outcome,
    status: service.status,
    displayOrder: service.displayOrder ?? 0,
    createdAt: iso(service.createdAt),
    updatedAt: iso(service.updatedAt),
  };
}

function mapPricingPlan(
  plan: RawPricingPlan,
  serviceTitles: Map<string, string>,
): PricingPlanRecord {
  const serviceId = plan.serviceId?.toString() ?? null;

  return {
    id: plan._id.toString(),
    slug: plan.slug,
    name: plan.name,
    priceLabel: plan.priceLabel,
    description: plan.description,
    cadence: plan.cadence,
    features: plan.features ?? [],
    serviceId,
    serviceTitle: serviceId ? serviceTitles.get(serviceId) ?? null : null,
    featured: plan.featured ?? false,
    status: plan.status,
    displayOrder: plan.displayOrder ?? 0,
    createdAt: iso(plan.createdAt),
    updatedAt: iso(plan.updatedAt),
  };
}

async function uniqueSlug(
  exists: (filter: {
    slug: string;
    _id?: { $ne: Types.ObjectId };
  }) => Promise<unknown>,
  requestedSlug: string,
  fallback: string,
  excludeId?: string,
) {
  const base = normalizeSlug(requestedSlug || fallback) || "catalog-item";
  let candidate = base;
  let suffix = 2;

  while (
    await exists({
      slug: candidate,
      ...(excludeId && Types.ObjectId.isValid(excludeId)
        ? { _id: { $ne: new Types.ObjectId(excludeId) } }
        : {}),
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function seedServiceAndPricingCatalog() {
  await connectToDatabase();
  const [serviceCount, pricingCount] = await Promise.all([
    ServiceCatalogModel.estimatedDocumentCount().exec(),
    PricingPlanModel.estimatedDocumentCount().exec(),
  ]);

  if (serviceCount === 0) {
    await ServiceCatalogModel.bulkWrite(
      services.map((service, index) => ({
        updateOne: {
          filter: { slug: service.id },
          update: {
            $set: {
              title: service.title,
              summary: service.summary,
              imageAlt: `${service.title} consulting service`,
              inclusions: [...service.inclusions],
              bestFor: service.bestFor,
              outcome: service.outcome,
              status: "published",
              displayOrder: index + 1,
              archivedAt: null,
            },
          },
          upsert: true,
        },
      })),
    );
  }

  if (pricingCount === 0) {
    await PricingPlanModel.bulkWrite(
      pricingOptions.map((option, index) => ({
        updateOne: {
          filter: { slug: normalizeSlug(option.name) },
          update: {
            $set: {
              name: option.name,
              priceLabel: option.price,
              description: option.description,
              cadence: option.cadence,
              features: [...option.features],
              featured: option.featured,
              status: "published",
              displayOrder: index + 1,
              archivedAt: null,
            },
          },
          upsert: true,
        },
      })),
    );
  }

  const [seededServices, seededPricingPlans] = await Promise.all([
    ServiceCatalogModel.estimatedDocumentCount().exec(),
    PricingPlanModel.estimatedDocumentCount().exec(),
  ]);

  return {
    services: seededServices,
    pricingPlans: seededPricingPlans,
  };
}

export async function listServices(options: { publishedOnly?: boolean } = {}) {
  await seedServiceAndPricingCatalog();
  const services = (await ServiceCatalogModel.find(
    options.publishedOnly ? { status: "published", archivedAt: null } : {},
  )
    .sort({ displayOrder: 1, title: 1 })
    .lean()
    .exec()) as RawService[];

  return services.map(mapService);
}

export async function getService(serviceId: string) {
  await seedServiceAndPricingCatalog();
  if (!Types.ObjectId.isValid(serviceId)) return null;
  const service = (await ServiceCatalogModel.findById(serviceId).lean().exec()) as RawService | null;
  return service ? mapService(service) : null;
}

export async function listPricingPlans(options: { publishedOnly?: boolean } = {}) {
  await seedServiceAndPricingCatalog();
  const [plans, services] = await Promise.all([
    PricingPlanModel.find(
      options.publishedOnly ? { status: "published", archivedAt: null } : {},
    )
      .sort({ displayOrder: 1, name: 1 })
      .lean()
      .exec() as Promise<RawPricingPlan[]>,
    ServiceCatalogModel.find({}).select("title").lean().exec() as Promise<
      Array<{ _id: Types.ObjectId; title: string }>
    >,
  ]);
  const serviceTitles = new Map(services.map((service) => [service._id.toString(), service.title]));
  return plans.map((plan) => mapPricingPlan(plan, serviceTitles));
}

export async function getPricingPlan(planId: string) {
  await seedServiceAndPricingCatalog();
  if (!Types.ObjectId.isValid(planId)) return null;
  const plan = (await PricingPlanModel.findById(planId).lean().exec()) as RawPricingPlan | null;
  if (!plan) return null;
  const service = plan.serviceId
    ? await ServiceCatalogModel.findById(plan.serviceId).select("title").lean().exec()
    : null;
  const serviceTitles = new Map<string, string>();
  if (service) serviceTitles.set(plan.serviceId!.toString(), String(service.title));
  return mapPricingPlan(plan, serviceTitles);
}

export async function createService(input: ServiceCatalogInput, actor: Principal, image?: ServiceImageInput | null) {
  assertPermission(actor, "services.manage");
  await connectToDatabase();
  const slug = await uniqueSlug(
    (filter) => ServiceCatalogModel.exists(filter).exec(),
    input.slug,
    input.title,
  );
  const service = await ServiceCatalogModel.create({
    ...input,
    slug,
    status: "draft",
    imageStorageKey: image?.storageKey ?? "",
    imageContentType: image?.contentType ?? "",
    imageSize: image?.size ?? 0,
    imageOriginalName: image?.originalName ?? "",
    imageAlt: input.imageAlt.trim() || `${input.title} consulting service`,
    createdByUserId: actor.id,
    updatedByUserId: actor.id,
    archivedAt: null,
  });
  await writeAuditLog({
    actor,
    action: "service.created",
    resourceType: "Service",
    resourceId: service._id.toString(),
    newValues: { ...input, status: "draft" },
  });
  return service._id.toString();
}

export async function updateService(serviceId: string, input: ServiceCatalogInput, actor: Principal, image?: ServiceImageInput | null) {
  assertPermission(actor, "services.manage");
  if (!Types.ObjectId.isValid(serviceId)) return false;
  await connectToDatabase();
  const previous = await ServiceCatalogModel.findById(serviceId).lean().exec();
  if (!previous) return false;
  if (input.status === "published") {
    const publishedPrice = await PricingPlanModel.exists({
      serviceId: new Types.ObjectId(serviceId),
      status: "published",
      archivedAt: null,
    }).exec();
    if (!publishedPrice) return "pricing_required" as const;
  }
  const slug = await uniqueSlug(
    (filter) => ServiceCatalogModel.exists(filter).exec(),
    input.slug,
    input.title,
    serviceId,
  );
  await ServiceCatalogModel.updateOne(
    { _id: serviceId },
    {
      $set: {
        ...input,
        slug,
        imageAlt: input.imageAlt.trim() || `${input.title} consulting service`,
        ...(image ? {
          imageStorageKey: image.storageKey,
          imageContentType: image.contentType,
          imageSize: image.size,
          imageOriginalName: image.originalName,
        } : {}),
        updatedByUserId: actor.id,
        archivedAt: input.status === "archived" ? previous.archivedAt ?? new Date() : null,
      },
    },
  ).exec();
  await writeAuditLog({
    actor,
    action: "service.updated",
    resourceType: "Service",
    resourceId: serviceId,
    previousValues: previous,
    newValues: input,
  });
  return { updated: true as const, previousImageStorageKey: previous.imageStorageKey ?? null };
}

export async function createPricingPlan(input: PricingPlanInput, actor: Principal) {
  assertPermission(actor, "services.manage");
  await connectToDatabase();
  const slug = await uniqueSlug(
    (filter) => PricingPlanModel.exists(filter).exec(),
    input.slug,
    input.name,
  );
  const plan = await PricingPlanModel.create({
    ...input,
    slug,
    serviceId: input.serviceId && Types.ObjectId.isValid(input.serviceId) ? input.serviceId : null,
    createdByUserId: actor.id,
    updatedByUserId: actor.id,
    archivedAt: input.status === "archived" ? new Date() : null,
  });
  await writeAuditLog({
    actor,
    action: "pricing.created",
    resourceType: "PricingPlan",
    resourceId: plan._id.toString(),
    newValues: input,
  });
  return plan._id.toString();
}

export async function updatePricingPlan(planId: string, input: PricingPlanInput, actor: Principal) {
  assertPermission(actor, "services.manage");
  if (!Types.ObjectId.isValid(planId)) return false;
  await connectToDatabase();
  const previous = await PricingPlanModel.findById(planId).lean().exec();
  if (!previous) return false;
  const slug = await uniqueSlug(
    (filter) => PricingPlanModel.exists(filter).exec(),
    input.slug,
    input.name,
    planId,
  );
  await PricingPlanModel.updateOne(
    { _id: planId },
    {
      $set: {
        ...input,
        slug,
        serviceId: input.serviceId && Types.ObjectId.isValid(input.serviceId) ? input.serviceId : null,
        updatedByUserId: actor.id,
        archivedAt: input.status === "archived" ? previous.archivedAt ?? new Date() : null,
      },
    },
  ).exec();
  await writeAuditLog({
    actor,
    action: "pricing.updated",
    resourceType: "PricingPlan",
    resourceId: planId,
    previousValues: previous,
    newValues: input,
  });
  return true;
}
