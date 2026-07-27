import { ArchiveManagement } from "@/components/dashboard/archive/archive-management";
import { requireUser } from "@/features/auth/server";
import { getArchiveDashboardData } from "@/repositories/archive-repository";

export default async function AdminArchiveManagementPage() {
  const [principal] = await Promise.all([requireUser()]);
  const data = await getArchiveDashboardData(principal, {});

  return <ArchiveManagement data={data} />;
}
