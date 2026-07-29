import Link from "next/link";
import { ArrowLeft, Save, Tags } from "lucide-react";
import { saveEtimsServiceMappingAction } from "@/features/etims/actions";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import type { EtimsServiceMappingRecord } from "@/repositories/etims-configuration-repository";

export function EtimsServiceMappings({
  mappings,
  query,
}: {
  mappings: EtimsServiceMappingRecord[];
  query: { saved?: string; error?: string };
}) {
  const active = mappings.filter((mapping) => mapping.active).length;
  const unmapped = mappings.filter((mapping) => !mapping.mapped || !mapping.active).length;
  return (
    <AdminPageSurface
      actions={<Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/finance/etims"><ArrowLeft className="h-4 w-4" />eTIMS activity</Link>}
      description="Connect every consulting service to the item, classification, unit, and tax codes supplied by KRA or the certified integrator."
      icon={Tags}
      summary={[
        { label: "Services", value: mappings.length, helper: "Current catalogue", icon: Tags },
        { label: "Ready", value: active, helper: "Active mappings", icon: Tags },
        { label: "Need mapping", value: unmapped, helper: "Blocks invoice approval", icon: Tags },
      ]}
      title="Service tax mapping"
    >
      <div className="grid gap-4">
        {query.saved ? <p className="rounded-md border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">Service mapping saved.</p> : null}
        {query.error ? <p className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">The mapping was not saved. Complete every required connector code.</p> : null}
        <p className="rounded-md border border-warning/30 bg-warning-soft p-4 text-sm text-foreground">Do not guess these codes. Copy them from approved KRA reference data or your certified integrator. An active mapping is required before Admin can approve an invoice.</p>
        {mappings.map((mapping) => (
          <details className="group rounded-md border border-border bg-card" key={mapping.serviceId} open={!mapping.mapped}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
              <div><p className="font-semibold text-foreground">{mapping.serviceTitle}</p><p className="mt-1 text-xs text-muted-foreground">{mapping.serviceStatus}</p></div>
              <Badge tone={mapping.active ? "green" : mapping.mapped ? "gold" : "red"}>{mapping.active ? "Ready" : mapping.mapped ? "Inactive" : "Not mapped"}</Badge>
            </summary>
            <form action={saveEtimsServiceMappingAction} className="grid gap-4 border-t border-border p-4">
              <input name="serviceId" type="hidden" value={mapping.serviceId} />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div><Label htmlFor={`item-${mapping.serviceId}`}>Item code</Label><Input className="mt-2" defaultValue={mapping.itemCode} id={`item-${mapping.serviceId}`} name="itemCode" required /></div>
                <div><Label htmlFor={`class-${mapping.serviceId}`}>Classification code</Label><Input className="mt-2" defaultValue={mapping.classificationCode} id={`class-${mapping.serviceId}`} name="classificationCode" required /></div>
                <div><Label htmlFor={`tax-${mapping.serviceId}`}>Tax type code</Label><Input className="mt-2" defaultValue={mapping.taxTypeCode} id={`tax-${mapping.serviceId}`} name="taxTypeCode" required /></div>
                <div><Label htmlFor={`rate-${mapping.serviceId}`}>Tax rate · percent</Label><Input className="mt-2" defaultValue={mapping.taxRate} id={`rate-${mapping.serviceId}`} max="100" min="0" name="taxRate" step="0.01" type="number" required /></div>
                <div><Label htmlFor={`quantity-${mapping.serviceId}`}>Quantity unit code</Label><Input className="mt-2" defaultValue={mapping.quantityUnitCode} id={`quantity-${mapping.serviceId}`} name="quantityUnitCode" required /></div>
                <div><Label htmlFor={`package-${mapping.serviceId}`}>Package unit code</Label><Input className="mt-2" defaultValue={mapping.packageUnitCode} id={`package-${mapping.serviceId}`} name="packageUnitCode" required /></div>
              </div>
              <label className="flex cursor-pointer items-center gap-3"><input className="h-4 w-4 accent-primary" defaultChecked={mapping.active} name="active" type="checkbox" /><span className="text-sm font-semibold text-foreground">Use this mapping for new invoices</span></label>
              <SubmitButton className="w-full sm:w-fit" pendingText="Saving mapping..."><Save className="h-4 w-4" />Save mapping</SubmitButton>
            </form>
          </details>
        ))}
      </div>
    </AdminPageSurface>
  );
}
