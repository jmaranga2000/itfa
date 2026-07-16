import { AdminModulePage } from "@/components/dashboard/admin/admin-module-page";
import { adminModules } from "@/constants/dashboard-modules";

const pageModule = adminModules.audit;

export function AdminAudit() {
  return <AdminModulePage module={pageModule} />;
}
