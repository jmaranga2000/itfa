import { AdminDocumentsRegister } from "@/components/dashboard/admin/admin-record-registers";
import { getAdminDocumentsData } from "@/repositories/admin-records-repository";

export default async function AdminDocumentsPage() {
  const data = await getAdminDocumentsData();
  return <AdminDocumentsRegister data={data} />;
}
