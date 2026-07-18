import { AdminStaff } from "@/components/dashboard/admin/admin-staff";
import { getAdminRequest } from "@/content/admin-requests";
import { requirePermission } from "@/features/auth/server";
import {
  engagementRequestToAdminRecord,
  getEngagementRequestForAdmin,
} from "@/repositories/engagement-request-repository";
import {
  getRequestStaffAssignment,
  listStaffWorkloadForAdmin,
} from "@/repositories/staff-assignment-repository";

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ assignRequest?: string; deleted?: string; error?: string }>;
}) {
  await requirePermission("staff.read");
  const query = await searchParams;
  const databaseAssignmentRequest = query.assignRequest
    ? await getEngagementRequestForAdmin(query.assignRequest)
    : null;
  const assignmentRequest = databaseAssignmentRequest
    ? engagementRequestToAdminRecord(databaseAssignmentRequest)
    : query.assignRequest
      ? getAdminRequest(query.assignRequest)
      : null;
  const [staff, assignment] = await Promise.all([
    listStaffWorkloadForAdmin(),
    assignmentRequest ? getRequestStaffAssignment(assignmentRequest.id) : null,
  ]);

  return (
    <AdminStaff
      assignment={assignment}
      assignmentRequest={assignmentRequest}
      deleted={query.deleted === "1"}
      error={query.error === "assign"}
      staff={staff}
    />
  );
}
