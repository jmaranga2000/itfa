import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Save, Upload } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceCatalogRecord } from "@/repositories/service-catalog-repository";

export function ServiceCatalogForm({
  action,
  service,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  service?: ServiceCatalogRecord;
  submitLabel: string;
}) {
  return (
    <form action={action} encType="multipart/form-data">
      {service ? <input name="serviceId" type="hidden" value={service.id} /> : null}

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6">
          <section className="grid gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Service information</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Give the service a clear name and a short public explanation.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="title">Service name</Label>
                <Input
                  defaultValue={service?.title}
                  id="title"
                  maxLength={160}
                  name="title"
                  placeholder="Tax advisory and compliance"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Page reference</Label>
                <Input
                  defaultValue={service?.slug}
                  id="slug"
                  maxLength={80}
                  name="slug"
                  placeholder="Created from the service name"
                />
                <p className="text-xs text-muted-foreground">
                  Used in public page links. Leave blank to create it automatically.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                className="min-h-28"
                defaultValue={service?.summary}
                id="summary"
                maxLength={1200}
                name="summary"
                placeholder="Explain what the service helps clients achieve."
                required
              />
            </div>
          </section>

          <section className="grid gap-4 border-t border-border pt-6">
            <div>
              <h2 className="text-base font-bold text-foreground">Service image</h2>
              <p className="mt-1 text-sm text-muted-foreground">Add a clear image that represents the service on the website and client portal.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted/30">
                {service?.imageUrl ? (
                  <Image alt={service.imageAlt} className="object-cover" fill sizes="220px" src={service.imageUrl} />
                ) : (
                  <div className="grid h-full place-items-center text-center text-muted-foreground"><div><ImageIcon aria-hidden="true" className="mx-auto h-7 w-7" /><p className="mt-2 text-xs font-semibold">No image uploaded</p></div></div>
                )}
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="serviceImage">Upload image</Label>
                  <Input accept="image/jpeg,image/png,image/webp" id="serviceImage" name="serviceImage" type="file" />
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><Upload aria-hidden="true" className="h-3.5 w-3.5" />JPG, PNG or WebP, up to 8 MB. Uploading a new image replaces the current one.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imageAlt">Image description</Label>
                  <Input defaultValue={service?.imageAlt} id="imageAlt" maxLength={180} name="imageAlt" placeholder="Consultant reviewing financial reports with a client" />
                  <p className="text-xs text-muted-foreground">Describe the image briefly for people using screen readers.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 border-t border-border pt-6">
            <div>
              <h2 className="text-base font-bold text-foreground">What clients will see</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These details appear on the public services page.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="inclusions">What is included</Label>
              <Textarea
                defaultValue={service?.inclusions.join("\n")}
                id="inclusions"
                name="inclusions"
                placeholder={"Assessment review\nCompliance calendar\nAdvisory response pack"}
              />
              <p className="text-xs text-muted-foreground">Enter one item per line.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="bestFor">Best for</Label>
                <Textarea
                  defaultValue={service?.bestFor}
                  id="bestFor"
                  maxLength={800}
                  name="bestFor"
                  placeholder="Describe the clients or situations this service suits."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="outcome">Expected outcome</Label>
                <Textarea
                  defaultValue={service?.outcome}
                  id="outcome"
                  maxLength={800}
                  name="outcome"
                  placeholder="Describe the result the client should expect."
                  required
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-5 rounded-md border border-border bg-muted/20 p-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Publishing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {service
                ? "Control when this service appears on the public website."
                : "The service starts as a draft. You will add its price next."}
            </p>
          </div>

          {service ? (
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={service.status} id="status" name="status">
                <option value="draft">Draft - admin only</option>
                <option value="published">Published - visible publicly</option>
                <option value="archived">Archived - hidden publicly</option>
              </Select>
              <p className="text-xs leading-5 text-muted-foreground">
                A published price linked to this service is required before it can go live.
              </p>
            </div>
          ) : (
            <>
              <input name="status" type="hidden" value="draft" />
              <div className="rounded-md border border-primary/25 bg-brand-soft p-3 text-sm leading-6 text-foreground">
                Step 1 of 2: save the service details. The pricing form opens next.
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="displayOrder">Display order</Label>
            <Input
              defaultValue={service?.displayOrder ?? 0}
              id="displayOrder"
              max={999}
              min={0}
              name="displayOrder"
              type="number"
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first on the public page.
            </p>
          </div>
        </aside>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 p-4 sm:flex-row sm:justify-end">
        <Link
          className={buttonClassName({ className: "w-full sm:w-auto", variant: "secondary" })}
          href="/admin/services"
        >
          Cancel
        </Link>
        <SubmitButton
          className="w-full sm:w-auto"
          pendingText="Saving service..."
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
