"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Clock3 } from "lucide-react";

import { PublicPageIntro } from "@/components/public/public-page-intro";
import { cn } from "@/lib/utils";

type LegalSection = {
  id: string;
  title: string;
  body: readonly string[];
  bullets?: readonly string[];
};

type LegalDocumentProps = {
  description: string;
  eyebrow: string;
  sections: readonly LegalSection[];
  title: string;
  effectiveDate?: string;
  lastUpdated?: string;
  aside?: string;
};

export function LegalDocument({
  description,
  eyebrow,
  sections,
  title,
  effectiveDate,
  lastUpdated,
  aside = "This page explains the policies and operating terms that apply to IFTA Consulting’s public website and secure client portal.",
}: LegalDocumentProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  const sectionIds = useMemo(
    () => sections.map((section) => section.id),
    [sections],
  );

  useEffect(() => {
    if (!sectionIds.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              first.boundingClientRect.top - second.boundingClientRect.top,
          );

        const firstVisibleSection = visibleEntries[0];

        if (firstVisibleSection?.target.id) {
          setActiveSection(firstVisibleSection.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    sectionIds.forEach((id) => {
      const section = document.getElementById(id);

      if (section) {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  function handleSectionNavigation(sectionId: string) {
    setActiveSection(sectionId);
    setMobileNavigationOpen(false);
  }

  return (
    <main>
      <PublicPageIntro
        aside={<p>{aside}</p>}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />

      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8">
          {effectiveDate ? (
            <div className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              <span>
                Effective date:{" "}
                <time dateTime={effectiveDate}>
                  {formatLegalDate(effectiveDate)}
                </time>
              </span>
            </div>
          ) : null}

          {lastUpdated ? (
            <div className="flex items-center gap-2">
              <Clock3 aria-hidden="true" className="h-4 w-4" />
              <span>
                Last updated:{" "}
                <time dateTime={lastUpdated}>
                  {formatLegalDate(lastUpdated)}
                </time>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 lg:hidden">
          <button
            type="button"
            aria-expanded={mobileNavigationOpen}
            aria-controls="legal-mobile-navigation"
            onClick={() => setMobileNavigationOpen((current) => !current)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>On this page</span>

            <ChevronDown
              aria-hidden="true"
              className={cn(
                "h-4 w-4 transition-transform",
                mobileNavigationOpen && "rotate-180",
              )}
            />
          </button>

          {mobileNavigationOpen ? (
            <nav
              id="legal-mobile-navigation"
              aria-label={`${title} mobile sections`}
              className="mt-2 rounded-lg border border-border bg-background p-2 shadow-sm"
            >
              <ul className="grid gap-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      onClick={() => handleSectionNavigation(section.id)}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm transition-colors",
                        activeSection === section.id
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>

        <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,780px)] lg:justify-between">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                On this page
              </p>

              <nav
                aria-label={`${title} sections`}
                className="mt-4 border-l border-border"
              >
                <ul className="grid gap-1">
                  {sections.map((section) => {
                    const isActive = activeSection === section.id;

                    return (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          aria-current={isActive ? "location" : undefined}
                          onClick={() =>
                            handleSectionNavigation(section.id)
                          }
                          className={cn(
                            "-ml-px block border-l-2 px-4 py-2.5 text-sm transition-colors",
                            isActive
                              ? "border-primary font-semibold text-foreground"
                              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                          )}
                        >
                          {section.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </aside>

          <article className="min-w-0 divide-y divide-border">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                className="scroll-mt-28 py-9 first:pt-0 md:py-11"
              >
                <p
                  aria-hidden="true"
                  className="font-mono text-xs font-semibold tracking-wider text-muted-foreground"
                >
                  {String(index + 1).padStart(2, "0")}
                </p>

                <h2
                  id={`${section.id}-heading`}
                  className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl"
                >
                  {section.title}
                </h2>

                <div className="mt-5 space-y-4 text-base leading-8 text-muted-foreground">
                  {section.body.map((paragraph, paragraphIndex) => (
                    <p key={`${section.id}-paragraph-${paragraphIndex}`}>
                      {paragraph}
                    </p>
                  ))}

                  {section.bullets?.length ? (
                    <ul className="ml-5 list-disc space-y-2 marker:text-primary">
                      {section.bullets.map((item, itemIndex) => (
                        <li key={`${section.id}-bullet-${itemIndex}`}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </main>
  );
}

function formatLegalDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}