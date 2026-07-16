import Link from "next/link";
import { BadgeDollarSign, Eye, FilePenLine, Plus, Send, Star } from "lucide-react";
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
  PricingPlanRecord,
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

export function AdminPricingCatalog({ plans }: { plans: PricingPlanRecord[] }) {
  const published = plans.filter((plan) => plan.status === "published").length;
  const drafts = plans.filter((plan) => plan.status === "draft").length;
  const featured = plans.filter((plan) => plan.featured && plan.status === "published").length;

  return (
    <AdminPageSurface
      actions={
        <>
          <Link
            className={buttonClassName({ variant: "secondary" })}
            href="/pricing"
            target="_blank"
          >
            <Eye aria-hidden="true" className="h-4 w-4" />
            View public page
          </Link>
          <Link className={buttonClassName()} href="/admin/pricing/new">
            <Plus aria-hidden="true" className="h-4 w-4" />
            New pricing option
          </Link>
        </>
      }
      description="Manage the pricing options and fee descriptions shown to prospective clients."
      icon={BadgeDollarSign}
      summary={[
        { label: "All options", value: plans.length, helper: "Total pricing records", icon: BadgeDollarSign },
        { label: "Published", value: published, helper: "Visible to clients", icon: Send },
        { label: "Drafts", value: drafts, helper: "Still being prepared", icon: FilePenLine },
        { label: "Featured", value: featured, helper: "Highlighted publicly", icon: Star },
      ]}
      title="Pricing"
    >
      {plans.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>Pricing option</TableHead>
                <TableHead>Price shown</TableHead>
                <TableHead>Related service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <p className="font-semibold text-foreground">{plan.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.cadence}</p>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{plan.priceLabel}</TableCell>
                  <TableCell>{plan.serviceTitle ?? "All services"}</TableCell>
                  <TableCell>
                    <Badge tone={statusTone(plan.status)}>{plan.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {plan.featured ? <Badge tone="teal">Featured</Badge> : <span>-</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateLabel(plan.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className={buttonClassName({ size: "sm", variant: "secondary" })}
                      href={`/admin/pricing/${plan.id}`}
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
          <BadgeDollarSign aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">No pricing options have been added</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add the first option to start building the public pricing page.
            </p>
          </div>
          <Link className={buttonClassName()} href="/admin/pricing/new">
            <Plus aria-hidden="true" className="h-4 w-4" />
            New pricing option
          </Link>
        </div>
      )}
    </AdminPageSurface>
  );
}
