import Link from "next/link";
import { Save } from "lucide-react";
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
    <form action={action}>
      {service ? <input name="serviceId" type="hidden" value={service.id} /> : null}

      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
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
              Control when this service appears on the public website.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select defaultValue={service?.status ?? "draft"} id="status" name="status">
              <option value="draft">Draft - admin only</option>
              <option value="published">Published - visible publicly</option>
              <option value="archived">Archived - hidden publicly</option>
            </Select>
          </div>

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
