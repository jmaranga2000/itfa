import Link from "next/link";
import {
  ArrowRight,
  Landmark,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { buttonClassName } from "@/components/ui/button";

const currentYear = new Date().getFullYear();

const footerGroups = [
  {
    title: "Expertise",
    links: [
      { label: "Tax advisory", href: "/services#tax-advisory" },
      {
        label: "Financial reporting",
        href: "/services#financial-reporting",
      },
      {
        label: "Finance consulting",
        href: "/services#finance-process",
      },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Client access",
    links: [
      { label: "Client portal", href: "/client-portal" },
      { label: "Sign in", href: "/sign-in" },
      { label: "Create account", href: "/sign-up" },
      { label: "AI research", href: "/ai-research" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
      { label: "Cookie policy", href: "/cookies" },
    ],
  },
] as const;

const contactDetails = [
  {
    label: "Nairobi, Kenya",
    href: "https://maps.google.com/?q=Nairobi,Kenya",
    icon: MapPin,
    external: true,
  },
  {
    label: "info@iftaconsulting.co.ke",
    href: "mailto:info@iftaconsulting.co.ke",
    icon: Mail,
    external: false,
  },
  {
    label: "+254 700 000 000",
    href: "tel:+254700000000",
    icon: Phone,
    external: false,
  },
] as const;

export function PublicFooter() {
  return (
    <footer aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        IFTA Consulting footer
      </h2>

      <section
        aria-labelledby="footer-cta-heading"
        className="bg-brand-mist text-brand-deep"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">
              Start with the right scope
            </p>

            <h2
              id="footer-cta-heading"
              className="mt-2 max-w-2xl text-2xl font-bold leading-tight md:text-3xl"
            >
              Bring us the question. We will help define the engagement.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-brand-deep/75">
              Speak with our team about your tax, finance, reporting, or
              advisory requirements.
            </p>
          </div>

          <Link
            href="/contact"
            className={buttonClassName({
              size: "lg",
              className:
                "group shrink-0 self-start md:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
            })}
          >
            Request a consultation
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </section>

      <div className="bg-brand-deep text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)] lg:px-8">
          <section aria-labelledby="footer-company-heading" className="max-w-md">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-mist text-brand-deep"
              >
                <Landmark className="h-5 w-5" />
              </span>

              <div>
                <h3 id="footer-company-heading" className="font-bold">
                  IFTA Consulting (K) Ltd
                </h3>

                <p className="text-xs font-medium text-white/65">
                  Professional advisory services
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-white/70">
              Structured tax and financial consulting engagements supported by
              secure client workflows, document exchange, and professional
              review.
            </p>

            <div className="mt-5 flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-brand-mist"
              />

              <p className="text-xs leading-5 text-white/70">
                Client documents and engagement records are handled through
                controlled, authenticated workflows.
              </p>
            </div>

            <address className="mt-5 grid gap-3 not-italic">
              {contactDetails.map(
                ({ label, href, icon: Icon, external }) => (
                  <a
                    key={href}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className="flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mist"
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-brand-mist"
                    />
                    <span>{label}</span>
                  </a>
                ),
              )}
            </address>
          </section>

          {footerGroups.map((group) => (
            <nav aria-labelledby={`footer-${group.title}`} key={group.title}>
              <h3
                id={`footer-${group.title}`}
                className="text-xs font-bold uppercase tracking-wider text-brand-mist"
              >
                {group.title}
              </h3>

              <ul className="mt-4 grid gap-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex text-sm text-white/70 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mist"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-white/55 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <p>
              &copy; {currentYear} IFTA Consulting (K) Ltd. All rights reserved.
            </p>

            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link
                href="/privacy"
                className="transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mist"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mist"
              >
                Terms
              </Link>

              <Link
                href="/cookies"
                className="transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mist"
              >
                Cookies
              </Link>

              <Link
                href="/accessibility"
                className="transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mist"
              >
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}