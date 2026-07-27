import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Check,
  ClipboardCheck,
  FileBarChart,
  FileCheck2,
  Landmark,
  LineChart,
  LockKeyhole,
  MessageSquareText,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { buttonClassName } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { serviceImageSource } from "@/features/services/presentation";
import { listServices } from "@/repositories/service-catalog-repository";

export const metadata: Metadata = {
  title: "Tax, Accounting and Financial Consulting | IFTA Consulting",
  description:
    "IFTA Consulting provides structured tax advisory, accounting support, financial reporting, financial analysis and business finance consulting services.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "IFTA Consulting | Tax and Financial Advisory",
    description:
      "Clear tax, accounting and finance advice for growing organisations.",
    type: "website",
    images: [
      {
        url: "/images/ifta-consulting-team.png",
        width: 1200,
        height: 630,
        alt: "IFTA Consulting advisers reviewing financial information",
      },
    ],
  },
};

export const dynamic = "force-dynamic";

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const heroPoints = [
  {
    id: "scope",
    value: "Clear",
    label: "Scope and deliverables",
  },
  {
    id: "collaboration",
    value: "Secure",
    label: "Document collaboration",
  },
  {
    id: "progress",
    value: "Visible",
    label: "Engagement progress",
  },
] as const;

const confidencePoints: readonly Feature[] = [
  {
    id: "defined-scope",
    icon: FileCheck2,
    title: "Defined scope",
    description:
      "Responsibilities, information requirements, deliverables and review points are agreed before substantive work begins.",
  },
  {
    id: "professional-review",
    icon: ShieldCheck,
    title: "Professional review",
    description:
      "Important work moves through an appropriate internal review process before it is released to the client.",
  },
  {
    id: "secure-collaboration",
    icon: LockKeyhole,
    title: "Secure collaboration",
    description:
      "Documents, approvals and communication remain connected to the correct client and financial engagement.",
  },
];

const clientTypes = [
  {
    id: "growing-businesses",
    icon: Building2,
    title: "Growing businesses",
    description:
      "Strengthen accounting, reporting and finance processes as the organisation becomes more complex.",
  },
  {
    id: "directors-and-founders",
    icon: BriefcaseBusiness,
    title: "Directors and founders",
    description:
      "Receive clearer financial analysis for planning, investment and important business decisions.",
  },
  {
    id: "finance-teams",
    icon: UsersRound,
    title: "Finance teams",
    description:
      "Add technical capacity, independent review and structured support during demanding reporting periods.",
  },
  {
    id: "established-organisations",
    icon: Landmark,
    title: "Established organisations",
    description:
      "Address specific tax, reporting, compliance and financial-management challenges through defined engagements.",
  },
] as const;

const homepageServiceIcons = [ScrollText, Calculator, BarChart3] as const;

const engagementSteps = [
  {
    id: "define",
    number: "01",
    title: "Define the requirement",
    description:
      "Tell us about the financial, tax or reporting issue, the decision involved and any important deadline.",
  },
  {
    id: "confirm",
    number: "02",
    title: "Confirm the engagement",
    description:
      "We clarify the scope, information requirements, responsibilities, fees and expected deliverables.",
  },
  {
    id: "collaborate",
    number: "03",
    title: "Collaborate securely",
    description:
      "Documents, questions, tasks, messages and approvals are managed through the relevant engagement workspace.",
  },
  {
    id: "complete",
    number: "04",
    title: "Receive the outcome",
    description:
      "Approved deliverables, financial records and completion information remain connected to the engagement.",
  },
] as const;

const outcomePoints = [
  {
    id: "reporting",
    icon: FileBarChart,
    title: "More useful reporting",
    description:
      "Financial information structured around the decisions management needs to make.",
  },
  {
    id: "visibility",
    icon: LineChart,
    title: "Better financial visibility",
    description:
      "Clearer understanding of performance, cash flow, risk and operational priorities.",
  },
  {
    id: "compliance",
    icon: ClipboardCheck,
    title: "Stronger compliance",
    description:
      "Defined responsibilities, supporting records and clearer follow-through on required actions.",
  },
  {
    id: "records",
    icon: ReceiptText,
    title: "Organised engagement records",
    description:
      "Documents, invoices, approvals and final outputs retained within the relevant engagement context.",
  },
] as const;

const portalFeatures = [
  "Role-based access",
  "Secure document exchange",
  "Document version history",
  "Engagement progress visibility",
  "Messages and action requests",
  "Invoice and payment records",
  "Approved deliverables",
  "Completed engagement archive",
] as const;

const faqs = [
  {
    id: "engagement-start",
    question: "When does a consulting engagement officially begin?",
    answer:
      "Submitting a request does not automatically begin professional work. The engagement normally starts after administrative review, completion of any required KYC, acceptance of the scope or engagement letter, and satisfaction of applicable payment conditions.",
  },
  {
    id: "custom-scope",
    question: "Can the engagement be customised?",
    answer:
      "Yes. The final scope should reflect the financial issue, available information, required deliverables, client responsibilities and relevant deadlines. Work outside the agreed scope may require a revised quotation or separate engagement.",
  },
  {
    id: "required-information",
    question: "What information will I need to provide?",
    answer:
      "The requirements depend on the service. They may include identification and business-registration records, accounting information, tax records, financial statements, invoices, transaction schedules, forecasts or other supporting documents.",
  },
  {
    id: "fees",
    question: "How are professional fees determined?",
    answer:
      "Fees depend on the scope, complexity, information available, expected deliverables, review requirements and timing. The applicable quotation or engagement documentation should explain the pricing basis before substantive work begins.",
  },
  {
    id: "portal-security",
    question: "How are financial documents protected?",
    answer:
      "Portal access is controlled through authenticated accounts, role-based permissions, engagement assignments and protected document workflows. Users are also responsible for protecting their credentials and active sessions.",
  },
  {
    id: "multiple-users",
    question: "Can several people from one organisation use the portal?",
    answer:
      "Yes, where appropriate. Individual users can be assigned access according to their role and involvement in the engagement. Access should be removed or updated when a person's authority or responsibilities change.",
  },
] as const;

export default async function PublicHomePage() {
  const catalogServices = await listServices({ publishedOnly: true });

  return (
    <main>
      
      <Reveal>
      <section className="relative isolate flex min-h-[100svh] overflow-hidden bg-brand-deep text-white">
  <Image
    alt="IFTA Consulting advisers reviewing financial information in a professional office"
    className="object-cover object-[68%_center] sm:object-center lg:object-[72%_center]"
    fill
    priority
    quality={90}
    sizes="100vw"
    src="/images/ifta-consulting-team.png"
  />

  {/* Mobile and tablet overlay */}
  <div className="absolute inset-0 bg-brand-deep/80 lg:hidden" />

  {/* Desktop directional overlay */}
  <div className="absolute inset-0 hidden bg-gradient-to-r from-brand-deep via-brand-deep/95 to-brand-deep/15 lg:block" />

  {/* Bottom contrast */}
  <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-brand-deep/70 to-transparent" />

  <div className="relative mx-auto flex min-h-[100svh] w-full max-w-7xl items-center px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
    <div className="w-full max-w-3xl">
      <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-mist">
        <span className="h-px w-9 bg-brand-mist" />
        IFTA Consulting (K) Ltd
      </p>

      <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
        Clear tax, accounting and finance advice for growing organisations.
      </h1>

      <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
        We help businesses strengthen tax compliance, financial reporting,
        management information and finance operations through clearly scoped,
        professionally managed engagements.
      </p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          className={buttonClassName({
            variant: "accent",
            size: "lg",
          })}
          href="/contact"
        >
          Request a consultation
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>

        <Link
          className={buttonClassName({
            className:
              "border-white/45 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white",
            variant: "ghost",
            size: "lg",
          })}
          href="/services"
        >
          Explore services
        </Link>
      </div>

      <div className="mt-12 grid max-w-2xl grid-cols-3 border-t border-white/20 pt-6 sm:mt-16">
        {heroPoints.map((point) => (
          <div
            className="border-l border-white/20 px-3 first:border-l-0 first:pl-0 sm:px-6"
            key={point.id}
          >
            <p className="text-lg font-bold text-brand-mist sm:text-xl">
              {point.value}
            </p>

            <p className="mt-1 text-xs leading-5 text-white/75">
              {point.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
</Reveal>

<Reveal delay={0.1}>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl divide-y divide-border px-5 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          {confidencePoints.map((item) => {
            const Icon = item.icon;

            return (
              <article
                className="py-8 md:px-8 md:first:pl-0 md:last:pr-0 lg:py-10"
                key={item.id}
              >
                <Icon
                  aria-hidden="true"
                  className="h-6 w-6 text-primary"
                />

                <h2 className="mt-4 text-base font-bold text-foreground">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      </Reveal>

      <Reveal delay={0.2}>


      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
          <div className="relative min-h-[420px] overflow-hidden rounded-xl bg-muted sm:min-h-[520px]">
            <Image
              alt="Business owner discussing financial plans with an IFTA Consulting adviser"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              src="/images/business-owner-consultation.jpg"
            />

            <div className="absolute inset-x-5 bottom-5 rounded-lg border border-white/20 bg-brand-deep/90 p-5 text-white backdrop-blur-sm sm:inset-x-8 sm:bottom-8">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-mist">
                Finance-led support
              </p>

              <p className="mt-2 text-sm leading-6 text-white/80">
                Every engagement begins with the business question, the
                available evidence and the decision that must follow.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Who we support
            </p>

            <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              Financial support shaped around your organisation.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              We work with organisations that need stronger financial
              information, clearer tax positions and dependable support for
              important business decisions.
            </p>

            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              {clientTypes.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
                    key={item.id}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-soft text-brand-deep">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>

                    <h3 className="mt-4 font-bold text-foreground">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      </Reveal>

      <Reveal delay={0.3}>


      <section className="border-y border-border bg-surface-subtle">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Financial consulting services
              </p>

              <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
                Practical support for tax, reporting and finance decisions.
              </h2>
            </div>

            <p className="max-w-lg text-base leading-7 text-muted-foreground">
              Select the area that best reflects your current challenge. We
              will confirm the scope, information requirements,
              responsibilities and expected deliverables before work begins.
            </p>
          </div>

          <div className="mt-12 grid gap-7 lg:grid-cols-3">
            {catalogServices.slice(0, 6).map((service, index) => {
              const Icon = homepageServiceIcons[index % homepageServiceIcons.length];

              return (
                <article
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  key={service.id}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <Image
                      alt={service.imageAlt}
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      src={serviceImageSource(service, index)}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/55 via-transparent to-transparent" />

                    <span className="absolute bottom-4 left-4 grid h-11 w-11 place-items-center rounded-md bg-white text-brand-deep shadow-lg">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground">
                      {service.title}
                    </h3>

                    <p className="mt-3 text-sm font-medium leading-6 text-foreground/80">
                      {service.summary}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {service.outcome}
                    </p>

                    <Link
                      className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
                      href={`/services#${service.slug}`}
                    >
                      Explore this service
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              className={buttonClassName({
                variant: "secondary",
                size: "lg",
              })}
              href="/services"
            >
              View all services
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      </Reveal>

      <Reveal delay={0.4}>

      <section className="bg-brand-soft text-brand-deep">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 md:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-20 lg:px-8 lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide">
              A clear engagement journey
            </p>

            <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              From the initial financial question to a completed engagement.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-brand-deep/75">
              Clients receive a visible process while the consulting team
              retains the evidence, review points and task detail required to
              deliver responsibly.
            </p>

            <ol className="mt-10 grid gap-7 sm:grid-cols-2">
              {engagementSteps.map((step) => (
                <li
                  className="border-t border-brand-deep/25 pt-5"
                  key={step.id}
                >
                  <span className="font-mono text-xs font-bold">
                    {step.number}
                  </span>

                  <h3 className="mt-2 font-bold">{step.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-brand-deep/75">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>

            <Link
              className={buttonClassName({
                className: "mt-9",
                variant: "secondary",
              })}
              href="/client-portal"
            >
              See how the portal works
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative min-h-[500px] overflow-hidden rounded-xl border border-brand-deep/10 shadow-xl">
            <Image
              alt="Finance consultants collaborating on an engagement review"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              src="/images/finance-team-collaboration.jpg"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/80 via-brand-deep/10 to-transparent" />

            <div className="absolute inset-x-6 bottom-6 rounded-lg border border-white/20 bg-white/95 p-5 text-foreground shadow-xl backdrop-blur-sm sm:inset-x-8 sm:bottom-8">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-deep">
                  <MessageSquareText
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>

                <div>
                  <p className="font-bold">
                    Questions remain connected to the work.
                  </p>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Requests, supporting documents, responses and approvals
                    remain within the relevant engagement record.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </Reveal>

      <Reveal delay={0.5}>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Finance outcomes
            </p>

            <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              Work designed to improve the quality of the next decision.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              A professional engagement should produce more than documents. It
              should help the organisation understand its position, act on the
              findings and maintain an appropriate record of what was decided.
            </p>

            <div className="mt-9 grid gap-6 sm:grid-cols-2">
              {outcomePoints.map((item) => {
                const Icon = item.icon;

                return (
                  <article className="flex gap-4" key={item.id}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-deep">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>

                    <div>
                      <h3 className="font-bold text-foreground">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="relative min-h-[420px] overflow-hidden rounded-xl bg-muted sm:translate-y-8">
              <Image
                alt="Professional reviewing business financial reports"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 24vw, 50vw"
                src="/images/financial-report-review.jpg"
              />
            </div>

            <div className="relative min-h-[420px] overflow-hidden rounded-xl bg-muted">
              <Image
                alt="Business advisers discussing financial performance"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 24vw, 50vw"
                src="/images/financial-advisory-meeting.jpg"
              />
            </div>
          </div>
        </div>
      </section>

      </Reveal>

      <Reveal delay={0.6}>


      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20 lg:px-8 lg:py-24">
          <div className="relative min-h-[500px] overflow-hidden rounded-xl border border-border bg-muted shadow-xl">
            <Image
              alt="Secure client portal displayed on a laptop during a financial consulting engagement"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              src="/images/secure-client-portal.jpg"
            />

            <div className="absolute inset-0 bg-brand-deep/25" />

            <div className="absolute inset-x-5 bottom-5 overflow-hidden rounded-lg border border-white/25 bg-card/95 shadow-2xl backdrop-blur-md sm:inset-x-8 sm:bottom-8">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Financial reporting engagement
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Client progress view
                  </p>
                </div>

                <span className="ifta-badge-success rounded-full border px-2.5 py-1 text-xs font-semibold">
                  Active
                </span>
              </div>

              <div className="px-5 py-5">
                <div
                  aria-label="Engagement progress"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={62}
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                >
                  <div className="h-full w-[62%] rounded-full bg-primary" />
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  62% of engagement stages completed
                </p>

                <div className="mt-5 divide-y divide-border">
                  {[
                    {
                      id: "kyc",
                      title: "KYC review completed",
                      status: "Done",
                    },
                    {
                      id: "letter",
                      title: "Engagement letter accepted",
                      status: "Done",
                    },
                    {
                      id: "documents",
                      title: "Financial documents under review",
                      status: "Open",
                    },
                    {
                      id: "review",
                      title: "Professional review pending",
                      status: "Open",
                    },
                  ].map((item, index) => (
                    <div
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      key={item.id}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-soft font-mono text-[10px] font-bold text-brand-deep">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="truncate text-sm font-medium text-foreground">
                          {item.title}
                        </span>
                      </div>

                      <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Secure client workspace
            </p>

            <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              One place for the documents, decisions and communication that
              matter.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              The client portal keeps onboarding, KYC, engagement letters,
              messages, invoices, financial documents and final records
              connected to the correct engagement.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {portalFeatures.map((item) => (
                <p
                  className="flex items-center gap-3 text-sm font-semibold text-foreground"
                  key={item}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-deep">
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>

                  {item}
                </p>
              ))}
            </div>

            <Link
              className={buttonClassName({
                className: "mt-9",
                size: "lg",
              })}
              href="/client-portal"
            >
              Explore the client portal
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      </Reveal>

      <Reveal delay={0.7}>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Frequently asked questions
            </p>

            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              What to know before requesting an engagement.
            </h2>

            <p className="mt-5 text-base leading-7 text-muted-foreground">
              The answers below explain the general process. The final scope,
              fees and responsibilities will be confirmed for the specific
              engagement.
            </p>

            <Link
              className={buttonClassName({
                className: "mt-7",
                variant: "secondary",
              })}
              href="/contact"
            >
              Ask a different question
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-border border-y border-border">
            {faqs.map((faq) => (
              <details className="group py-5" key={faq.id}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>

                  <span
                    aria-hidden="true"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-lg font-normal transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>

                <p className="max-w-3xl pt-4 text-sm leading-7 text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      </Reveal>

      <Reveal delay={0.8}>

      <section className="relative isolate overflow-hidden bg-brand-deep text-white">
        <Image
          alt=""
          aria-hidden="true"
          className="object-cover opacity-25"
          fill
          sizes="100vw"
          src="/images/financial-consultation-cta.jpg"
        />

        <div className="absolute inset-0 bg-brand-deep/80" />

        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-9 px-5 py-16 sm:px-6 md:flex-row md:items-center md:py-20 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-mist">
              Start a conversation
            </p>

            <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Bring us the financial question behind the decision.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
              Tell us what you are working through, the decision involved and
              any important deadline. We will help determine the appropriate
              engagement.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              className={buttonClassName({
                variant: "accent",
                size: "lg",
              })}
              href="/contact"
            >
              Request a consultation
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>

            <Link
              className={buttonClassName({
                className:
                  "border-white/40 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white",
                variant: "ghost",
                size: "lg",
              })}
              href="/services"
            >
              Review services
            </Link>
          </div>
        </div>
      </section>
      </Reveal>
    </main>
  );
}