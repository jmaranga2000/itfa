import { AdminModulePage } from "@/components/dashboard/admin/admin-module-page";
import { adminModules } from "@/constants/dashboard-modules";

const pageModule = adminModules.services;

export function AdminServices() {
  return <AdminModulePage module={pageModule} />;
}
