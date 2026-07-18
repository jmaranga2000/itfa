"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CircleUserRound,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  FileClock,
  FileText,
  FolderArchive,
  Gauge,
  HelpCircle,
  Home,
  Inbox,
  Landmark,
  LayoutDashboard,
  ListTodo,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LiveNotificationBell } from "@/components/dashboard/communication/live-notification-bell";
import { buttonClassName } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const iconMap = {
  activity: Activity,
  archive: Archive,
  bell: Bell,
  briefcase: BriefcaseBusiness,
  calendar: CalendarDays,
  clipboard: ClipboardCheck,
  creditCard: CreditCard,
  documents: FileText,
  fileText: FileText,
  fileCheck: FileCheck2,
  fileClock: FileClock,
  finance: Landmark,
  folderArchive: FolderArchive,
  gauge: Gauge,
  help: HelpCircle,
  home: Home,
  inbox: Inbox,
  invoice: FileText,
  listTodo: ListTodo,
  lock: LockKeyhole,
  mail: Mail,
  message: MessageSquareText,
  money: CircleDollarSign,
  operations: LayoutDashboard,
  permissions: ShieldCheck,
  profile: CircleUserRound,
  reports: Activity,
  search: Search,
  settings: Settings,
  sparkles: Sparkles,
  staff: UserCog,
  users: Users,
  workflow: Workflow,
} as const;

export type DashboardIconName = keyof typeof iconMap;

export type DashboardNavItem = {
  label: string;
  href?: string;
  symbol?: string;
  icon?: DashboardIconName;
  badge?: string;
  badgeTone?: "default" | "danger";
  children?: DashboardNavItem[];
  defaultOpen?: boolean;
};

export type DashboardShellProps = {
  title: string;
  subtitle: string;
  roleLabel: string;
  homeHref: string;
  navItems: DashboardNavItem[];
  children: React.ReactNode;
  variant?: "default" | "admin";
};

type PortalKind = "admin" | "staff" | "client";

function isHrefActive(href: string, pathname: string, homeHref: string) {
  return href === homeHref ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function findActiveTrail(
  items: DashboardNavItem[],
  pathname: string,
  homeHref: string,
  trail: string[] = [],
): string[] {
  for (const item of items) {
    const itemTrail = [...trail, item.label];

    if (item.href && isHrefActive(item.href, pathname, homeHref)) {
      return itemTrail;
    }

    if (item.children?.length) {
      const childTrail = findActiveTrail(item.children, pathname, homeHref, itemTrail);
      if (childTrail.length > 0) {
        return childTrail;
      }
    }
  }

  return [];
}

function hasActiveChild(item: DashboardNavItem, pathname: string, homeHref: string): boolean {
  return Boolean(
    item.children?.some(
      (child) =>
        (child.href && isHrefActive(child.href, pathname, homeHref)) ||
        hasActiveChild(child, pathname, homeHref),
    ),
  );
}

function NavigationIcon({ item, active }: { item: DashboardNavItem; active: boolean }) {
  const Icon = item.icon ? iconMap[item.icon] : null;

  return (
    <span
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-md text-xs font-bold",
        active ? "bg-brand-mist text-brand-deep" : "bg-white/10 text-brand-mist",
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : item.symbol}
    </span>
  );
}

function getPortalKind(homeHref: string, variant: DashboardShellProps["variant"]): PortalKind {
  if (variant === "admin" || homeHref.startsWith("/admin")) {
    return "admin";
  }

  return homeHref.startsWith("/staff") ? "staff" : "client";
}

function getQuickCreateItems(portal: PortalKind) {
  if (portal === "admin") {
    return [
      { label: "Create client", href: "/admin/clients" },
      { label: "Review requests", href: "/admin/requests" },
      { label: "Create invoice", href: "/admin/invoices" },
      { label: "Upload document", href: "/admin/documents" },
      { label: "Assign task", href: "/admin/tasks" },
      { label: "Invite staff member", href: "/admin/staff" },
    ];
  }

  if (portal === "staff") {
    return [
      { label: "Add internal note", href: "/staff/notes" },
      { label: "Upload document", href: "/staff/documents" },
      { label: "Message a client", href: "/staff/messages" },
      { label: "Open task queue", href: "/staff/tasks" },
    ];
  }

  return [
    { label: "Request a service", href: "/client/cart" },
    { label: "Upload document", href: "/client/documents" },
    { label: "Send a message", href: "/client/messages" },
    { label: "View invoices", href: "/client/invoices" },
  ];
}

export function DashboardShell({
  title,
  subtitle,
  roleLabel,
  homeHref,
  navItems,
  children,
  variant = "default",
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const portal = getPortalKind(homeHref, variant);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      navItems
        .filter((item) => item.children?.length && item.defaultOpen)
        .map((item) => [item.label, true]),
    ),
  );

  const activeTrail = useMemo(
    () => findActiveTrail(navItems, pathname, homeHref),
    [homeHref, navItems, pathname],
  );
  const quickCreateItems = getQuickCreateItems(portal);
  const portalRoot = portal === "admin" ? "/admin" : portal === "staff" ? "/staff" : "/client";
  const notificationsHref = `${portalRoot}/notifications`;
  const shellStyle = {
    "--dashboard-sidebar-width": collapsed ? "84px" : "288px",
  } as CSSProperties;
  const RoleIcon = portal === "admin" ? ShieldCheck : portal === "staff" ? UserCog : CircleUserRound;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMobileOpen(false);
      setQuickCreateOpen(false);
      setProfileOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    function closeMenus(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setQuickCreateOpen(false);
        setProfileOpen(false);
      }
    }

    window.addEventListener("keydown", closeMenus);
    return () => window.removeEventListener("keydown", closeMenus);
  }, []);

  function renderSignOut(compact = false) {
    return (
      <form action={signOutAction}>
        <button
          aria-label="Sign out"
          className={cn(
            "flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/15 text-sm font-semibold text-white hover:bg-white/10",
            compact && "px-0",
          )}
          title={compact ? "Sign out" : undefined}
          type="submit"
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          {!compact ? <span>Sign out</span> : null}
        </button>
      </form>
    );
  }

  function renderNav(items: DashboardNavItem[], mobile = false, depth = 0) {
    const showLabel = mobile || !collapsed;

    return (
      <nav aria-label={depth === 0 ? `${roleLabel} navigation` : undefined} className={cn("grid gap-1", depth > 0 && "mt-1")}>
        {items.map((item) => {
          const active = item.href ? isHrefActive(item.href, pathname, homeHref) : false;
          const childActive = hasActiveChild(item, pathname, homeHref);
          const groupOpen = childActive || (openGroups[item.label] ?? item.defaultOpen ?? false);

          if (item.children?.length) {
            return (
              <div key={item.label}>
                <button
                  aria-expanded={groupOpen}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold",
                    childActive
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                  onClick={() =>
                    setOpenGroups((current) => ({ ...current, [item.label]: !groupOpen }))
                  }
                  title={!showLabel ? item.label : undefined}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <NavigationIcon active={childActive} item={item} />
                    {showLabel ? <span className="truncate">{item.label}</span> : null}
                  </span>
                  {showLabel ? (
                    <ChevronDown
                      aria-hidden="true"
                      className={cn("h-4 w-4 shrink-0 transition-transform", groupOpen && "rotate-180")}
                    />
                  ) : null}
                </button>
                {groupOpen ? (
                  <div className={cn("grid gap-1 py-1", showLabel && "ml-4 border-l border-white/15 pl-2")}>
                    {renderNav(item.children, mobile, depth + 1)}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <Link
              className={cn(
                "flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium",
                depth > 0 && showLabel && "pl-5",
                active
                  ? "bg-brand-mist text-brand-deep shadow-sm"
                  : "text-white/72 hover:bg-white/10 hover:text-white",
              )}
              href={item.href ?? homeHref}
              key={item.href ?? item.label}
              onClick={() => setMobileOpen(false)}
              title={!showLabel ? item.label : undefined}
            >
              <span className="flex min-w-0 items-center gap-3">
                <NavigationIcon active={active} item={item} />
                {showLabel ? <span className="truncate">{item.label}</span> : null}
              </span>
              {item.badge && showLabel ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    item.badgeTone === "danger"
                      ? "bg-red-500 text-white shadow-sm"
                      : active
                        ? "bg-brand-deep/10 text-brand-deep"
                        : "bg-white/10 text-brand-mist",
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="dashboard-shell bg-background text-foreground" style={shellStyle}>
      <aside className="dashboard-sidebar hidden h-screen border-r transition-[width] duration-200 lg:block">
        <div className="flex h-screen min-w-0 flex-col">
          <div className="border-b border-white/10 p-4">
            {collapsed ? (
              <button
                aria-label="Expand navigation"
                className="mx-auto grid h-10 w-10 place-items-center rounded-md border border-white/15 text-brand-mist hover:bg-white/10 hover:text-white"
                onClick={() => setCollapsed(false)}
                type="button"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <Link className="flex min-w-0 items-center gap-3" href={homeHref}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-mist text-brand-deep">
                    <RoleIcon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-sm font-bold text-white">IFTA Consulting</span>
                    <span className="block truncate text-xs font-medium text-brand-mist/75">{roleLabel}</span>
                  </span>
                </Link>
                <button
                  aria-label="Collapse navigation"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/15 text-brand-mist hover:bg-white/10 hover:text-white"
                  onClick={() => setCollapsed(true)}
                  type="button"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">{renderNav(navItems)}</div>

          <div className="grid gap-2 border-t border-white/10 p-3">
            <Link
              className="flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-brand-mist hover:bg-white/10 hover:text-white"
              href="/"
              title={collapsed ? "Public website" : undefined}
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              {!collapsed ? <span>Public website</span> : null}
            </Link>
            {renderSignOut(collapsed)}
          </div>
        </div>
      </aside>

      <div className="dashboard-shell-main min-w-0 max-w-full overflow-x-hidden">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md">
          <div className="flex min-h-[68px] min-w-0 max-w-full items-center justify-between gap-3 px-4 lg:px-6">
            <button
              aria-label="Open navigation"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-secondary text-secondary-foreground lg:hidden"
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="truncate">{roleLabel}</span>
                {activeTrail.length > 1 ? (
                  <>
                    <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{activeTrail.at(-2)}</span>
                  </>
                ) : null}
              </div>
              <p className="truncate text-sm font-bold text-foreground">{activeTrail.at(-1) ?? title}</p>
            </div>

            <div className="hidden min-w-0 flex-1 justify-center px-4 xl:flex">
              <label className="relative w-full max-w-xl">
                <span className="sr-only">Go to a page in {roleLabel}</span>
                <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  className="h-10 w-full appearance-none rounded-md border border-border bg-background pl-9 pr-8 text-sm text-foreground outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  onChange={(event) => {
                    if (event.target.value) {
                      router.push(event.target.value);
                    }
                  }}
                  value=""
                >
                  <option value="">Go to a page...</option>
                  {navItems.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {(group.children ?? []).filter((item) => item.href).map((item) => (
                        <option key={item.href} value={item.href}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </label>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="relative">
                <button
                  aria-expanded={quickCreateOpen}
                  className={buttonClassName({ size: "sm" })}
                  onClick={() => {
                    setQuickCreateOpen((current) => !current);
                    setProfileOpen(false);
                  }}
                  type="button"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  <span className="hidden sm:inline">Create</span>
                </button>
                {quickCreateOpen ? (
                  <div className="absolute right-0 top-11 z-40 w-60 rounded-md border border-border bg-card p-2 shadow-xl">
                    {quickCreateItems.map((item) => (
                      <Link
                        className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                        href={item.href}
                        key={item.label}
                      >
                        <Plus aria-hidden="true" className="h-4 w-4 text-primary" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <LiveNotificationBell notificationsHref={notificationsHref} />

              <ThemeToggle className="hidden lg:inline-flex" />
              <Link
                aria-label="Help"
                className="hidden h-10 w-10 place-items-center rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-muted xl:grid"
                href="/contact"
              >
                <HelpCircle aria-hidden="true" className="h-4 w-4" />
              </Link>

              <div className="relative">
                <button
                  aria-label="Open account menu"
                  aria-expanded={profileOpen}
                  className="grid h-10 w-10 place-items-center rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-muted"
                  onClick={() => {
                    setProfileOpen((current) => !current);
                    setQuickCreateOpen(false);
                  }}
                  type="button"
                >
                  <CircleUserRound aria-hidden="true" className="h-5 w-5" />
                </button>
                {profileOpen ? (
                  <div className="absolute right-0 top-11 z-40 w-60 rounded-md border border-border bg-card p-2 shadow-xl">
                    <div className="border-b border-border px-3 py-3">
                      <p className="text-sm font-bold text-foreground">IFTA Consulting</p>
                      <p className="mt-1 text-xs text-muted-foreground">{roleLabel}</p>
                    </div>
                    {portal === "admin" ? (
                      <Link className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/admin/settings">
                        <Settings aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                        Portal settings
                      </Link>
                    ) : null}
                    <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/">
                      <Home aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                      Public website
                    </Link>
                    <div className="mt-2 border-t border-border pt-2">
                      <form action={signOutAction}>
                        <button className={buttonClassName({ className: "w-full", size: "sm", variant: "secondary" })} type="submit">
                          <LogOut aria-hidden="true" className="h-4 w-4" />
                          Sign out
                        </button>
                      </form>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground xl:hidden">
            <p className="truncate">{subtitle}</p>
          </div>
        </header>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close navigation overlay"
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
              type="button"
            />
            <div className="absolute left-0 top-0 flex h-full w-[min(88vw,340px)] flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)] text-[var(--sidebar-foreground)] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-mist text-brand-deep">
                    <RoleIcon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">IFTA Consulting</p>
                    <p className="text-xs text-brand-mist/75">{roleLabel}</p>
                  </div>
                </div>
                <button
                  aria-label="Close navigation"
                  className="grid h-9 w-9 place-items-center rounded-md border border-white/15 text-brand-mist hover:bg-white/10"
                  onClick={() => setMobileOpen(false)}
                  type="button"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">{renderNav(navItems, true)}</div>
              <div className="grid gap-2 border-t border-white/10 p-3">
                <ThemeToggle className="w-full justify-center" />
                {renderSignOut(false)}
              </div>
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-[1680px] min-w-0 overflow-x-hidden px-4 py-5 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
