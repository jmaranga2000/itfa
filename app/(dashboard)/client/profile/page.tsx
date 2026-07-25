import { redirect } from "next/navigation";
import { ClientProfile } from "@/components/dashboard/client/client-profile";
import { requireUser } from "@/features/auth/server";
import { getAccountClosureRequestByClient } from "@/repositories/account-closure-repository";
import { getClientProfile } from "@/repositories/client-profile-repository";

export default async function ClientProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    avatar?: string;
    error?: string;
    saved?: string;
    closureRequested?: string;
    closureRequestPending?: string;
    closureRequestRejected?: string;
  }>;
}) {
  const [principal, query] = await Promise.all([requireUser(), searchParams]);
  const [profile, request] = await Promise.all([
    getClientProfile({ userId: principal.id, email: principal.email }),
    getAccountClosureRequestByClient(principal.id),
  ]);

  if (!profile) redirect("/client?error=profile-unavailable");

  return (
    <ClientProfile
      error={query.error}
      profile={profile}
      request={request}
      success={query.avatar ? "avatar" : query.saved ? "saved" : undefined}
      query={query}
    />
  );
}
