import { StaffCalendar } from "@/components/dashboard/staff/staff-calendar";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffCalendarPage() {
  const { principal } = await requireStaffRoute("calendar");
  const data = await getStaffWorkData(principal);
  return <StaffCalendar events={data.calendar} />;
}
