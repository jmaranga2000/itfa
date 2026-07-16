import Link from "next/link";
import { ArrowRight, BarChart3, Check, Scale, ScrollText } from "lucide-react";
import { PublicPageIntro } from "@/components/public/public-page-intro";
import { buttonClassName } from "@/components/ui/button";
import { workflowSteps } from "@/content/public-site";
import { listServices } from "@/repositories/service-catalog-repository";

const serviceIcons = [ScrollText, Scale, BarChart3] as const;

export default async function ServicesPage() {
  const services = await listServices({ publishedOnly: true });

  return (
    <main>
      <PublicPageIntro
        aside={
          <div>
            <p className="font-semibold text-brand-mist">Three connected disciplines</p>
            <p className="mt-2">Engagements can remain focused or combine expertise where the issue crosses tax, legal and finance boundaries.</p>
          </div>
        }
        description="Choose the professional question you need resolved. We define the evidence, review depth, deliverables and workflow around that decision."
        eyebrow="Advisory services"
        title="Structured expertise for complex compliance and business decisions."
      />

      <section className="mx-auto max-w-7xl px-5 py-12 md:py-16">
        <div className="divide-y divide-border border-y border-border">
          {services.map((service, index) => {
            const Icon = serviceIcons[index % serviceIcons.length];
            return (
              <article className="scroll-mt-32 py-10" id={service.slug} key={service.id}>
                <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:gap-12">
                  <div>
                    <span className="grid h-12 w-12 place-items-center rounded-md bg-brand-soft text-brand-deep">
                      <Icon aria-hidden="true" className="h-6 w-6" />
                    </span>
                    <p className="mt-4 font-mono text-xs font-bold text-muted-foreground">
                      SERVICE {String(index + 1).padStart(2, "0")}
                    </p>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-foreground md:text-3xl">{service.title}</h2>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{service.summary}</p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {service.inclusions.map((item) => (
                        <p className="flex items-start gap-2 text-sm font-semibold text-foreground" key={item}>
                          <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {item}
                        </p>
                      ))}
                    </div>

                    <div className="mt-7 grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase text-muted-foreground">Best for</p>
                        <p className="mt-2 text-sm leading-6 text-foreground">{service.bestFor}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-muted-foreground">Expected outcome</p>
                        <p className="mt-2 text-sm leading-6 text-foreground">{service.outcome}</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:border-l lg:border-border lg:pl-8">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Start with an enquiry. Sensitive evidence is requested only after a protected workspace is available.
                    </p>
                    <Link className={buttonClassName({ className: "mt-5 w-full" })} href="/contact">
                      Discuss this service
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                    <Link className={buttonClassName({ className: "mt-2 w-full", variant: "secondary" })} href="/client">
                      Start in the portal
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-brand-soft text-brand-deep">
        <div className="mx-auto max-w-7xl px-5 py-14 md:py-16">
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-14">
            <div>
              <p className="text-xs font-bold uppercase">Engagement journey</p>
              <h2 className="mt-3 text-3xl font-bold">A clear path from request to record.</h2>
              <p className="mt-4 text-sm leading-6 text-brand-deep/75">
                The workflow creates visible handoffs without exposing internal review detail to the wrong audience.
              </p>
            </div>
            <ol className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-4">
              {workflowSteps.map((step, index) => (
                <li className="border-t border-brand-deep/25 pt-3" key={step}>
                  <span className="font-mono text-xs font-bold">{String(index + 1).padStart(2, "0")}</span>
                  <p className="mt-2 text-sm font-semibold leading-5">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
