import { PublicPageIntro } from "@/components/public/public-page-intro";

type LegalSection = {
  body: readonly string[];
  title: string;
};

type LegalDocumentProps = {
  description: string;
  eyebrow: string;
  sections: readonly LegalSection[];
  title: string;
};

export function LegalDocument({ description, eyebrow, sections, title }: LegalDocumentProps) {
  return (
    <main>
      <PublicPageIntro
        aside={
          <p>
            This page explains the operating terms for IFTA Consulting&apos;s public website and secure portal services.
          </p>
        }
        description={description}
        eyebrow={eyebrow}
        title={title}
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[240px_minmax(0,760px)] lg:justify-between">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <p className="text-xs font-bold uppercase text-muted-foreground">On this page</p>
          <nav className="mt-4 grid gap-1 border-l border-border" aria-label={`${title} sections`}>
            {sections.map((section, index) => (
              <a
                className="-ml-px border-l border-transparent px-4 py-2 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-foreground"
                href={`#section-${index + 1}`}
                key={section.title}
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <article className="divide-y divide-border">
          {sections.map((section, index) => (
            <section className="scroll-mt-32 py-8 first:pt-0" id={`section-${index + 1}`} key={section.title}>
              <p className="font-mono text-xs font-semibold text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">{section.title}</h2>
              <div className="mt-4 grid gap-4 text-sm leading-7 text-muted-foreground md:text-base">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
