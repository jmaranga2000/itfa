import { ClientServices } from "@/components/dashboard/client/client-services";
import { requireUser } from "@/features/auth/server";
import { listPricingPlans, listServices } from "@/repositories/service-catalog-repository";

export default async function ClientServicesPage({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  await requireUser();
  const [query, services, plans] = await Promise.all([searchParams, listServices({ publishedOnly: true }), listPricingPlans({ publishedOnly: true })]);
  return <ClientServices added={query.added === "1"} plans={plans} services={services} />;
}
