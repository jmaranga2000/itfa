import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleOff, PlugZap, RefreshCw, Settings2, TriangleAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requirePermission } from "@/features/auth/server";
import { testIntegrationAction, toggleIntegrationAction } from "@/features/integrations/actions";
import { isIntegrationKey } from "@/features/integrations/catalog";
import { getIntegrationConnection } from "@/repositories/integration-repository";

function statusTone(status: string) {
  if (status === "connected") return "green" as const;
  if (status === "failed") return "red" as const;
  if (status === "ready" || status === "not_configured") return "gold" as const;
  return "slate" as const;
}

export default async function IntegrationDetailPage({ params, searchParams }: {
  params: Promise<{ connectionKey: string }>;
  searchParams: Promise<{ updated?: string; test?: string; message?: string }>;
}) {
  await requirePermission("settings.manage");
  const [{ connectionKey }, query] = await Promise.all([params, searchParams]);
  if (!isIntegrationKey(connectionKey)) notFound();
  const connection = await getIntegrationConnection(connectionKey);
  if (!connection) notFound();
  return (
    <AdminPageSurface
      actions={<Link className={buttonClassName({ variant: "secondary" })} href="/admin/integrations"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to connections</Link>}
      description={connection.description}
      icon={PlugZap}
      summary={[
        { label: "Status", value: connection.status.replaceAll("_", " "), helper: connection.enabled ? "Connection is enabled" : "Connection is off", icon: connection.status === "connected" ? CheckCircle2 : TriangleAlert },
        { label: "Settings", value: `${connection.settings.filter((setting) => setting.configured).length}/${connection.settings.length}`, helper: "Required settings ready", icon: Settings2 },
        { label: "Last test", value: connection.lastCheckedAt ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(connection.lastCheckedAt)) : "Never", helper: "Manual connection check", icon: RefreshCw },
      ]}
      title={connection.name}
    >
      {query.updated ? <p className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">Connection preference was updated.</p> : null}
      {query.test ? <p className={`border-b px-5 py-3 text-sm font-semibold ${query.test === "passed" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{query.message ?? (query.test === "passed" ? "Connection test passed." : "Connection test failed.")}</p> : null}
      <section className="grid gap-5 border-b border-border p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-2"><Badge tone={statusTone(connection.status)}>{connection.status.replaceAll("_", " ")}</Badge><Badge tone={connection.enabled ? "green" : "slate"}>{connection.enabled ? "Enabled" : "Disabled"}</Badge></div>
          <h2 className="mt-4 text-base font-bold text-foreground">What this connection does</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{connection.purpose}</p>
          {connection.lastError ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p className="font-semibold">Latest test issue</p><p className="mt-1 break-words">{connection.lastError}</p></div> : null}
        </div>
        <div className="grid content-start gap-3">
          <form action={testIntegrationAction}><input name="connectionKey" type="hidden" value={connection.key} /><SubmitButton className="w-full" disabled={!connection.enabled} pendingText="Testing connection..."><RefreshCw aria-hidden="true" className="h-4 w-4" />Test connection</SubmitButton></form>
          <form action={toggleIntegrationAction}><input name="connectionKey" type="hidden" value={connection.key} /><input name="enabled" type="hidden" value={connection.enabled ? "false" : "true"} /><SubmitButton className="w-full" pendingText="Updating..." variant="secondary">{connection.enabled ? <CircleOff aria-hidden="true" className="h-4 w-4" /> : <PlugZap aria-hidden="true" className="h-4 w-4" />}{connection.enabled ? "Disable connection" : "Enable connection"}</SubmitButton></form>
        </div>
      </section>
      <section className="p-5">
        <h2 className="text-base font-bold text-foreground">Required settings</h2>
        <div className="mt-4 divide-y divide-border rounded-md border border-border">
          {connection.settings.map((setting) => <div className="flex items-center justify-between gap-4 px-4 py-3" key={setting.key}><div><p className="text-sm font-semibold text-foreground">{setting.label}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{setting.key}</p></div><Badge tone={setting.configured ? "green" : "gold"}>{setting.configured ? "Ready" : "Missing"}</Badge></div>)}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">Secret values are never displayed or stored on this page. Add or change them in the deployment environment, then run the connection test.</p>
      </section>
    </AdminPageSurface>
  );
}
