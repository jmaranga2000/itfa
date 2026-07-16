import type { ReactNode } from "react";

type PublicPageIntroProps = {
  aside?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

export function PublicPageIntro({ aside, description, eyebrow, title }: PublicPageIntroProps) {
  return (
    <section className="border-b border-white/10 bg-brand-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:py-18 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase text-brand-mist">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/70 md:text-lg">{description}</p>
        </div>
        {aside ? <div className="border-l border-brand-mist/35 pl-5 text-sm leading-6 text-white/70">{aside}</div> : null}
      </div>
    </section>
  );
}
