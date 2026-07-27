import { ArchiveOverview } from "@/components/dashboard/archive/archive-overview";
import { requireUser } from "@/features/auth/server";
import { getArchiveDashboardData } from "@/repositories/archive-repository";

export default async function AdminArchiveOverviewPage() {
  const [principal] = await Promise.all([requireUser()]);
  const data = await getArchiveDashboardData(principal, {});

  return <ArchiveOverview data={data} />;
}
