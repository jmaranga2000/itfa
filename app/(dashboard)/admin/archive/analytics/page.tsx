import { ArchiveAnalytics } from "@/components/dashboard/archive/archive-analytics";
import { requireUser } from "@/features/auth/server";
import { getArchiveDashboardData } from "@/repositories/archive-repository";

export default async function AdminArchiveAnalyticsPage() {
  const [principal] = await Promise.all([requireUser()]);
  const data = await getArchiveDashboardData(principal, {});

  return <ArchiveAnalytics data={data} />;
}
