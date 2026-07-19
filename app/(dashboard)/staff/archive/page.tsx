import { StaffArchive } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { listArchivedWorkflowsForPrincipal } from "@/repositories/workflow-repository";

export default async function StaffArchivePage() {
  const { principal } = await requireStaffRoute("archive");
  return <StaffArchive workflows={await listArchivedWorkflowsForPrincipal(principal)} />;
}
