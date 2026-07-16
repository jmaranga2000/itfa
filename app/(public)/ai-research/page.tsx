import Link from "next/link";
import { ArrowRight, BookOpenCheck, Bot, FileSearch, ShieldCheck, UserCheck } from "lucide-react";
import { PublicPageIntro } from "@/components/public/public-page-intro";
import { buttonClassName } from "@/components/ui/button";
import { researchFeatures } from "@/content/public-site";

const featureIcons = [FileSearch, BookOpenCheck, UserCheck, ShieldCheck] as const;

export default function AiResearchPage() {
  return (
    <main>
      <PublicPageIntro
        aside={
          <div>
            <p className="font-semibold text-brand-mist">Human review remains mandatory</p>
            <p className="mt-2">AI-assisted material is working analysis until an authorized professional reviews and approves it.</p>
          </div>
        }
        description="A governed research workspace can help assigned professionals explore questions, organize sources and prepare internal analysis without weakening review responsibility."
        eyebrow="AI-assisted research"
        title="Faster exploration, with professional judgement still in control."
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:py-16 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-16">
        <div>
          <span className="grid h-12 w-12 place-items-center rounded-md bg-brand-soft text-brand-deep">
            <Bot aria-hidden="true" className="h-6 w-6" />
          </span>
          <p className="mt-5 text-xs font-bold uppercase text-primary">Designed for advisory work</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground">Research support inside the engagement boundary.</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            The goal is not autonomous advice. It is a controlled workspace that helps assigned staff investigate, structure and review complex material more efficiently.
          </p>
          <Link className={buttonClassName({ className: "mt-7" })} href="/contact">
            Discuss AI-assisted advisory
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {researchFeatures.map((feature, index) => {
            const Icon = featureIcons[index];
            return (
              <article className="grid gap-4 py-6 sm:grid-cols-[44px_minmax(0,1fr)]" key={feature.title}>
                <span className="grid h-10 w-10 place-items-center rounded-md bg-muted text-primary">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-14 md:py-16">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase text-primary">Governance model</p>
              <h2 className="mt-3 text-3xl font-bold text-foreground">Four controls before client use.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              AI support is useful only when permissions, sources, professional review and final publication remain visible.
            </p>
          </div>
          <ol className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Permission", "Only assigned roles can open the research workspace."],
              ["Context", "The question and evidence stay linked to the engagement."],
              ["Review", "A professional validates assumptions, sources and conclusions."],
              ["Approval", "Only approved summaries become client-visible outputs."],
            ].map(([title, copy], index) => (
              <li className="border-t-2 border-primary pt-4" key={title}>
                <span className="font-mono text-xs font-bold text-muted-foreground">0{index + 1}</span>
                <h3 className="mt-3 font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-14 text-center md:py-16">
        <p className="text-xs font-bold uppercase text-primary">Important boundary</p>
        <h2 className="mt-3 text-2xl font-bold text-foreground">AI output is not an engagement deliverable by default.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Professional advice is issued only through the approved engagement process, with the responsible reviewer and scope identified.
        </p>
      </section>
    </main>
  );
}
