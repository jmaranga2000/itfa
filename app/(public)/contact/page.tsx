import { CheckCircle2, Clock3, LockKeyhole, MessageSquareText } from "lucide-react";
import { ContactForm } from "@/components/public/contact-form";
import { PublicPageIntro } from "@/components/public/public-page-intro";

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;

  return (
    <main>
      <PublicPageIntro
        aside={
          <div className="grid gap-3">
            <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-brand-mist" /> Include any deadline or urgent event.</p>
            <p className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-brand-mist" /> Keep sensitive documents out of this form.</p>
          </div>
        }
        description="Tell us the decision, review or compliance matter you need help with. We will use that context to identify the right service and next step."
        eyebrow="Contact IFTA Consulting"
        title="Start with the question you need answered."
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
        <div className="rounded-md border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="border-b border-border pb-5">
            <p className="text-xs font-bold uppercase text-primary">Consultation request</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">How can we help?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Provide enough context for an initial service and scope review.</p>
          </div>

          {params?.sent ? (
            <div className="ifta-badge-success mt-5 flex items-center gap-2 rounded-md border px-3 py-3 text-sm font-semibold">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              Your message has been recorded.
            </div>
          ) : null}
          {params?.error ? (
            <div className="ifta-badge-danger mt-5 rounded-md border px-3 py-3 text-sm font-semibold">{params.error}</div>
          ) : null}

          <div className="mt-6">
            <ContactForm />
          </div>
        </div>

        <aside>
          <MessageSquareText aria-hidden="true" className="h-7 w-7 text-primary" />
          <h2 className="mt-4 text-2xl font-bold text-foreground">What happens next</h2>
          <ol className="mt-6 divide-y divide-border border-y border-border">
            {[
              ["Initial review", "We review the service area, urgency and engagement context."],
              ["Scope discussion", "We clarify the decision, evidence and expected deliverable."],
              ["Formal next step", "You receive the appropriate portal, quotation or engagement route."],
            ].map(([title, copy], index) => (
              <li className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 py-5" key={title}>
                <span className="font-mono text-xs font-bold text-primary">0{index + 1}</span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-7 rounded-md bg-brand-soft p-5 text-brand-deep">
            <p className="text-xs font-bold uppercase">Secure document handling</p>
            <p className="mt-2 text-sm leading-6">
              Do not attach confidential evidence to a public enquiry. We will direct you to the protected client workspace when needed.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
