import { createHash } from "node:crypto";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientCartModel } from "@/models/client-cart";
import { PricingPlanModel } from "@/models/pricing-plan";
import { ServiceCatalogModel } from "@/models/service-catalog";

export type CommerceIdentity = {
  clientUserId?: string | null;
  guestToken?: string | null;
};

export type ClientCartItemRecord = {
  serviceId: string;
  pricingPlanId: string | null;
  title: string;
  summary: string;
  inclusions: string[];
  priceLabel: string;
  cadence: string;
  quantity: number;
};

export type ClientCartRecord = {
  id: string | null;
  items: ClientCartItemRecord[];
  itemCount: number;
  empty: boolean;
};

type RawService = {
  _id: Types.ObjectId;
  title: string;
  summary: string;
  inclusions?: string[];
};

type RawPlan = {
  _id: Types.ObjectId;
  serviceId?: Types.ObjectId | null;
  name: string;
  priceLabel: string;
  cadence: string;
};

export function hashGuestCartToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function validUserId(value?: string | null) {
  return value && Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
}

async function findCart(identity: CommerceIdentity) {
  const clientUserId = validUserId(identity.clientUserId);
  const guestTokenHash = identity.guestToken ? hashGuestCartToken(identity.guestToken) : null;
  const clauses: Record<string, unknown>[] = [];
  if (clientUserId) clauses.push({ clientUserId });
  if (guestTokenHash) clauses.push({ guestTokenHash });
  if (clauses.length === 0) return null;

  return ClientCartModel.findOne({ status: "active", $or: clauses }).sort({ updatedAt: -1 }).exec();
}

async function getOrCreateCart(identity: CommerceIdentity) {
  const existing = await findCart(identity);
  if (existing) return existing;
  const clientUserId = validUserId(identity.clientUserId);
  const guestTokenHash = identity.guestToken ? hashGuestCartToken(identity.guestToken) : null;
  if (!clientUserId && !guestTokenHash) throw new Error("A cart owner is required.");

  return ClientCartModel.create({ clientUserId, guestTokenHash, items: [], status: "active" });
}

export async function mergeGuestCart(identity: CommerceIdentity) {
  await connectToDatabase();
  const clientUserId = validUserId(identity.clientUserId);
  const guestTokenHash = identity.guestToken ? hashGuestCartToken(identity.guestToken) : null;
  if (!clientUserId || !guestTokenHash) return findCart(identity);

  const [userCart, guestCart] = await Promise.all([
    ClientCartModel.findOne({ clientUserId, status: "active" }).exec(),
    ClientCartModel.findOne({ guestTokenHash, status: "active" }).exec(),
  ]);
  if (!guestCart) return userCart;

  const target = userCart ?? await ClientCartModel.create({ clientUserId, items: [], status: "active" });
  const existingServiceIds = new Set(target.items.map((item) => item.serviceId.toString()));
  for (const item of guestCart.items) {
    if (!existingServiceIds.has(item.serviceId.toString())) target.items.push(item);
  }
  await target.save();
  await ClientCartModel.updateOne({ _id: guestCart._id }, { $set: { status: "abandoned" } }).exec();
  return target;
}

export async function getClientCart(identity: CommerceIdentity): Promise<ClientCartRecord> {
  await connectToDatabase();
  const cart = identity.clientUserId && identity.guestToken
    ? await mergeGuestCart(identity)
    : await findCart(identity);
  if (!cart || cart.items.length === 0) return { id: cart?._id.toString() ?? null, items: [], itemCount: 0, empty: true };

  const serviceIds = cart.items.map((item) => item.serviceId);
  const planIds = cart.items.map((item) => item.pricingPlanId).filter(Boolean);
  const [services, plans] = await Promise.all([
    ServiceCatalogModel.find({ _id: { $in: serviceIds }, status: "published", archivedAt: null }).lean().exec(),
    PricingPlanModel.find({ _id: { $in: planIds }, status: "published", archivedAt: null }).lean().exec(),
  ]);
  const servicesById = new Map((services as RawService[]).map((service) => [service._id.toString(), service]));
  const plansById = new Map((plans as RawPlan[]).map((plan) => [plan._id.toString(), plan]));
  const items = cart.items.flatMap((item): ClientCartItemRecord[] => {
    const service = servicesById.get(item.serviceId.toString());
    if (!service) return [];
    const plan = item.pricingPlanId ? plansById.get(item.pricingPlanId.toString()) : null;
    return [{
      serviceId: service._id.toString(),
      pricingPlanId: plan?._id.toString() ?? null,
      title: service.title,
      summary: service.summary,
      inclusions: service.inclusions ?? [],
      priceLabel: plan?.priceLabel ?? "Quotation required",
      cadence: plan?.cadence ?? "Scoped engagement",
      quantity: item.quantity ?? 1,
    }];
  });

  return {
    id: cart._id.toString(),
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    empty: items.length === 0,
  };
}

export async function addServiceToCart(
  identity: CommerceIdentity,
  serviceId: string,
  pricingPlanId?: string | null,
) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(serviceId)) return false;
  const service = await ServiceCatalogModel.exists({ _id: serviceId, status: "published", archivedAt: null });
  if (!service) return false;
  const cart = await getOrCreateCart(identity);
  const existing = cart.items.find((item) => item.serviceId.toString() === serviceId);
  if (existing) {
    existing.quantity = Math.min(10, (existing.quantity ?? 1) + 1);
  } else {
    cart.items.push({
      serviceId: new Types.ObjectId(serviceId),
      pricingPlanId: pricingPlanId && Types.ObjectId.isValid(pricingPlanId) ? new Types.ObjectId(pricingPlanId) : null,
      quantity: 1,
      addedAt: new Date(),
    });
  }
  await cart.save();
  return true;
}

export async function updateCartItems(identity: CommerceIdentity, quantities: Record<string, number>) {
  await connectToDatabase();
  const cart = await getOrCreateCart(identity);
  for (let index = cart.items.length - 1; index >= 0; index -= 1) {
    const item = cart.items[index];
    const quantity = quantities[item.serviceId.toString()] ?? item.quantity ?? 1;
    if (quantity <= 0) {
      cart.items.splice(index, 1);
      continue;
    }
    item.quantity = Math.min(10, Math.max(1, quantity));
  }
  await cart.save();
}

export async function removeServiceFromCart(identity: CommerceIdentity, serviceId: string) {
  await connectToDatabase();
  const cart = await findCart(identity);
  if (!cart) return;
  for (let index = cart.items.length - 1; index >= 0; index -= 1) {
    if (cart.items[index].serviceId.toString() === serviceId) cart.items.splice(index, 1);
  }
  await cart.save();
}

export async function completeCart(identity: CommerceIdentity, requestId: string, status: "submitted" | "quotation_requested") {
  await connectToDatabase();
  const cart = await findCart(identity);
  if (!cart || !Types.ObjectId.isValid(requestId)) return;
  cart.status = status;
  cart.submittedRequestId = new Types.ObjectId(requestId);
  await cart.save();
}
