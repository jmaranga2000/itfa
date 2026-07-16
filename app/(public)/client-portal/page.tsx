import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  FileSignature,
  FolderLock,
  MessagesSquare,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { PublicPageIntro } from "@/components/public/public-page-intro";
import { buttonClassName } from "@/components/ui/button";

const portalCapabilities = [
  { icon: UserCheck, title: "Onboarding and KYC", copy: "Complete identity, organization and engagement checks through guided requests." },
  { icon: FolderLock, title: "Secure documents", copy: "Upload and review files inside the engagement they belong to." },
  { icon: FileSignature, title: "Approvals and letters", copy: "Review quotations, engagement terms and required acknowledgements." },
  { icon: MessagesSquare, title: "Contextual communication", copy: "Keep messages and action requests attached to the active matter." },
  { icon: CircleDollarSign, title: "Invoices and payments", copy: "See approved charges, payment state and engagement billing records." },
  { icon: ShieldCheck, title: "Archive and history", copy: "Retain completed records according to access and retention controls." },
] as const;

export default function ClientPortalInfoPage() {
  return (
    <main>
      <PublicPageIntro
        aside={
          <div className="grid gap-3">
            <p className="flex items-center gap-2 font-semibold text-brand-mist"><Check className="h-4 w-4" /> Role-based access</p>
            <p className="flex items-center gap-2 font-semibold text-brand-mist"><Check className="h-4 w-4" /> Engagement-scoped records</p>
            <p className="flex items-center gap-2 font-semibold text-brand-mist"><Check className="h-4 w-4" /> Visible required actions</p>
          </div>
        }
        description="Request services, complete onboarding, exchange documents, review engagement terms and follow progress through one protected client workspace."
        eyebrow="Client portal"
        title="A secure workspace around every approved engagement."
      />

      <section className="mx-auto max-w-7xl px-5 py-14 md:py-16">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase text-primary">What clients can manage</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold text-foreground">The full engagement record, without the internal noise.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className={buttonClassName()} href="/client">
              Open portal
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link className={buttonClassName({ variant: "secondary" })} href="/sign-up">
              Create account
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-x-8 gap-y-0 md:grid-cols-2 lg:grid-cols-3">
          {portalCapabilities.map((item) => {
            const Icon = item.icon;
            return (
              <article className="border-t border-border py-7" key={item.title}>
                <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-brand-soft text-brand-deep">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:py-16 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase">A simpler client view</p>
            <h2 className="mt-3 text-3xl font-bold">Know what is done and what needs you next.</h2>
            <p className="mt-4 text-sm leading-6 text-brand-deep/75">
              The portal translates a detailed internal workflow into clear stages, requests and decisions for the client.
            </p>
          </div>

          <div className="overflow-hidden rounded-md border border-brand-deep/20 bg-[#ffffff] text-brand-deep shadow-lg">
            <div className="flex items-center justify-between border-b border-brand-deep/15 px-5 py-4">
              <div>
                <p className="font-bold">Tax advisory engagement</p>
                <p className="text-xs text-brand-deep/65">Current stage: document review</p>
              </div>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold">Active</span>
            </div>
            <div className="grid gap-0 px-5 py-2">
              {[
                ["Request reviewed", "Complete"],
                ["KYC and onboarding", "Complete"],
                ["Document review", "In progress"],
                ["Advisory response", "Upcoming"],
              ].map(([step, state], index) => (
                <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-b border-brand-deep/10 py-3 last:border-0" key={step}>
                  <span className="font-mono text-xs font-bold">0{index + 1}</span>
                  <span className="text-sm font-semibold">{step}</span>
                  <span className="text-xs font-medium text-brand-deep/65">{state}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase text-primary">Security boundary</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground">Public enquiries stay separate from sensitive evidence.</h2>
          </div>
          <div className="grid gap-4 text-sm leading-6 text-muted-foreground">
            <p>Use the public contact form to explain the service need, organization and deadline.</p>
            <p>Sensitive documents are requested only after identity, access and engagement context can be controlled inside the portal.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
