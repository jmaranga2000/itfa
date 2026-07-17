import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Clock3, Users } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState, staffDate } from "@/components/dashboard/staff/staff-work-ui";
import { buttonClassName } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { StaffClientRecord } from "@/repositories/staff-work-repository";

export function StaffClients({ clients }: { clients: StaffClientRecord[] }) {
  const active = clients.filter((client) => client.activeEngagements > 0).length;
  const pending = clients.reduce((total, client) => total + client.pendingRequests, 0);

  return (
    <AdminPageSurface
      description="Clients connected to requests and engagements assigned to you."
      icon={Users}
      summary={[
        { label: "Clients", value: clients.length, helper: "In your current workload", icon: Users },
        { label: "Active", value: active, helper: "With work in progress", icon: BriefcaseBusiness },
        { label: "New requests", value: pending, helper: "Assigned before work begins", icon: Clock3 },
      ]}
      title="My clients"
    >
      {clients.length === 0 ? (
        <StaffEmptyState
          description="A client will appear here as soon as an administrator assigns their request or engagement to you."
          title="No clients assigned yet"
        />
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Active work</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.key}>
                  <TableCell>
                    <p className="font-semibold text-foreground">{client.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{client.email ?? client.organization}</p>
                  </TableCell>
                  <TableCell>{client.services.join(", ") || "Not set"}</TableCell>
                  <TableCell>{client.activeEngagements}</TableCell>
                  <TableCell>{client.pendingRequests}</TableCell>
                  <TableCell>{staffDate(client.lastActivityAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      className={buttonClassName({ variant: "secondary", size: "sm" })}
                      href={`/staff/clients/${encodeURIComponent(client.key)}`}
                    >
                      View client
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPageSurface>
  );
}
