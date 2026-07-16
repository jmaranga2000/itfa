import Link from "next/link";
import { ArrowLeft, ListChecks } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { ServiceCatalogForm } from "@/components/dashboard/admin/service-catalog-form";
import { buttonClassName } from "@/components/ui/button";
import { requirePermission } from "@/features/auth/server";
import { createServiceAction } from "@/features/services/actions";

export default async function NewAdminServicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("services.manage");
  const query = await searchParams;

  return (
    <AdminPageSurface
      actions={
        <Link
          className={buttonClassName({ variant: "secondary" })}
          href="/admin/services"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to services
        </Link>
      }
      description="Add a service, prepare its public description, and publish it when ready."
      icon={ListChecks}
      title="New service"
    >
      {query.error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">
          Check the required fields and try again.
        </p>
      ) : null}
      <ServiceCatalogForm
        action={createServiceAction}
        submitLabel="Create service"
      />
    </AdminPageSurface>
  );
}
