import { StaffClients } from "@/components/dashboard/staff/staff-clients";
import { requireStaffRoute } from "@/features/staff/server";

export default async function StaffClientsPage() {
  await requireStaffRoute("clients");
  return <StaffClients />;
}
