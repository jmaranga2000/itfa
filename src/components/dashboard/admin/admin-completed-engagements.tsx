import Link from "next/link";
import { Archive, ArrowRight, CheckCircle2, FileArchive } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WorkflowInstanceRecord } from "@/repositories/workflow-repository";

function dateLabel(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
    : "Not recorded";
}

export function AdminCompletedEngagements({ workflows }: { workflows: WorkflowInstanceRecord[] }) {
  const completed = workflows.filter((workflow) => workflow.status === "completed");

  return (
    <AdminPageSurface
      actions={<Link className={buttonClassName({ variant: "secondary" })} href="/admin/archive"><Archive className="h-4 w-4" />Open archive</Link>}
      description="Review completed client work, download its closure summary, then package the complete record into the archive."
      icon={CheckCircle2}
      summary={[
        { label: "Completed", value: completed.length, helper: "Ready for final archive review", icon: CheckCircle2 },
        { label: "Awaiting archive", value: completed.length, helper: "Administrator action required", icon: FileArchive },
      ]}
      title="Completed engagements"
    >
      <div className="grid gap-3 p-4 md:hidden">
        {completed.map((workflow) => (
          <article className="min-w-0 rounded-md border border-border bg-card p-4" key={workflow.id}>
            <div className="flex flex-wrap items-center gap-2"><Badge tone="green">Completed</Badge><span className="break-all font-mono text-xs font-semibold text-primary">{workflow.reference}</span></div>
            <h2 className="mt-3 break-words font-bold text-foreground">{workflow.clientName}</h2>
            <p className="mt-1 break-words text-sm text-muted-foreground">{workflow.serviceName}</p>
            <dl className="mt-4 grid gap-2 border-y border-border py-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Completed</dt><dd className="text-right font-semibold">{dateLabel(workflow.completion.completedAt)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Approved by</dt><dd className="text-right font-semibold">{workflow.completion.completedByName || "Administrator"}</dd></div>
            </dl>
            <Link className={buttonClassName({ className: "mt-4 w-full justify-center", size: "sm" })} href={`/admin/active-engagements/${workflow.id}?tab=completion`}>
              Review and archive<ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Client</TableHead><TableHead>Service</TableHead><TableHead>Completed</TableHead><TableHead>Approved by</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>
            {completed.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell className="font-mono text-xs font-semibold text-primary">{workflow.reference}</TableCell>
                <TableCell className="font-semibold text-foreground">{workflow.clientName}</TableCell>
                <TableCell><span className="block max-w-64 truncate">{workflow.serviceName}</span></TableCell>
                <TableCell>{dateLabel(workflow.completion.completedAt)}</TableCell>
                <TableCell>{workflow.completion.completedByName || "Administrator"}</TableCell>
                <TableCell className="text-right"><Link className={buttonClassName({ size: "sm", variant: "secondary" })} href={`/admin/active-engagements/${workflow.id}?tab=completion`}>Review and archive<ArrowRight className="h-4 w-4" /></Link></TableCell>
              </TableRow>
            ))}
            {completed.length === 0 ? <TableRow><TableCell className="py-12 text-center text-sm text-muted-foreground" colSpan={6}>Completed engagements will appear here after all completion checks pass.</TableCell></TableRow> : null}
          </TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}
