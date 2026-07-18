import { cookies } from "next/headers";
import { ClientServices } from "@/components/dashboard/client/client-services";
import { requireUser } from "@/features/auth/server";
import { getClientCart } from "@/repositories/client-commerce-repository";
import { listPricingPlans, listServices } from "@/repositories/service-catalog-repository";

export default async function ClientServicesPage({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  const [principal, cookieStore, query, services, plans] = await Promise.all([
    requireUser(),
    cookies(),
    searchParams,
    listServices({ publishedOnly: true }),
    listPricingPlans({ publishedOnly: true }),
  ]);
  const cart = await getClientCart({
    clientUserId: principal.id,
    guestToken: cookieStore.get("ifta_guest_cart")?.value,
  });
  return <ClientServices added={query.added === "1"} cartCount={cart.itemCount} plans={plans} services={services} />;
}
