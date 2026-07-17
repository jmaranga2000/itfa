import Link from "next/link";
import { Save } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  PricingPlanRecord,
  ServiceCatalogRecord,
} from "@/repositories/service-catalog-repository";

export function PricingPlanForm({
  action,
  plan,
  services,
  selectedServiceId,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  plan?: PricingPlanRecord;
  services: ServiceCatalogRecord[];
  selectedServiceId?: string;
  submitLabel: string;
}) {
  const setupService = selectedServiceId
    ? services.find((service) => service.id === selectedServiceId)
    : null;

  return (
    <form action={action}>
      {plan ? <input name="planId" type="hidden" value={plan.id} /> : null}
      {setupService ? <input name="returnToServiceId" type="hidden" value={setupService.id} /> : null}

      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6">
          <section className="grid gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Pricing information</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use client-friendly wording that explains the fee approach.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Pricing option name</Label>
                <Input
                  defaultValue={plan?.name}
                  id="name"
                  maxLength={160}
                  name="name"
                  placeholder="Managed engagement"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priceLabel">Price shown to clients</Label>
                <Input
                  defaultValue={plan?.priceLabel}
                  id="priceLabel"
                  maxLength={120}
                  name="priceLabel"
                  placeholder="From KES 15,000"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cadence">Billing or scope note</Label>
                <Input
                  defaultValue={plan?.cadence}
                  id="cadence"
                  maxLength={160}
                  name="cadence"
                  placeholder="Per engagement request"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Page reference</Label>
                <Input
                  defaultValue={plan?.slug}
                  id="slug"
                  maxLength={80}
                  name="slug"
                  placeholder="Created from the option name"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                defaultValue={plan?.description}
                id="description"
                maxLength={1200}
                name="description"
                placeholder="Explain when this pricing option is appropriate."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="features">What is included</Label>
              <Textarea
                defaultValue={plan?.features.join("\n")}
                id="features"
                name="features"
                placeholder={"Defined question and deliverable\nNamed reviewer\nWritten recommendation"}
              />
              <p className="text-xs text-muted-foreground">Enter one item per line.</p>
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-5 rounded-md border border-border bg-muted/20 p-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Publishing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Link the price to a service and control its public visibility.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="serviceId">Related service</Label>
            <Select
              defaultValue={plan?.serviceId ?? setupService?.id ?? ""}
              id="serviceId"
              name="serviceId"
              required={Boolean(setupService)}
            >
              <option value="">All services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              defaultValue={plan?.status ?? (setupService ? "published" : "draft")}
              id="status"
              name="status"
            >
              <option value="draft">Draft - admin only</option>
              <option value="published">Published - visible publicly</option>
              <option value="archived">Archived - hidden publicly</option>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="displayOrder">Display order</Label>
            <Input
              defaultValue={plan?.displayOrder ?? 0}
              id="displayOrder"
              max={999}
              min={0}
              name="displayOrder"
              type="number"
            />
          </div>

          <label className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
            <input
              className="mt-1 h-4 w-4 accent-primary"
              defaultChecked={plan?.featured}
              name="featured"
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">Featured option</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                Give this option stronger emphasis on the public pricing page.
              </span>
            </span>
          </label>
        </aside>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 p-4 sm:flex-row sm:justify-end">
        <Link
          className={buttonClassName({ className: "w-full sm:w-auto", variant: "secondary" })}
          href="/admin/pricing"
        >
          Cancel
        </Link>
        <SubmitButton
          className="w-full sm:w-auto"
          pendingText="Saving pricing option..."
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
