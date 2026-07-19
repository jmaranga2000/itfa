import { redirect } from "next/navigation";
import { ClientProfile } from "@/components/dashboard/client/client-profile";
import { requireUser } from "@/features/auth/server";
import { getClientProfile } from "@/repositories/client-profile-repository";

export default async function ClientProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ avatar?: string; error?: string; saved?: string }>;
}) {
  const [principal, query] = await Promise.all([requireUser(), searchParams]);
  const profile = await getClientProfile({ userId: principal.id, email: principal.email });
  if (!profile) redirect("/client?error=profile-unavailable");

  return (
    <ClientProfile
      error={query.error}
      profile={profile}
      success={query.avatar ? "avatar" : query.saved ? "saved" : undefined}
    />
  );
}
