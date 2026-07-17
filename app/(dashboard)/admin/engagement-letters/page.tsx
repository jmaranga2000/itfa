import { AdminEngagementLetters } from "@/components/dashboard/admin/admin-engagement-letters";
import { requireAnyPermission } from "@/features/auth/server";
import { listAdminEngagementLetters } from "@/repositories/engagement-letter-repository";

export default async function AdminEngagementLettersPage() {
  await requireAnyPermission(["engagements.read_all", "templates.manage_legal"]);
  const letters = await listAdminEngagementLetters();
  return <AdminEngagementLetters letters={letters} />;
}
