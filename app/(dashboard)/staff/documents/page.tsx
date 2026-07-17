import { StaffDocuments } from "@/components/dashboard/staff/staff-documents";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffDocumentsPage() {
  const { principal } = await requireStaffRoute("documents");
  const data = await getStaffWorkData(principal);
  return <StaffDocuments documents={data.documents} />;
}
