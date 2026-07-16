import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

export function KycSimpleTablePage({
  eyebrow,
  title,
  description,
  columns,
  rows,
  backHref = "/admin/kyc",
}: {
  eyebrow: string;
  title: string;
  description: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
  backHref?: string;
}) {
  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <Badge tone="teal">{eyebrow}</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <Link className={buttonClassName({ variant: "secondary" })} href={backHref}>
            Back to KYC centre
          </Link>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{rows.length} records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={`${title}-${index}`}>
                    {columns.map((column) => (
                      <TableCell
                        className={column === columns[0] ? "font-semibold text-foreground" : undefined}
                        key={column}
                      >
                        {row[column] ?? ""}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/kyc">
                        View queue
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
