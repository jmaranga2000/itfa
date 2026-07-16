import Link from "next/link";
import { Archive, Eye, FilePenLine, ListChecks, Plus, Send } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  CatalogStatus,
  ServiceCatalogRecord,
} from "@/repositories/service-catalog-repository";

function statusTone(status: CatalogStatus) {
  if (status === "published") return "green" as const;
  if (status === "archived") return "slate" as const;
  return "gold" as const;
}

function dateLabel(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminServiceCatalog({ services }: { services: ServiceCatalogRecord[] }) {
  const published = services.filter((service) => service.status === "published").length;
  const drafts = services.filter((service) => service.status === "draft").length;
  const archived = services.filter((service) => service.status === "archived").length;

  return (
    <AdminPageSurface
      actions={
        <>
          <Link
            className={buttonClassName({ variant: "secondary" })}
            href="/services"
            target="_blank"
          >
            <Eye aria-hidden="true" className="h-4 w-4" />
            View public page
          </Link>
          <Link className={buttonClassName()} href="/admin/services/new">
            <Plus aria-hidden="true" className="h-4 w-4" />
            New service
          </Link>
        </>
      }
      description="Create and maintain the services clients can browse on the public website."
      icon={ListChecks}
      summary={[
        { label: "All services", value: services.length, helper: "Total catalog records", icon: ListChecks },
        { label: "Published", value: published, helper: "Visible to clients", icon: Send },
        { label: "Drafts", value: drafts, helper: "Still being prepared", icon: FilePenLine },
        { label: "Archived", value: archived, helper: "Hidden from the website", icon: Archive },
      ]}
      title="Services"
    >
      {services.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Included items</TableHead>
                <TableHead>Public order</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <p className="font-semibold text-foreground">{service.title}</p>
                    <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                      {service.summary}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge tone={statusTone(service.status)}>{service.status}</Badge>
                  </TableCell>
                  <TableCell>{service.inclusions.length}</TableCell>
                  <TableCell>{service.displayOrder}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateLabel(service.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className={buttonClassName({ size: "sm", variant: "secondary" })}
                      href={`/admin/services/${service.id}`}
                    >
                      <FilePenLine aria-hidden="true" className="h-4 w-4" />
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid justify-items-center gap-3 px-5 py-14 text-center">
          <ListChecks aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">No services have been added</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add the first service to start building the public catalog.
            </p>
          </div>
          <Link className={buttonClassName()} href="/admin/services/new">
            <Plus aria-hidden="true" className="h-4 w-4" />
            New service
          </Link>
        </div>
      )}
    </AdminPageSurface>
  );
}
