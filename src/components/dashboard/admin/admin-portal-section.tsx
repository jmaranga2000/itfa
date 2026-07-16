import { CheckCircle2, ListChecks } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border border-l-4 border-l-primary bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase text-primary">{section.eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-normal text-foreground">
              {section.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {section.description}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-brand-mist-strong bg-brand-soft px-4 py-3 text-brand-deep">
            <ListChecks aria-hidden="true" className="h-5 w-5" />
            <div>
              <p className="text-xs font-semibold text-brand-deep/65">Current list</p>
              <p className="mt-0.5 text-sm font-semibold text-brand-deep">
                {section.table.rows.length} items shown
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {section.metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl font-bold">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle>{section.table.title}</CardTitle>
            <CardDescription>{section.table.description}</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What you can do</CardTitle>
            <CardDescription>Common actions available on this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border border-y border-border">
            {section.panel.items.map((item) => (
              <div className="flex items-center gap-3 px-1 py-3 text-sm font-medium text-foreground" key={item}>
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
                {item}
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>How to complete this work</CardTitle>
          <CardDescription>Follow these steps from start to finish.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-4">
          {section.workflow.map((step, index) => (
            <div className="border-t-2 border-primary pt-3" key={step}>
              <p className="font-mono text-xs font-semibold text-primary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
