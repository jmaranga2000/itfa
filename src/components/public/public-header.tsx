"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Landmark, Menu, ShoppingCart, X } from "lucide-react";
import { AuthNavLink } from "@/components/layout/auth-nav-link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mainNav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
] as const;

const resourceNav = [
  { label: "AI research", href: "/ai-research", description: "Governed advisory research support" },
  { label: "Client portal", href: "/client-portal", description: "How the secure workspace operates" },
] as const;

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return href === "/" ? pathname === href : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="hidden bg-brand-deep text-white sm:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-5 text-xs font-medium">
          <p>Tax, legal, finance and regulatory advisory</p>
          <div className="flex items-center gap-5 text-white/75">
            <span>Nairobi, Kenya</span>
            <Link className="hover:text-white" href="/contact">
              Request a consultation
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5">
        <Link aria-label="IFTA Consulting home" className="flex min-w-0 items-center gap-3" href="/">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Landmark aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold text-foreground">IFTA Consulting</span>
            <span className="block truncate text-[11px] font-semibold uppercase text-muted-foreground">
              Advisory &amp; client services
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 xl:flex">
          {mainNav.slice(0, 4).map((item) => (
            <Link
              className={cn(
                "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                isActive(item.href)
                  ? "bg-brand-soft text-brand-deep"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}

          <details className="group relative">
            <summary
              className={cn(
                "flex list-none items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                resourceNav.some((item) => isActive(item.href))
                  ? "bg-brand-soft text-brand-deep"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              Resources
              <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 top-12 w-72 rounded-md border border-border bg-card p-2 shadow-xl">
              {resourceNav.map((item) => (
                <Link className="block rounded-md px-3 py-3 hover:bg-muted" href={item.href} key={item.href}>
                  <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span>
                </Link>
              ))}
            </div>
          </details>

          <Link
            className={cn(
              "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
              isActive("/contact")
                ? "bg-brand-soft text-brand-deep"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            href="/contact"
          >
            Contact
          </Link>
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            aria-label="Open service cart"
            className={buttonClassName({ size: "icon", variant: "secondary" })}
            href="/cart"
            title="Service cart"
          >
            <ShoppingCart aria-hidden="true" className="h-4 w-4" />
          </Link>
          <AuthNavLink className={buttonClassName({ variant: "secondary", size: "sm" })} href="/sign-in">
            Sign in
          </AuthNavLink>
          <Link className={buttonClassName({ size: "sm" })} href="/client">
            Open portal
          </Link>
        </div>

        <button
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          className="grid h-10 w-10 place-items-center rounded-md border border-border bg-secondary text-secondary-foreground xl:hidden"
          onClick={() => setMobileOpen((current) => !current)}
          type="button"
        >
          {mobileOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border bg-card px-5 py-4 xl:hidden">
          <nav aria-label="Mobile navigation" className="mx-auto grid max-w-7xl gap-1">
            {[...mainNav, ...resourceNav].map((item) => (
              <Link
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-semibold",
                  isActive(item.href) ? "bg-brand-soft text-brand-deep" : "text-foreground hover:bg-muted",
                )}
                href={item.href}
                key={item.href}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-4 md:hidden">
              <ThemeToggle className="w-full justify-center" />
              <AuthNavLink className={buttonClassName({ variant: "secondary", size: "sm" })} href="/sign-in" onClick={() => setMobileOpen(false)}>
                Sign in
              </AuthNavLink>
              <Link className={buttonClassName({ className: "col-span-2", size: "sm" })} href="/client" onClick={() => setMobileOpen(false)}>
                Open client portal
              </Link>
              <Link className={buttonClassName({ className: "col-span-2", size: "sm", variant: "secondary" })} href="/cart" onClick={() => setMobileOpen(false)}>
                <ShoppingCart aria-hidden="true" className="h-4 w-4" />
                Service cart
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
