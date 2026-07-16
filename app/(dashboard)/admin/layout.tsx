import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNavItems } from "@/config/dashboard-navigation";
import { requireAnyPermission } from "@/features/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAnyPermission(["reports.read", "permissions.manage", "settings.manage"]);

  return (
    <DashboardShell
      homeHref="/admin/dashboard"
      navItems={adminNavItems}
      roleLabel="Admin Portal"
      subtitle="Clients, work, money and settings"
      title="Admin Portal"
      variant="admin"
    >
      <div className="admin-content-simple">{children}</div>
    </DashboardShell>
  );
}
