import Link from "next/link";
import { ArrowRight, Calculator, ShoppingCart, Trash2 } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState } from "@/components/dashboard/staff/staff-work-ui";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { removeCartItemAction, requestQuotationAction, updateCartAction } from "@/features/client/commerce-actions";
import type { ClientCartRecord } from "@/repositories/client-commerce-repository";

export function ClientCart({
  cart,
  checkoutHref,
  returnPath,
}: {
  cart: ClientCartRecord;
  checkoutHref: string;
  returnPath: string;
}) {
  return (
    <AdminPageSurface
      actions={<Link className={buttonClassName({ variant: "secondary" })} href={returnPath.startsWith("/client") ? "/client/services" : "/services"}>Browse services</Link>}
      description="Review selected services before submitting them for scope review or requesting a quotation."
      icon={ShoppingCart}
      summary={[{ label: "Services selected", value: cart.itemCount, helper: "Ready for review", icon: ShoppingCart }]}
      title="Engagement cart"
    >
      {cart.empty ? (
        <StaffEmptyState action={<Link className={buttonClassName()} href={returnPath.startsWith("/client") ? "/client/services" : "/services"}>Browse services</Link>} description="Add one or more consulting services before continuing." title="Your cart is empty" />
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <form action={updateCartAction} className="divide-y divide-border">
            <input name="returnPath" type="hidden" value={returnPath} />
            {cart.items.map((item) => (
              <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_100px_auto] sm:items-center" key={item.serviceId}>
                <div><h2 className="font-bold text-foreground">{item.title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.summary}</p><p className="mt-2 text-sm font-semibold text-primary">{item.priceLabel}</p></div>
                <Input aria-label={`Quantity for ${item.title}`} defaultValue={item.quantity} max={10} min={1} name={`quantity:${item.serviceId}`} type="number" />
                <SubmitButton formAction={removeCartItemAction} name="serviceId" pendingText="Removing..." value={item.serviceId} variant="secondary">
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  Remove
                </SubmitButton>
              </div>
            ))}
            <div className="flex justify-end p-5"><SubmitButton pendingText="Updating cart..." variant="secondary">Update cart</SubmitButton></div>
          </form>

          <aside className="grid content-start gap-3 border-t border-border bg-muted/20 p-5 lg:border-l lg:border-t-0">
            <h2 className="font-bold text-foreground">Cart actions</h2>
            <p className="text-sm leading-6 text-muted-foreground">Checkout sends a formal request for admin review. No charge is made until scope and fees are confirmed.</p>
            <Link className={buttonClassName({ className: "mt-2 w-full" })} href={checkoutHref}>
              Proceed to checkout
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <form action={requestQuotationAction}>
              <SubmitButton className="w-full" pendingText="Requesting quotation..." variant="secondary">
                <Calculator aria-hidden="true" className="h-4 w-4" />
                Request quotation
              </SubmitButton>
            </form>
          </aside>
        </div>
      )}
    </AdminPageSurface>
  );
}
