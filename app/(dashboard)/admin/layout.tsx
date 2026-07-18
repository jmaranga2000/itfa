import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAdminNavItems } from "@/config/dashboard-navigation";
import { requireAnyPermission } from "@/features/auth/server";
import { countNewEngagementRequests } from "@/repositories/engagement-request-repository";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAnyPermission(["reports.read", "permissions.manage", "settings.manage"]);
  const newRequestCount = await countNewEngagementRequests();

  return (
    <DashboardShell
      homeHref="/admin/dashboard"
      navItems={getAdminNavItems(newRequestCount)}
      roleLabel="Admin Portal"
      subtitle="Clients, work, money and settings"
      title="Admin Portal"
      variant="admin"
    >
      <div className="admin-content-simple">{children}</div>
    </DashboardShell>
  );
}
