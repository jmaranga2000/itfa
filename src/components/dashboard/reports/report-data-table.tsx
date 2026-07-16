import { Download } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportTable } from "@/repositories/report-repository";

function csvHref(table: ReportTable) {
  const header = table.columns.map((column) => column.label).join(",");
  const rows = table.rows.map((row) =>
    table.columns
      .map((column) => JSON.stringify(String(row[column.key] ?? "")))
      .join(","),
  );

  return `data:text/csv;charset=utf-8,${encodeURIComponent([header, ...rows].join("\n"))}`;
}

export function ReportDataTable({ table }: { table: ReportTable }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{table.title}</CardTitle>
            <CardDescription>
              Server-side report records. Exports respect the current visible table data.
            </CardDescription>
          </div>
          <a
            className={buttonClassName({ variant: "secondary", size: "sm" })}
            download={`${table.title.toLowerCase().replaceAll(" ", "-")}.csv`}
            href={csvHref(table)}
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            CSV
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {table.rows.length > 0 ? (
          <div className="max-h-[520px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  {table.columns.map((column) => (
                    <TableHead
                      className={column.align === "right" ? "text-right" : undefined}
                      key={column.key}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.slice(0, 100).map((row, index) => (
                  <TableRow key={index}>
                    {table.columns.map((column) => (
                      <TableCell
                        className={column.align === "right" ? "text-right" : undefined}
                        key={column.key}
                      >
                        {row[column.key] ?? ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border p-8 text-center">
            <p className="font-semibold text-foreground">No data</p>
            <p className="mt-2 text-sm text-muted-foreground">
              No records matched the selected filters.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
