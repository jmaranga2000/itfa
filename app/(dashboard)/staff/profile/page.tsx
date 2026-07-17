import { notFound } from "next/navigation";
import { StaffProfile } from "@/components/dashboard/staff/staff-profile";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffProfile } from "@/repositories/staff-profile-repository";

export default async function StaffProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ avatar?: string; error?: string; saved?: string }>;
}) {
  const [{ principal }, query] = await Promise.all([
    requireStaffRoute("profile"),
    searchParams,
  ]);
  const profile = await getStaffProfile(principal.id);
  if (!profile) notFound();

  return (
    <StaffProfile
      error={query.error}
      profile={profile}
      success={query.avatar ? "avatar" : query.saved ? "saved" : undefined}
    />
  );
}
