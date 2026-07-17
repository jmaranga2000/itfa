import { StaffAi } from "@/components/dashboard/staff/staff-ai";
import { requireStaffRoute } from "@/features/staff/server";

export default async function StaffAiPage() {
  await requireStaffRoute("ai");
  return <StaffAi />;
}
