import Link from "next/link";
import { ArrowRight, Check, Clock3, FileSearch, Gauge, Layers3 } from "lucide-react";
import { PublicPageIntro } from "@/components/public/public-page-intro";
import { buttonClassName } from "@/components/ui/button";
import { listPricingPlans } from "@/repositories/service-catalog-repository";

const feeFactors = [
  { icon: FileSearch, label: "Review depth", copy: "The volume and complexity of evidence that must be assessed." },
  { icon: Clock3, label: "Timeline", copy: "The urgency, external deadlines and review availability required." },
  { icon: Gauge, label: "Risk", copy: "The regulatory, financial or legal consequence of the decision." },
  { icon: Layers3, label: "Delivery model", copy: "A focused opinion, managed engagement or recurring advisory workspace." },
] as const;

export default async function PricingPage() {
  const pricingOptions = await listPricingPlans({ publishedOnly: true });

  return (
    <main>
      <PublicPageIntro
        aside={<p>Every fee is confirmed through a quotation or engagement letter before chargeable work begins.</p>}
        description="Fees reflect scope, urgency, professional risk and the level of evidence required. We use the simplest engagement model that can responsibly answer the question."
        eyebrow="Pricing approach"
        title="Transparent scope before professional work begins."
      />

      <section className="mx-auto max-w-7xl px-5 py-12 md:py-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {pricingOptions.map((option) => (
            <article
              className={
                option.featured
                  ? "relative rounded-md border border-primary bg-brand-deep p-6 text-white shadow-xl"
                  : "rounded-md border border-border bg-card p-6 text-card-foreground shadow-sm"
              }
              key={option.id}
            >
              {option.featured ? (
                <span className="absolute right-5 top-5 rounded-full bg-brand-mist px-2.5 py-1 text-xs font-bold text-brand-deep">
                  Most flexible
                </span>
              ) : null}
              <p className={option.featured ? "text-xs font-bold uppercase text-brand-mist" : "text-xs font-bold uppercase text-muted-foreground"}>
                {option.cadence}
              </p>
              <h2 className="mt-5 text-xl font-bold">{option.name}</h2>
              <p className="mt-3 text-3xl font-bold">{option.priceLabel}</p>
              <p className={option.featured ? "mt-4 min-h-20 text-sm leading-6 text-white/70" : "mt-4 min-h-20 text-sm leading-6 text-muted-foreground"}>
                {option.description}
              </p>
              <div className={option.featured ? "mt-6 grid gap-3 border-t border-white/15 pt-5" : "mt-6 grid gap-3 border-t border-border pt-5"}>
                {option.features.map((feature) => (
                  <p className="flex items-center gap-2 text-sm font-semibold" key={feature}>
                    <Check aria-hidden="true" className={option.featured ? "h-4 w-4 text-brand-mist" : "h-4 w-4 text-primary"} />
                    {feature}
                  </p>
                ))}
              </div>
              <Link
                className={buttonClassName({
                  className: option.featured ? "mt-7 w-full" : "mt-7 w-full",
                  variant: option.featured ? "accent" : "primary",
                })}
                href="/contact"
              >
                Discuss scope
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase text-primary">What shapes the fee</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground">Pricing follows the work required.</h2>
          </div>
          <div className="mt-9 grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
            {feeFactors.map((factor) => {
              const Icon = factor.icon;
              return (
                <div className="py-6 md:px-6 md:first:pl-0 md:last:pr-0" key={factor.label}>
                  <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 font-bold text-foreground">{factor.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{factor.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-14 md:py-16">
        <p className="text-xs font-bold uppercase text-primary">Common questions</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Before you request a quotation.</h2>
        <div className="mt-7 divide-y divide-border border-y border-border">
          {[
            ["Can I receive a fixed fee?", "Yes. Focused work can be quoted as a fixed fee when the question, evidence and deliverable are sufficiently defined."],
            ["When is payment required?", "Payment timing is stated in the approved quotation or engagement letter and may vary by engagement model."],
            ["Can the scope change?", "Yes. Material changes are documented and agreed before they alter the fee, timeline or professional responsibility."],
          ].map(([question, answer]) => (
            <details className="group py-5" key={question}>
              <summary className="flex list-none items-center justify-between gap-4 font-bold text-foreground">
                {question}
                <span className="text-xl font-normal text-primary group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
