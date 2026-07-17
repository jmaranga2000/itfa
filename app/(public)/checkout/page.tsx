import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server";

export default async function PublicCheckoutPage() {
  const principal = await getCurrentUser();
  redirect(principal ? "/client/checkout" : "/sign-up?next=/client/checkout");
}
