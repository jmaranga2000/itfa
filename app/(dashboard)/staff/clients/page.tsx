import { StaffClients } from "@/components/dashboard/staff/staff-clients";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffClientsPage() {
  const { principal } = await requireStaffRoute("clients");
  const data = await getStaffWorkData(principal);
  return <StaffClients clients={data.clients} />;
}
