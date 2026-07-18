import Link from "next/link";
import { Check, Plus, ShoppingCart } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { addServiceToCartAction } from "@/features/client/commerce-actions";
import type { PricingPlanRecord, ServiceCatalogRecord } from "@/repositories/service-catalog-repository";

export function ClientServices({
  added,
  cartCount,
  plans,
  services,
}: {
  added: boolean;
  cartCount: number;
  plans: PricingPlanRecord[];
  services: ServiceCatalogRecord[];
}) {
  const plansByService = new Map(plans.filter((plan) => plan.serviceId).map((plan) => [plan.serviceId, plan]));

  return (
    <AdminPageSurface
      actions={
        <Link className={buttonClassName()} href="/client/cart">
          <ShoppingCart aria-hidden="true" className="h-4 w-4" />
          Cart
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white/20 px-1 text-xs font-bold">
            {cartCount}
          </span>
        </Link>
      }
      description="Browse current consulting services and add the work you need to your engagement cart."
      icon={ShoppingCart}
      title="Services"
    >
      {added ? <p className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">Service added to your cart.</p> : null}
      <div className="divide-y divide-border">
        {services.map((service) => {
          const plan = plansByService.get(service.id);
          return (
            <article className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_240px]" key={service.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{service.title}</h2>
                  <Badge tone="teal">Available</Badge>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{service.summary}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {service.inclusions.map((item) => <span className="flex items-center gap-2 text-sm font-medium text-foreground" key={item}><Check aria-hidden="true" className="h-4 w-4 text-primary" />{item}</span>)}
                </div>
              </div>
              <div className="flex flex-col justify-between gap-4 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                <div><p className="text-xs font-bold uppercase text-muted-foreground">Pricing</p><p className="mt-2 font-bold text-foreground">{plan?.priceLabel ?? "Quotation required"}</p><p className="mt-1 text-xs text-muted-foreground">{plan?.cadence ?? "Scoped after review"}</p></div>
                <form action={addServiceToCartAction}>
                  <input name="serviceId" type="hidden" value={service.id} />
                  {plan ? <input name="pricingPlanId" type="hidden" value={plan.id} /> : null}
                  <input name="returnPath" type="hidden" value="/client/services" />
                  <SubmitButton className="w-full" pendingText="Adding...">
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    Add to cart
                  </SubmitButton>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </AdminPageSurface>
  );
}
