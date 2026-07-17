import { StaffDocuments } from "@/components/dashboard/staff/staff-documents";
import { requireStaffRoute } from "@/features/staff/server";

export default async function StaffDocumentsPage() {
  await requireStaffRoute("documents");
  return <StaffDocuments />;
}
