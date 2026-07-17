import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState, staffDate, staffStatusLabel } from "@/components/dashboard/staff/staff-work-ui";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import type { StaffCalendarRecord } from "@/repositories/staff-work-repository";

function isUpcoming(date: string) {
  return new Date(date).getTime() >= new Date().setHours(0, 0, 0, 0);
}

export function StaffCalendar({ events }: { events: StaffCalendarRecord[] }) {
  const upcoming = events.filter((event) => isUpcoming(event.date));
  const overdue = events.length - upcoming.length;

  return (
    <AdminPageSurface
      description="Due dates from your engagements, tasks and client follow-ups."
      icon={CalendarDays}
      summary={[
        { label: "Upcoming", value: upcoming.length, helper: "Dates still ahead", icon: CalendarDays },
        { label: "Past due", value: overdue, helper: "May need follow-up", icon: Clock3 },
      ]}
      title="My calendar"
    >
      {events.length === 0 ? (
        <StaffEmptyState description="Dates will appear when deadlines are added to your assigned work." title="No scheduled work" />
      ) : (
        <div className="divide-y divide-border">
          {events.map((event) => (
            <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center" key={event.id}>
              <div className="flex min-w-0 items-start gap-4">
                <div className="min-w-20 rounded-md bg-brand-soft px-3 py-2 text-center text-primary">
                  <p className="text-xs font-semibold uppercase">Due</p>
                  <p className="mt-1 text-sm font-bold">{staffDate(event.date, false)}</p>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{event.title}</p>
                    <Badge>{staffStatusLabel(event.type)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{event.clientName}</p>
                </div>
              </div>
              <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/engagements/${event.workflowId}`}>
                Open
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </AdminPageSurface>
  );
}
