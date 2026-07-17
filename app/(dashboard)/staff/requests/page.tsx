import { StaffRequests } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffRequestsPage() {
  const { principal } = await requireStaffRoute("requests");
  const data = await getStaffWorkData(principal);
  return <StaffRequests requests={data.requests} />;
}
