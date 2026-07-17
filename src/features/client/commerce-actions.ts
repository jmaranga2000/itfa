"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, requireUser } from "@/features/auth/server";
import {
  addServiceToCart,
  removeServiceFromCart,
  updateCartItems,
  type CommerceIdentity,
} from "@/repositories/client-commerce-repository";
import { createEngagementRequestFromCart } from "@/repositories/engagement-request-repository";
import { acceptQuotationForClientByRequest } from "@/repositories/quotation-repository";

const GUEST_CART_COOKIE = "ifta_guest_cart";

function safeReturnPath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value ?? "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

async function cartIdentity(createGuest = false): Promise<CommerceIdentity> {
  const [principal, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  let guestToken = cookieStore.get(GUEST_CART_COOKIE)?.value ?? null;
  if (!principal && !guestToken && createGuest) {
    guestToken = randomBytes(32).toString("base64url");
    cookieStore.set(GUEST_CART_COOKIE, guestToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return { clientUserId: principal?.id ?? null, guestToken };
}

function revalidateCommerce() {
  revalidatePath("/services");
  revalidatePath("/cart");
  revalidatePath("/client", "layout");
  revalidatePath("/client/services");
  revalidatePath("/client/cart");
  revalidatePath("/client/checkout");
  revalidatePath("/client/engagements");
  revalidatePath("/admin/requests");
}

export async function addServiceToCartAction(formData: FormData) {
  const identity = await cartIdentity(true);
  const serviceId = String(formData.get("serviceId") ?? "");
  const pricingPlanId = String(formData.get("pricingPlanId") ?? "") || null;
  const returnPath = safeReturnPath(formData.get("returnPath"), "/services");
  const added = await addServiceToCart(identity, serviceId, pricingPlanId);
  revalidateCommerce();
  redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}${added ? "added=1" : "error=service"}`);
}

export async function updateCartAction(formData: FormData) {
  const identity = await cartIdentity();
  const quantities: Record<string, number> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("quantity:")) continue;
    quantities[key.slice("quantity:".length)] = Number(value);
  }
  await updateCartItems(identity, quantities);
  revalidateCommerce();
  redirect(safeReturnPath(formData.get("returnPath"), "/client/cart") + "?updated=1");
}

export async function removeCartItemAction(formData: FormData) {
  const identity = await cartIdentity();
  await removeServiceFromCart(identity, String(formData.get("serviceId") ?? ""));
  revalidateCommerce();
  redirect(safeReturnPath(formData.get("returnPath"), "/client/cart") + "?removed=1");
}

export async function requestQuotationAction(formData: FormData) {
  const principal = await getCurrentUser();
  if (!principal) redirect("/sign-up?next=/client/cart");
  const identity = await cartIdentity();
  const requestId = await createEngagementRequestFromCart({
    principal,
    identity,
    requestType: "quotation",
    clientNotes: String(formData.get("clientNotes") ?? ""),
    expectedOutcome: String(formData.get("expectedOutcome") ?? ""),
  });
  revalidateCommerce();
  redirect(`/client/quotations/request/${requestId}`);
}

export async function submitCheckoutAction(formData: FormData) {
  const principal = await requireUser();
  const identity = await cartIdentity();
  const requestId = await createEngagementRequestFromCart({
    principal,
    identity,
    requestType: "checkout",
    clientNotes: String(formData.get("clientNotes") ?? "").slice(0, 2000),
    expectedOutcome: String(formData.get("expectedOutcome") ?? "").slice(0, 1000),
  });
  revalidateCommerce();
  redirect(`/client/engagements?submitted=${requestId}`);
}

export async function acceptQuotationAction(formData: FormData) {
  const principal = await requireUser();
  const requestId = String(formData.get("requestId") ?? "");
  const accepted = await acceptQuotationForClientByRequest(requestId, principal);
  revalidatePath("/client/engagements");
  revalidatePath("/admin/requests");
  const quotationId = String(formData.get("quotationId") ?? "");
  redirect(accepted && quotationId ? `/client/quotations/${quotationId}?accepted=1` : `/client/engagements?${accepted ? "accepted=1" : "error=quotation"}`);
}
