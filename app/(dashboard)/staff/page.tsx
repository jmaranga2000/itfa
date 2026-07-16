import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  ListTodo,
  MessageSquareText,
  Users,
} from "lucide-react";
import { CommunicationWidget } from "@/components/dashboard/communication/communication-widget";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/features/auth/server";
import { getCommunicationHubData } from "@/repositories/communication-repository";

const staffMetrics = [
  { icon: BriefcaseBusiness, label: "Assigned engagements", value: "0", helper: "Active matters assigned to your role." },
  { icon: ClipboardCheck, label: "Pending reviews", value: "0", helper: "KYC and professional review items." },
  { icon: ListTodo, label: "Overdue tasks", value: "0", helper: "Tasks beyond their workflow deadline." },
  { icon: MessageSquareText, label: "Client responses", value: "0", helper: "Conversations waiting for staff action." },
] as const;

const workQueue = [
  { id: "TASK-001", label: "KYC document review", type: "Review", status: "Pending setup" },
  { id: "TASK-002", label: "Engagement scope confirmation", type: "Approval", status: "Pending setup" },
  { id: "TASK-003", label: "Draft professional response", type: "Delivery", status: "Pending setup" },
] as const;

const staffTools = [
  { icon: Users, label: "Open assigned clients", href: "/staff/clients" },
  { icon: ClipboardCheck, label: "Open review queue", href: "/staff/reviews" },
  { icon: MessageSquareText, label: "Message a client", href: "/staff/messages" },
  { icon: CalendarDays, label: "Review calendar", href: "/staff/calendar" },
] as const;

export default async function StaffDashboardPage() {
  const principal = await requireUser();
  const communication = await getCommunicationHubData(principal);

  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md bg-brand-deep p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Badge tone="teal">Staff dashboard</Badge>
            <h1 className="mt-4 max-w-3xl text-2xl font-bold leading-tight md:text-3xl">Assigned work, reviews and deadlines.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Focus on the client matters assigned to you while internal notes, approvals and client-visible communication stay properly separated.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonClassName({ variant: "accent" })} href="/staff/tasks">
              Open task queue
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link className={buttonClassName({ className: "border-white/30 bg-transparent text-white hover:bg-white/10", variant: "ghost" })} href="/staff/calendar">
              View calendar
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {staffMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle className="mt-2 text-3xl font-bold">{metric.value}</CardTitle>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-soft text-brand-deep">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent><p className="text-sm leading-6 text-muted-foreground">{metric.helper}</p></CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.35fr)_340px]">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Work queue</CardTitle>
              <CardDescription>Tasks unlocked by assigned engagement workflows.</CardDescription>
            </div>
            <ListTodo aria-hidden="true" className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="min-w-0 overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow><TableHead>ID</TableHead><TableHead>Work item</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {workQueue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{item.id}</TableCell>
                    <TableCell className="font-semibold text-foreground">{item.label}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell><Badge tone="slate">{item.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s tools</CardTitle>
            <CardDescription>Shortcuts for regular staff work.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {staffTools.map((item) => {
              const Icon = item.icon;
              return (
              <Link className="flex items-center gap-3 rounded-md border border-border px-3 py-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-brand-soft" href={item.href} key={item.label}>
                <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
                <span className="min-w-0 flex-1">{item.label}</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <CommunicationWidget data={communication} messagesHref="/staff/messages" notificationsHref="/staff/notifications" />
    </div>
  );
}
