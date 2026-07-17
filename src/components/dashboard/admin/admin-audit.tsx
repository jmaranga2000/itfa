import Link from "next/link";
import { Activity, ArrowUpRight, CalendarDays, Database, Search, Users } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminAuditRecord } from "@/repositories/admin-audit-repository";

function actionLabel(value: string) {
  return value.replaceAll(".", " / ").replaceAll("_", " ");
}

function dateLabel(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AdminAudit({ data, current }: {
  data: {
    records: AdminAuditRecord[];
    summary: { total: number; today: number; actors: number; resources: number };
    filters: { resourceTypes: string[]; actors: string[] };
  };
  current: { query: string; resourceType: string; actor: string };
}) {
  return (
    <AdminPageSurface
      description="Trace important changes across clients, staff, access, workflows, finance, communications, and system settings."
      icon={Activity}
      summary={[
        { label: "Events", value: data.summary.total, helper: "Recorded activity", icon: Activity },
        { label: "Today", value: data.summary.today, helper: "Events since midnight", icon: CalendarDays },
        { label: "People", value: data.summary.actors, helper: "Recorded actors", icon: Users },
        { label: "Record types", value: data.summary.resources, helper: "Areas being tracked", icon: Database },
      ]}
      title="Activity log"
    >
      <form className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(220px,1fr)_220px_240px_auto]" method="get">
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Search<Input defaultValue={current.query} name="query" placeholder="Action, record, person, or reason" /></label>
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Record type<Select defaultValue={current.resourceType} name="resourceType"><option value="">All record types</option>{data.filters.resourceTypes.map((value) => <option key={value} value={value}>{value}</option>)}</Select></label>
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Person<Select defaultValue={current.actor} name="actor"><option value="">Everyone</option>{data.filters.actors.map((value) => <option key={value} value={value}>{value}</option>)}</Select></label>
        <button className={buttonClassName({ className: "self-end" })} type="submit"><Search aria-hidden="true" className="h-4 w-4" />Find activity</button>
      </form>
      <div className="min-w-0 overflow-x-auto">
        <Table className="min-w-[960px]">
          <TableHeader><TableRow><TableHead>Activity</TableHead><TableHead>Person</TableHead><TableHead>Record</TableHead><TableHead>Reason</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Details</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.records.length ? data.records.map((record) => (
              <TableRow key={record.id}>
                <TableCell><p className="font-semibold capitalize text-foreground">{actionLabel(record.action)}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{record.action}</p></TableCell>
                <TableCell>{record.actorEmail ?? "System"}</TableCell>
                <TableCell><Badge tone="slate">{record.resourceType}</Badge>{record.resourceId ? <p className="mt-1 max-w-48 truncate font-mono text-xs text-muted-foreground">{record.resourceId}</p> : null}</TableCell>
                <TableCell><p className="max-w-64 truncate text-muted-foreground">{record.reason ?? "No reason supplied"}</p></TableCell>
                <TableCell>{dateLabel(record.createdAt)}</TableCell>
                <TableCell className="text-right"><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/admin/audit/${record.id}`}>Open<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></TableCell>
              </TableRow>
            )) : <TableRow><TableCell className="py-12 text-center text-muted-foreground" colSpan={6}>No activity matches these filters.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}
