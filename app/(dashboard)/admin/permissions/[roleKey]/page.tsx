import Link from "next/link";
import { ArrowLeft, Save, ShieldCheck, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { updateRoleAccessAction } from "@/features/authorization/actions";
import { isAppRole } from "@/features/authorization/roles";
import { requirePermission } from "@/features/auth/server";
import { getRoleForAdmin } from "@/repositories/role-repository";

const groupLabels: Record<string, string> = {
  clients: "Clients",
  staff: "Staff",
  services: "Services",
  engagements: "Engagements",
  kyc: "KYC and compliance",
  documents: "Documents",
  messages: "Messages",
  internal_notes: "Internal notes",
  templates: "Templates",
  invoices: "Invoices",
  payments: "Payments",
  reports: "Reports",
  audit_logs: "Activity log",
  permissions: "Roles and access",
  settings: "Settings and connections",
  ai: "AI workspace",
  archive: "Archive",
};

export default async function RoleAccessDetailPage({ params, searchParams }: {
  params: Promise<{ roleKey: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requirePermission("permissions.manage");
  const [{ roleKey }, query] = await Promise.all([params, searchParams]);
  if (!isAppRole(roleKey)) notFound();
  const data = await getRoleForAdmin(roleKey);
  if (!data) notFound();
  const groups = data.permissions.reduce((result, permission) => {
    const group = result.get(permission.group) ?? [];
    group.push(permission);
    result.set(permission.group, group);
    return result;
  }, new Map<string, typeof data.permissions>());
  const locked = roleKey === "super_admin";

  return (
    <AdminPageSurface
      actions={<Link className={buttonClassName({ variant: "secondary" })} href="/admin/permissions"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to roles</Link>}
      description="Choose exactly what this role can view or change. Every saved change applies to all assigned accounts."
      icon={ShieldCheck}
      summary={[
        { label: "Allowed", value: data.role.permissions.length, helper: "Current Yes decisions", icon: ShieldCheck },
        { label: "Not allowed", value: data.permissions.length - data.role.permissions.length, helper: "Current No decisions", icon: ShieldCheck },
        { label: "Accounts", value: data.role.userCount, helper: "Assigned to this role", icon: Users },
      ]}
      title={data.role.label}
    >
      {query.saved ? <p className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">Role access was saved successfully.</p> : null}
      {query.error ? <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">Check the role name and description, then save again.</p> : null}
      {locked ? <p className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">The super administrator always keeps every permission so the portal cannot be locked accidentally.</p> : null}
      <form action={updateRoleAccessAction} className="grid gap-0">
        <input name="roleKey" type="hidden" value={data.role.key} />
        <section className="grid gap-4 border-b border-border p-5 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-foreground">Role name<Input defaultValue={data.role.label} name="label" required /></label>
          <label className="grid gap-2 text-sm font-semibold text-foreground">Description<Textarea className="min-h-24" defaultValue={data.role.description} maxLength={300} name="description" required /></label>
        </section>
        {[...groups.entries()].map(([group, permissions]) => (
          <section className="border-b border-border p-5" key={group}>
            <h2 className="text-base font-bold text-foreground">{groupLabels[group] ?? group.replaceAll("_", " ")}</h2>
            <div className="mt-4 divide-y divide-border rounded-md border border-border">
              {permissions.map((permission) => (
                <div className="flex items-center justify-between gap-4 px-4 py-3" key={permission.key}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{permission.description}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{permission.key}</p>
                  </div>
                  <label className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-bold">
                    <span className="text-muted-foreground">No</span>
                    <input className="h-5 w-5 accent-primary" defaultChecked={permission.enabled} disabled={locked} name="permissions" type="checkbox" value={permission.key} />
                    <span className="text-primary">Yes</span>
                  </label>
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="flex items-center justify-between gap-4 p-5">
          <Badge tone={locked ? "gold" : "slate"}>{locked ? "Full access required" : "Changes are audited"}</Badge>
          <SubmitButton pendingText="Saving access..."><Save aria-hidden="true" className="h-4 w-4" />Save role access</SubmitButton>
        </div>
      </form>
    </AdminPageSurface>
  );
}
