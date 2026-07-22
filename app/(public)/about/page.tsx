import { Eye, FileCheck2, Handshake, ShieldCheck } from "lucide-react";
import { PublicPageIntro } from "@/components/public/public-page-intro";

const principles = [
  {
    icon: Eye,
    title: "Clarity before activity",
    copy: "We define the question, evidence, responsibility and expected output before the engagement gathers momentum.",
  },
  {
    icon: ShieldCheck,
    title: "Control around sensitive work",
    copy: "Access, approvals, client communication and document handling follow the context of the engagement.",
  },
  {
    icon: Handshake,
    title: "Advice people can act on",
    copy: "Professional analysis is translated into decisions, owners and next steps that clients can use.",
  },
] as const;

export default function AboutPage() {
  return (
    <main>
      <PublicPageIntro
        aside={<p>IFTA combines professional judgement with a digital operating model designed for accountable client service.</p>}
        description="IFTA Consulting (K) Ltd supports organizations navigating tax, reporting, compliance and finance matters with disciplined analysis and secure collaboration."
        eyebrow="About IFTA Consulting"
        title="Professional judgement, organized around the client decision."
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:py-18 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
        <div>
          <p className="text-xs font-bold uppercase text-primary">Our purpose</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-foreground md:text-4xl">
            Make complex advisory work easier to understand, govern and complete.
          </h2>
          <div className="mt-6 grid gap-5 text-base leading-7 text-muted-foreground">
            <p>
              Professional-services work often becomes difficult to manage when evidence, decisions, communication and deadlines sit in different places. IFTA brings those parts together around a clearly scoped engagement.
            </p>
            <p>
              Clients receive a simple view of progress and required action. Assigned teams retain the detailed review trail, permissions and operating context needed to deliver responsibly.
            </p>
          </div>
        </div>

        <div className="border-l border-border pl-7">
          <FileCheck2 aria-hidden="true" className="h-7 w-7 text-primary" />
          <dl className="mt-6 divide-y divide-border">
            {[
              ["Primary disciplines", "Tax and financial consulting"],
              ["Operating base", "Nairobi, Kenya"],
              ["Delivery model", "Scoped and managed engagements"],
              ["Client access", "Secure role-based portal"],
            ].map(([term, detail]) => (
              <div className="py-4 first:pt-0" key={term}>
                <dt className="text-xs font-bold uppercase text-muted-foreground">{term}</dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-14 md:py-16">
          <p className="text-xs font-bold uppercase text-primary">Working principles</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">How we approach the work.</h2>
          <div className="mt-9 grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {principles.map((principle) => {
              const Icon = principle.icon;
              return (
                <article className="py-7 md:px-8 md:first:pl-0 md:last:pr-0" key={principle.title}>
                  <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 text-lg font-bold text-foreground">{principle.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{principle.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase text-primary">Our standard</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground">A visible chain of responsibility.</h2>
          </div>
          <ol className="grid gap-6 sm:grid-cols-2">
            {[
              "Confirm the decision and engagement boundary.",
              "Gather evidence through the appropriate secure channel.",
              "Assign review, approvals and client actions clearly.",
              "Deliver the advice with an accountable record of completion.",
            ].map((step, index) => (
              <li className="border-t border-border pt-4" key={step}>
                <span className="font-mono text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
