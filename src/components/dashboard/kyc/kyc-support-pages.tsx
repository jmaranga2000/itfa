import Link from "next/link";
import { ArrowLeft, FileCheck2 } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { buttonClassName } from "@/components/ui/button";
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
    <AdminPageSurface
      actions={
        <Link className={buttonClassName({ variant: "secondary" })} href={backHref}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          KYC centre
        </Link>
      }
      description={description}
      icon={FileCheck2}
      summary={[
        {
          label: eyebrow,
          value: rows.length,
          helper: rows.length === 1 ? "Record shown" : "Records shown",
          icon: FileCheck2,
        },
      ]}
      title={title}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column.replace(/([A-Z])/g, " $1").trim()}</TableHead>
              ))}
              <TableHead className="text-right">Action</TableHead>
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
                <TableCell className="text-right">
                  <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/kyc">
                    Open queue
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}
