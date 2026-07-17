import { cookies } from "next/headers";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getClientNavItems } from "@/config/dashboard-navigation";
import { requireAnyPermission } from "@/features/auth/server";
import { getClientCart } from "@/repositories/client-commerce-repository";

export const dynamic = "force-dynamic";

export default async function ClientDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [principal, cookieStore] = await Promise.all([
    requireAnyPermission(["engagements.create", "documents.upload", "messages.send"]),
    cookies(),
  ]);
  const cart = await getClientCart({
    clientUserId: principal.id,
    guestToken: cookieStore.get("ifta_guest_cart")?.value,
  });

  return (
    <DashboardShell
      homeHref="/client"
      navItems={getClientNavItems(cart.itemCount)}
      roleLabel="Client portal"
      subtitle="Actions, documents, messages and invoices"
      title="Client workspace"
    >
      {children}
    </DashboardShell>
  );
}
