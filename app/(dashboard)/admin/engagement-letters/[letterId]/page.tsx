import { notFound } from "next/navigation";
import { AdminEngagementLetterDetail } from "@/components/dashboard/admin/admin-engagement-letters";
import { requireAnyPermission } from "@/features/auth/server";
import { getAdminEngagementLetter } from "@/repositories/engagement-letter-repository";

export default async function AdminEngagementLetterDetailPage({ params, searchParams }: {
  params: Promise<{ letterId: string }>;
  searchParams: Promise<{ generated?: string; saved?: string; sent?: string; signed?: string; notice?: string; error?: string }>;
}) {
  await requireAnyPermission(["engagements.read_all", "templates.manage_legal"]);
  const [{ letterId }, query] = await Promise.all([params, searchParams]);
  const letter = await getAdminEngagementLetter(letterId);
  if (!letter) notFound();
  return <AdminEngagementLetterDetail letter={letter} query={query} />;
}
