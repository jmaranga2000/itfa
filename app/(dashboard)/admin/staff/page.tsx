import { AdminStaff } from "@/components/dashboard/admin/admin-staff";
import { getAdminRequest } from "@/content/admin-requests";
import { requirePermission } from "@/features/auth/server";
import {
  getRequestStaffAssignment,
  listStaffWorkloadForAdmin,
} from "@/repositories/staff-assignment-repository";

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ assignRequest?: string; error?: string }>;
}) {
  await requirePermission("staff.read");
  const query = await searchParams;
  const assignmentRequest = query.assignRequest
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
      error={query.error === "assign"}
      staff={staff}
    />
  );
}
