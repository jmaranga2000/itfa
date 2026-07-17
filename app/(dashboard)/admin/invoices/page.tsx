import { AdminInvoicesRegister } from "@/components/dashboard/admin/admin-record-registers";
import { getAdminInvoicesData } from "@/repositories/admin-records-repository";

export default async function AdminInvoicesPage() {
  const data = await getAdminInvoicesData();
  return <AdminInvoicesRegister data={data} />;
}
