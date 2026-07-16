import { AdminServiceCatalog } from "@/components/dashboard/admin/admin-service-catalog";
import { requirePermission } from "@/features/auth/server";
import { listServices } from "@/repositories/service-catalog-repository";

export default async function AdminServicesPage() {
  await requirePermission("services.read");
  const services = await listServices();

  return <AdminServiceCatalog services={services} />;
}
