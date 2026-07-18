"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import type { ClientCalendarEvent } from "@/repositories/client-calendar-repository";

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const tones: Record<ClientCalendarEvent["type"], string> = {
  engagement: "border-teal-300 bg-teal-50 text-teal-900",
  task: "border-sky-300 bg-sky-50 text-sky-900",
  client_action: "border-amber-300 bg-amber-50 text-amber-950",
  milestone: "border-violet-300 bg-violet-50 text-violet-900",
  quotation: "border-rose-300 bg-rose-50 text-rose-900",
  letter: "border-slate-300 bg-slate-100 text-slate-900",
};

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function eventDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Nairobi",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function monthDate(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

function monthCells(monthValue: string) {
  const first = monthDate(monthValue);
  const offset = (first.getUTCDay() + 6) % 7;
  const start = new Date(first);
  start.setUTCDate(1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date;
  });
}

function moveMonth(value: string, amount: number) {
  const date = monthDate(value);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}

export function ClientCalendar({
  events,
  initialMonth,
  today,
}: {
  events: ClientCalendarEvent[];
  initialMonth: string;
  today: string;
}) {
  const [month, setMonth] = useState(initialMonth);
  const cells = useMemo(() => monthCells(month), [month]);
  const eventsByDate = useMemo(() => events.reduce<Record<string, ClientCalendarEvent[]>>((groups, event) => {
    (groups[eventDateKey(event.date)] ??= []).push(event);
    return groups;
  }, {}), [events]);
  const upcoming = events.filter((event) => eventDateKey(event.date) >= today).slice(0, 8);
  const title = new Intl.DateTimeFormat("en-KE", { month: "long", year: "numeric", timeZone: "UTC" }).format(monthDate(month));

  return (
    <div className="grid min-w-0 gap-5">
      <section className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-center"><div><Badge tone="teal">Schedule</Badge><h1 className="mt-3 text-2xl font-bold text-foreground">My calendar</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Engagement dates, actions, quotations and document deadlines from your live portal records.</p></div><div className="flex items-center gap-3"><CalendarDays className="h-7 w-7 text-primary" /><div><p className="text-xs font-semibold text-muted-foreground">Upcoming</p><p className="text-xl font-bold text-foreground">{upcoming.length}</p></div></div></section>
      <section className="overflow-hidden rounded-md border border-border bg-card">
        <header className="flex items-center justify-between gap-3 border-b border-border p-4"><button aria-label="Previous month" className={buttonClassName({ variant: "secondary", size: "icon" })} onClick={() => setMonth((value) => moveMonth(value, -1))} type="button"><ChevronLeft className="h-4 w-4" /></button><div className="text-center"><h2 className="font-bold text-foreground">{title}</h2><button className="mt-1 text-xs font-semibold text-primary hover:underline" onClick={() => setMonth(initialMonth)} type="button">Today</button></div><button aria-label="Next month" className={buttonClassName({ variant: "secondary", size: "icon" })} onClick={() => setMonth((value) => moveMonth(value, 1))} type="button"><ChevronRight className="h-4 w-4" /></button></header>
        <div className="overflow-x-auto"><div className="min-w-[760px]"><div className="grid grid-cols-7 border-b border-border bg-muted/20">{dayNames.map((day) => <div className="px-2 py-3 text-center text-xs font-bold text-muted-foreground" key={day}>{day}</div>)}</div><div className="grid grid-cols-7">{cells.map((date) => { const key = dateKey(date); const dayEvents = eventsByDate[key] ?? []; const inMonth = key.slice(0, 7) === month; return <div className={`min-h-28 border-b border-r border-border p-2 ${inMonth ? "bg-card" : "bg-muted/20"}`} key={key}><div className={`mb-2 grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${key === today ? "bg-primary text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground"}`}>{date.getUTCDate()}</div><div className="grid gap-1">{dayEvents.slice(0, 3).map((event) => <Link className={`truncate rounded-sm border px-2 py-1 text-[11px] font-semibold ${tones[event.type]}`} href={event.href} key={event.id} title={event.title}>{event.title}</Link>)}{dayEvents.length > 3 ? <span className="px-1 text-[10px] font-semibold text-muted-foreground">+{dayEvents.length - 3} more</span> : null}</div></div>; })}</div></div></div>
      </section>
      <section className="rounded-md border border-border bg-card"><div className="border-b border-border p-4"><h2 className="font-bold text-foreground">Next dates</h2><p className="mt-1 text-sm text-muted-foreground">Your nearest deadlines and scheduled actions.</p></div>{upcoming.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No upcoming dates have been scheduled.</p> : <div className="divide-y divide-border">{upcoming.map((event) => <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center" key={event.id}><div className="flex min-w-0 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-primary"><Clock3 className="h-4 w-4" /></span><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{event.title}</p><Badge>{event.reference}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{new Intl.DateTimeFormat("en-KE", { dateStyle: "long", timeZone: "Africa/Nairobi" }).format(new Date(event.date))} | {event.detail}</p></div></div><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={event.href}>Open<ExternalLink className="h-4 w-4" /></Link></div>)}</div>}</section>
    </div>
  );
}
