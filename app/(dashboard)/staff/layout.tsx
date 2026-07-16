import { DashboardShell } from "@/components/layout/dashboard-shell";
import { staffNavItems } from "@/config/dashboard-navigation";
import { requireAnyPermission } from "@/features/auth/server";

export const dynamic = "force-dynamic";

export default async function StaffDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAnyPermission([
    "engagements.read_assigned",
    "kyc.review",
    "engagements.update_workflow",
  ]);

  return (
    <DashboardShell
      homeHref="/staff"
      navItems={staffNavItems}
      roleLabel="Staff portal"
      subtitle="Assigned engagements, reviews and client responses"
      title="Staff workspace"
    >
      {children}
    </DashboardShell>
  );
}
