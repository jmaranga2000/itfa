import { StaffDashboard } from "@/components/dashboard/staff/staff-dashboard";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkspace } from "@/features/staff/workspace";
import { getCommunicationHubData } from "@/repositories/communication-repository";

export default async function StaffDashboardPage({ searchParams }: { searchParams: Promise<{ access?: string }> }) {
  const [{ principal, role }, query] = await Promise.all([
    requireStaffRoute("dashboard"),
    searchParams,
  ]);
  const communication = await getCommunicationHubData(principal);

  return (
    <StaffDashboard
      accessRestricted={query.access === "restricted"}
      assignedCount={principal.assignedEngagementIds.length}
      summary={communication.summary}
      workspace={getStaffWorkspace(role)}
    />
  );
}
