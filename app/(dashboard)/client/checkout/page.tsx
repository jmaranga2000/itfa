import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClientCheckout } from "@/components/dashboard/client/client-checkout";
import { requireUser } from "@/features/auth/server";
import { getClientCart } from "@/repositories/client-commerce-repository";

export default async function ClientCheckoutPage() {
  const [principal, cookieStore] = await Promise.all([requireUser(), cookies()]);
  const cart = await getClientCart({ clientUserId: principal.id, guestToken: cookieStore.get("ifta_guest_cart")?.value });
  if (cart.empty) redirect("/client/cart");
  return <ClientCheckout cart={cart} />;
}
