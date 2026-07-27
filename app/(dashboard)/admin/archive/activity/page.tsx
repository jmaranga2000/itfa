import { ArchiveActivity } from "@/components/dashboard/archive/archive-activity";
import { requireUser } from "@/features/auth/server";
import { getArchiveDashboardData } from "@/repositories/archive-repository";

export default async function AdminArchiveActivityPage() {
  const [principal] = await Promise.all([requireUser()]);
  const data = await getArchiveDashboardData(principal, {});

  return <ArchiveActivity data={data} />;
}
