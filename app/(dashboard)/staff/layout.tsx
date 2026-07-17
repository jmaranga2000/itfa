import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireStaffWorkspace } from "@/features/staff/server";
import { getStaffNavItems, getStaffWorkspace } from "@/features/staff/workspace";

export const dynamic = "force-dynamic";

export default async function StaffDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { role } = await requireStaffWorkspace();
  const workspace = getStaffWorkspace(role);

  return (
    <DashboardShell
      homeHref="/staff"
      navItems={getStaffNavItems(role)}
      roleLabel={workspace.roleLabel}
      subtitle={workspace.subtitle}
      title={workspace.title}
    >
      {children}
    </DashboardShell>
  );
}
