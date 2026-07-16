import Link from "next/link";
import { ArrowLeft, Eye, ListChecks } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { ServiceCatalogForm } from "@/components/dashboard/admin/service-catalog-form";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { requirePermission } from "@/features/auth/server";
import { updateServiceAction } from "@/features/services/actions";
import { getService } from "@/repositories/service-catalog-repository";

export default async function AdminServiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ serviceId: string }>;
  searchParams: Promise<{ created?: string; error?: string; saved?: string }>;
}) {
  await requirePermission("services.manage");
  const [{ serviceId }, query] = await Promise.all([params, searchParams]);
  const service = await getService(serviceId);

  if (!service) notFound();

  return (
    <AdminPageSurface
      actions={
        <>
          {service.status === "published" ? (
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href={`/services#${service.slug}`}
              target="_blank"
            >
              <Eye aria-hidden="true" className="h-4 w-4" />
              View on website
            </Link>
          ) : null}
          <Link
            className={buttonClassName({ variant: "secondary" })}
            href="/admin/services"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to services
          </Link>
        </>
      }
      description="Review the full service record and update what clients see on the website."
      icon={ListChecks}
      title={service.title}
    >
      {query.created || query.saved ? (
        <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">
          <Badge tone="green">{query.created ? "Created" : "Saved"}</Badge>
          The service record is up to date.
        </div>
      ) : null}
      {query.error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">
          Check the required fields and try again.
        </p>
      ) : null}
      <ServiceCatalogForm
        action={updateServiceAction}
        service={service}
        submitLabel="Save changes"
      />
    </AdminPageSurface>
  );
}
