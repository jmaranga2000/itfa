import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  Check,
  FileCheck2,
  LockKeyhole,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { services, workflowSteps } from "@/content/public-site";

const serviceIcons = [ScrollText, Calculator, BarChart3] as const;

const confidencePoints = [
  {
    icon: FileCheck2,
    title: "Defined scope",
    description: "Clear deliverables, responsibilities and review points before work begins.",
  },
  {
    icon: ShieldCheck,
    title: "Controlled workflow",
    description: "KYC, documents, approvals and communication managed in one engagement record.",
  },
  {
    icon: LockKeyhole,
    title: "Secure collaboration",
    description: "Client and internal work stay separated through role-based portal access.",
  },
] as const;

export default function PublicHomePage() {
  return (
    <main>
      <section className="relative isolate min-h-[580px] overflow-hidden bg-brand-deep text-white sm:min-h-[620px]">
        <Image
          alt="IFTA Consulting advisers reviewing financial documents in a Nairobi office"
          className="object-cover object-[62%_center]"
          fill
          priority
          sizes="100vw"
          src="/images/ifta-consulting-team.png"
        />
        <div className="absolute inset-0 bg-brand-deep/80 lg:hidden" />
        <div className="absolute inset-y-0 left-0 hidden w-[58%] bg-brand-deep/95 lg:block" />

        <div className="relative mx-auto flex min-h-[580px] max-w-7xl flex-col justify-center px-5 py-14 sm:min-h-[620px] lg:py-16">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-brand-mist">
              <span className="h-px w-8 bg-brand-mist" />
              IFTA Consulting (K) Ltd
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Tax and financial advisory for confident business decisions.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              We turn tax, reporting, compliance and finance challenges into clear professional engagements with accountable next steps.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={buttonClassName({ variant: "accent", size: "lg" })} href="/contact">
                Request a consultation
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                className={buttonClassName({
                  className: "border-white/45 bg-transparent text-white hover:bg-white/10",
                  variant: "ghost",
                  size: "lg",
                })}
                href="/services"
              >
                Explore services
              </Link>
            </div>
          </div>

          <div className="mt-12 grid max-w-2xl grid-cols-3 border-t border-white/20 pt-5">
            {[
              ["3", "Advisory disciplines"],
              ["8", "Workflow stages"],
              ["1", "Secure client workspace"],
            ].map(([value, label]) => (
              <div className="border-l border-white/20 px-3 first:border-l-0 first:pl-0 sm:px-5" key={label}>
                <p className="text-xl font-bold text-brand-mist sm:text-2xl">{value}</p>
                <p className="mt-1 text-xs leading-4 text-white/65">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl divide-y divide-border px-5 md:grid-cols-3 md:divide-x md:divide-y-0">
          {confidencePoints.map((item) => {
            const Icon = item.icon;
            return (
              <div className="py-8 md:px-7 md:first:pl-0 md:last:pr-0" key={item.title}>
                <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-base font-bold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase text-primary">Core expertise</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Advice built around the decision in front of you.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Each service starts with the question, evidence and timeline. The engagement structure follows from there.
            </p>
            <Link className={buttonClassName({ className: "mt-6", variant: "secondary" })} href="/services">
              View all services
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-border border-y border-border">
            {services.map((service, index) => {
              const Icon = serviceIcons[index];
              return (
                <article className="grid gap-5 py-7 sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-start" key={service.id}>
                  <span className="grid h-11 w-11 place-items-center rounded-md bg-brand-soft text-brand-deep">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{service.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{service.summary}</p>
                  </div>
                  <Link
                    aria-label={`Explore ${service.title}`}
                    className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary hover:border-primary hover:bg-brand-soft"
                    href={service.href}
                  >
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-brand-soft text-brand-deep">
        <div className="mx-auto max-w-7xl px-5 py-16 md:py-20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase">A visible operating model</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
                From initial question to completed engagement.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-brand-deep/75">
              Clients see clear progress while IFTA teams retain the approvals, evidence and task detail needed to deliver responsibly.
            </p>
          </div>

          <ol className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <li className="border-t border-brand-deep/25 pt-4" key={step}>
                <span className="font-mono text-xs font-bold">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-2 text-sm font-semibold leading-5">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.85fr)] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase text-primary">A workspace after approval</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-foreground md:text-4xl">
            One place for the documents, decisions and communication that matter.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            The client portal keeps onboarding, KYC, engagement letters, messages, invoices and final records connected to the right engagement.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {["Role-based access", "Document history", "Progress visibility", "Invoice records"].map((item) => (
              <p className="flex items-center gap-3 text-sm font-semibold text-foreground" key={item}>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-soft text-brand-deep">
                  <Check aria-hidden="true" className="h-3.5 w-3.5" />
                </span>
                {item}
              </p>
            ))}
          </div>
          <Link className={buttonClassName({ className: "mt-8" })} href="/client-portal">
            See how the portal works
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-md border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border bg-surface-subtle px-5 py-4">
            <div>
              <p className="text-sm font-bold text-foreground">Engagement workspace</p>
              <p className="text-xs text-muted-foreground">Client progress view</p>
            </div>
            <span className="ifta-badge-success rounded-full border px-2.5 py-1 text-xs font-semibold">Active</span>
          </div>
          <div className="px-5 py-5">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[62%] rounded-full bg-primary" />
            </div>
            <div className="mt-6 divide-y divide-border">
              {["KYC review completed", "Engagement letter accepted", "Document review in progress", "Advisory response pending"].map(
                (item, index) => (
                  <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0" key={item}>
                    <div className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-soft font-mono text-[10px] font-bold text-brand-deep">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-medium text-foreground">{item}</span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{index < 2 ? "Done" : "Open"}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
