import { AdminSettings } from "@/components/dashboard/admin/admin-settings";
import { requirePermission } from "@/features/auth/server";
import { getPlatformSettings } from "@/repositories/platform-settings-repository";

export default async function AdminSettingsPage({ searchParams }: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requirePermission("settings.manage");
  const [settings, query] = await Promise.all([getPlatformSettings(), searchParams]);
  return <AdminSettings error={query.error} saved={query.saved} settings={settings} />;
}
