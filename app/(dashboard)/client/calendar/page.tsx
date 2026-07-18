import { ClientCalendar } from "@/components/dashboard/client/client-calendar";
import { requireUser } from "@/features/auth/server";
import { getClientCalendarEvents } from "@/repositories/client-calendar-repository";

export default async function ClientCalendarPage() {
  const principal = await requireUser();
  const events = await getClientCalendarEvents(principal);
  const parts = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Nairobi",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  return <ClientCalendar events={events} initialMonth={today.slice(0, 7)} today={today} />;
}
