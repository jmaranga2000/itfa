import Link from "next/link";
import { ArrowRight, Landmark, MapPin } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";

const footerGroups = [
  {
    title: "Expertise",
    links: [
      { label: "Tax advisory", href: "/services#tax-advisory" },
      { label: "Financial reporting", href: "/services#financial-reporting" },
      { label: "Finance consulting", href: "/services#finance-process" },
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
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
] as const;

export function PublicFooter() {
  return (
    <footer>
      <section className="bg-brand-mist text-brand-deep">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-10 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase">Start with the right scope</p>
            <h2 className="mt-2 max-w-2xl text-2xl font-bold md:text-3xl">
              Bring us the question. We will help define the engagement.
            </h2>
          </div>
          <Link className={buttonClassName({ className: "shrink-0", size: "lg" })} href="/contact">
            Request a consultation
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="bg-brand-deep text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-mist text-brand-deep">
                <Landmark aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold">IFTA Consulting (K) Ltd</p>
                <p className="text-xs font-medium text-white/65">Professional advisory services</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/70">
              Structured tax and financial consulting engagements supported by secure client workflows.
            </p>
            <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand-mist">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              Nairobi, Kenya
            </p>
          </div>

          {footerGroups.map((group) => (
            <nav aria-label={group.title} key={group.title}>
              <h3 className="text-xs font-bold uppercase text-brand-mist">{group.title}</h3>
              <div className="mt-4 grid gap-3">
                {group.links.map((link) => (
                  <Link className="text-sm text-white/70 hover:text-white" href={link.href} key={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          ))}
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} IFTA Consulting (K) Ltd. All rights reserved.</p>
            <Link className="hover:text-white" href="/cookies">
              Cookie policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
