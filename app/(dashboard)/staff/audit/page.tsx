import { StaffAudit } from "@/components/dashboard/staff/staff-operational-pages";
import { requireStaffRoute } from "@/features/staff/server";
import { listStaffAuditRecords } from "@/repositories/staff-audit-repository";

export default async function StaffAuditPage() {
  const { principal } = await requireStaffRoute("audit");
  const records = await listStaffAuditRecords(principal);
  return <StaffAudit records={records} />;
}
