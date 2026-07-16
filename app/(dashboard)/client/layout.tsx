import { DashboardShell } from "@/components/layout/dashboard-shell";
import { clientNavItems } from "@/config/dashboard-navigation";
import { requireAnyPermission } from "@/features/auth/server";

export const dynamic = "force-dynamic";

export default async function ClientDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAnyPermission(["engagements.create", "documents.upload", "messages.send"]);

  return (
    <DashboardShell
      homeHref="/client"
      navItems={clientNavItems}
      roleLabel="Client portal"
      subtitle="Actions, documents, messages and invoices"
      title="Client workspace"
    >
      {children}
    </DashboardShell>
  );
}
