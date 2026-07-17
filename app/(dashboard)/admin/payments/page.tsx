import { AdminPaymentsRegister } from "@/components/dashboard/admin/admin-record-registers";
import { getAdminPaymentsData } from "@/repositories/admin-records-repository";

export default async function AdminPaymentsPage() {
  const data = await getAdminPaymentsData();
  return <AdminPaymentsRegister data={data} />;
}
