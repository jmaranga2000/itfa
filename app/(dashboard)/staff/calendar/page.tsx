import { StaffCalendar } from "@/components/dashboard/staff/staff-calendar";
import { requireStaffRoute } from "@/features/staff/server";

export default async function StaffCalendarPage() {
  await requireStaffRoute("calendar");
  return <StaffCalendar />;
}
