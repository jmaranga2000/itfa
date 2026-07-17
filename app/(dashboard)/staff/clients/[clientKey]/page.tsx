import { notFound } from "next/navigation";
import { StaffClientDetail } from "@/components/dashboard/staff/staff-client-detail";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffClientRecord } from "@/repositories/staff-work-repository";

export default async function StaffClientDetailPage({
  params,
}: {
  params: Promise<{ clientKey: string }>;
}) {
  const [{ principal }, { clientKey }] = await Promise.all([
    requireStaffRoute("clients"),
    params,
  ]);
  const data = await getStaffClientRecord(principal, decodeURIComponent(clientKey));
  if (!data) notFound();

  return <StaffClientDetail data={data} />;
}
