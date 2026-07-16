import { notFound } from "next/navigation";
import { ArchiveDetail } from "@/components/dashboard/archive/archive-detail";
import { requireUser } from "@/features/auth/server";
import { getArchiveDetailData } from "@/repositories/archive-repository";

export default async function AdminArchiveDetailPage({
  params,
}: {
  params: Promise<{ archiveId: string }>;
}) {
  const [{ archiveId }, principal] = await Promise.all([params, requireUser()]);
  const data = await getArchiveDetailData(principal, archiveId);

  if (!data) {
    notFound();
  }

  return <ArchiveDetail data={data} />;
}
