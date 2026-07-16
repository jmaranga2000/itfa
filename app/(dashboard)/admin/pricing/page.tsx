import { AdminPricingCatalog } from "@/components/dashboard/admin/admin-pricing-catalog";
import { requirePermission } from "@/features/auth/server";
import { listPricingPlans } from "@/repositories/service-catalog-repository";

export default async function AdminPricingPage() {
  await requirePermission("services.read");
  const plans = await listPricingPlans();

  return <AdminPricingCatalog plans={plans} />;
}
