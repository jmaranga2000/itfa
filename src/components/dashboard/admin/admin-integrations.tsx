import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Link2, PlugZap, Settings2, TriangleAlert } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { IntegrationConnectionRecord } from "@/repositories/integration-repository";

function statusLabel(status: IntegrationConnectionRecord["status"]) {
  return ({ not_configured: "Needs setup", ready: "Ready to test", connected: "Connected", failed: "Test failed", disabled: "Disabled" } as const)[status];
}

function statusTone(status: IntegrationConnectionRecord["status"]) {
  if (status === "connected") return "green" as const;
  if (status === "failed") return "red" as const;
  if (status === "ready" || status === "not_configured") return "gold" as const;
  return "slate" as const;
}

export function AdminIntegrations({ connections }: { connections: IntegrationConnectionRecord[] }) {
  const connected = connections.filter((connection) => connection.status === "connected").length;
  const attention = connections.filter((connection) => ["not_configured", "failed"].includes(connection.status)).length;
  return (
    <AdminPageSurface
      description="See which outside services are ready, test them safely, and turn individual connections on or off."
      icon={Link2}
      summary={[
        { label: "Connections", value: connections.length, helper: "Available services", icon: PlugZap },
        { label: "Connected", value: connected, helper: "Passed their latest test", icon: CheckCircle2 },
        { label: "Need attention", value: attention, helper: "Missing settings or failed", icon: TriangleAlert },
      ]}
      title="Connections"
    >
      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Status</TableHead><TableHead>Settings</TableHead><TableHead>Last tested</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>{connections.map((connection) => (
            <TableRow key={connection.key}>
              <TableCell><p className="font-semibold text-foreground">{connection.name}</p><p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{connection.description}</p></TableCell>
              <TableCell><Badge tone={statusTone(connection.status)}>{statusLabel(connection.status)}</Badge></TableCell>
              <TableCell>{connection.settings.filter((setting) => setting.configured).length}/{connection.settings.length} ready</TableCell>
              <TableCell className="text-muted-foreground">{connection.lastCheckedAt ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(connection.lastCheckedAt)) : "Not tested"}</TableCell>
              <TableCell className="text-right"><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/admin/integrations/${connection.key}`}><Settings2 aria-hidden="true" className="h-4 w-4" />Manage<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}
