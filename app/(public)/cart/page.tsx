import { cookies } from "next/headers";
import { ClientCart } from "@/components/dashboard/client/client-cart";
import { getCurrentUser } from "@/features/auth/server";
import { getClientCart } from "@/repositories/client-commerce-repository";

export default async function PublicCartPage() {
  const [principal, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  const cart = await getClientCart({ clientUserId: principal?.id, guestToken: cookieStore.get("ifta_guest_cart")?.value });
  return <main className="mx-auto max-w-7xl px-5 py-10"><ClientCart cart={cart} checkoutHref={principal ? "/client/checkout" : "/checkout"} returnPath="/cart" /></main>;
}
