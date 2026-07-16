import Link from "next/link";
import { ArrowLeft, BadgeDollarSign, Eye } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { PricingPlanForm } from "@/components/dashboard/admin/pricing-plan-form";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { requirePermission } from "@/features/auth/server";
import { updatePricingPlanAction } from "@/features/services/actions";
import {
  getPricingPlan,
  listServices,
} from "@/repositories/service-catalog-repository";

export default async function AdminPricingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ created?: string; error?: string; saved?: string }>;
}) {
  await requirePermission("services.manage");
  const [{ planId }, query, services] = await Promise.all([
    params,
    searchParams,
    listServices(),
  ]);
  const plan = await getPricingPlan(planId);

  if (!plan) notFound();

  return (
    <AdminPageSurface
      actions={
        <>
          {plan.status === "published" ? (
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href="/pricing"
              target="_blank"
            >
              <Eye aria-hidden="true" className="h-4 w-4" />
              View pricing page
            </Link>
          ) : null}
          <Link
            className={buttonClassName({ variant: "secondary" })}
            href="/admin/pricing"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to pricing
          </Link>
        </>
      }
      description="Review this pricing record and update the information shown to clients."
      icon={BadgeDollarSign}
      title={plan.name}
    >
      {query.created || query.saved ? (
        <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">
          <Badge tone="green">{query.created ? "Created" : "Saved"}</Badge>
          The pricing record is up to date.
        </div>
      ) : null}
      {query.error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">
          Check the required fields and try again.
        </p>
      ) : null}
      <PricingPlanForm
        action={updatePricingPlanAction}
        plan={plan}
        services={services}
        submitLabel="Save changes"
      />
    </AdminPageSurface>
  );
}
