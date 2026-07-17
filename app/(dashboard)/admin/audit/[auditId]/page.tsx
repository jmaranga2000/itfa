import Link from "next/link";
import { Activity, ArrowLeft, Database, Fingerprint, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { requirePermission } from "@/features/auth/server";
import { getAdminAuditRecord } from "@/repositories/admin-audit-repository";

function dateLabel(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "full", timeStyle: "long" }).format(new Date(value));
}

function JsonDetails({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  return <section className="border-b border-border p-5"><h2 className="text-base font-bold text-foreground">{label}</h2><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-4 text-xs leading-6 text-foreground">{JSON.stringify(value, null, 2)}</pre></section>;
}

export default async function AuditDetailPage({ params }: { params: Promise<{ auditId: string }> }) {
  await requirePermission("audit_logs.read");
  const { auditId } = await params;
  const record = await getAdminAuditRecord(auditId);
  if (!record) notFound();
  return (
    <AdminPageSurface
      actions={<Link className={buttonClassName({ variant: "secondary" })} href="/admin/audit"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to activity</Link>}
      description="A read-only record of this action, preserved for accountability and review."
      icon={Activity}
      summary={[
        { label: "Person", value: record.actorEmail ?? "System", helper: record.actorRoles.join(", ") || "Automated action", icon: UserRound },
        { label: "Record", value: record.resourceType, helper: record.resourceId ?? "No record ID", icon: Database },
        { label: "Request", value: record.requestId ?? "Not captured", helper: record.ipAddress ?? "IP not captured", icon: Fingerprint },
      ]}
      title={record.action.replaceAll(".", " / ").replaceAll("_", " ")}
    >
      <section className="grid gap-4 border-b border-border p-5 md:grid-cols-2">
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">Recorded</p><p className="mt-1 font-semibold text-foreground">{dateLabel(record.createdAt)}</p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">Reason</p><p className="mt-1 font-semibold text-foreground">{record.reason ?? "No reason supplied"}</p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">Browser or device</p><p className="mt-1 break-words text-sm text-foreground">{record.userAgent ?? "Not captured"}</p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">Integrity</p><Badge className="mt-1" tone="green">Immutable record</Badge></div>
      </section>
      <JsonDetails label="Before this action" value={record.previousValues} />
      <JsonDetails label="After this action" value={record.newValues} />
      <JsonDetails label="Additional context" value={record.metadata} />
    </AdminPageSurface>
  );
}
