import { Activity, CheckCircle2, CircleDot, ListChecks } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminPortalSectionConfig = {
  eyebrow: string;
  title: string;
  description: string;
  code: string;
  metrics: Array<{
    label: string;
    value: string;
    helper: string;
  }>;
  table: {
    title: string;
    description: string;
    columns: string[];
    rows: string[][];
  };
  panel: {
    title: string;
    description: string;
    items: string[];
  };
  workflow: string[];
};

export function AdminPortalSection({ section }: { section: AdminPortalSectionConfig }) {
  const summaryIcons = [ListChecks, CheckCircle2, Activity];

  return (
    <AdminPageSurface
      description={section.description}
      icon={ListChecks}
      summary={section.metrics.map((metric, index) => ({
        ...metric,
        icon: summaryIcons[index] ?? CircleDot,
      }))}
      title={section.title}
      footer={
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Usual process:</span>
            {section.workflow.map((step, index) => (
              <span className="text-sm text-muted-foreground" key={step}>
                {index + 1}. {step}{index < section.workflow.length - 1 ? " /" : ""}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {section.panel.items.slice(0, 2).map((item) => (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground" key={item}>
                <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              {section.table.columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {section.table.rows.map((row) => (
              <TableRow key={row.join(":")}>
                {row.map((cell, index) => (
                  <TableCell
                    className={index === 0 ? "font-semibold text-foreground" : undefined}
                    key={`${row[0]}-${section.table.columns[index]}`}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}
