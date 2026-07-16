import { AdminModulePage } from "@/components/dashboard/admin/admin-module-page";
import { adminModules } from "@/constants/dashboard-modules";

const pageModule = adminModules.invoices;

export function AdminInvoices() {
  return <AdminModulePage module={pageModule} />;
}
