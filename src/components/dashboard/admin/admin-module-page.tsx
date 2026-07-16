import { Activity, CheckCircle2, CircleDot, ListChecks } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminModule = {
  title: string;
  description: string;
  metrics: Array<{ label: string; value: string; helper: string }>;
  services: string[];
  workflow: string[];
};

export function AdminModulePage({ module }: { module: AdminModule }) {
  const summaryIcons = [ListChecks, CheckCircle2, Activity];

  return (
    <AdminPageSurface
      description={module.description}
      icon={ListChecks}
      summary={module.metrics.map((metric, index) => ({
        ...metric,
        icon: summaryIcons[index] ?? CircleDot,
      }))}
      title={module.title}
      footer={
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <p className="shrink-0 text-sm font-semibold text-foreground">Typical process</p>
          <div className="flex flex-wrap items-center gap-2">
            {module.workflow.map((step, index) => (
              <div className="flex items-center gap-2" key={step}>
                {index > 0 ? <span className="text-muted-foreground">/</span> : null}
                <span className="text-sm text-muted-foreground">
                  {index + 1}. {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Area</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>What to do</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {module.services.map((service, index) => (
              <TableRow key={service}>
                <TableCell className="font-semibold text-foreground">{service}</TableCell>
                <TableCell>
                  <Badge tone={index === 0 ? "teal" : "slate"}>
                    {index === 0 ? "Main area" : "Available"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  Open this area when you need to review or update {service.toLowerCase()}.
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}
