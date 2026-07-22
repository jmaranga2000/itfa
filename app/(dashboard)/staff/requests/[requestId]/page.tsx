import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquareText, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminRequest } from "@/content/admin-requests";
import { requireStaffWorkspace } from "@/features/staff/server";
import {
  getEngagementRequestForAdmin,
} from "@/repositories/engagement-request-repository";
import { markRelatedNotificationsRead } from "@/repositories/communication-repository";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function StaffRequestDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const [{ principal }, { requestId }] = await Promise.all([requireStaffWorkspace(), params]);
  const data = await getStaffWorkData(principal);
  const assigned = data.requests.find((request) => request.id === requestId);
  if (!assigned) redirect("/access-blocked");
  const [databaseRequest] = await Promise.all([
    getEngagementRequestForAdmin(requestId),
    markRelatedNotificationsRead(principal, requestId),
  ]);
  const seeded = getAdminRequest(requestId);
  const notes = databaseRequest?.clientNotes || seeded?.requestSummary || "No client notes were supplied.";
  const outcome = databaseRequest?.expectedOutcome || seeded?.requestedOutcome || "Confirm the scope and next step with the client.";
  const clientKey = `request-${requestId}`;

  return <div className="grid min-w-0 gap-5">
    <section className="rounded-md border border-border bg-card p-5">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" href="/staff/requests"><ArrowLeft className="h-4 w-4" />Assigned requests</Link>
      <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><div className="flex flex-wrap gap-2"><Badge tone="teal">{assigned.reference}</Badge><Badge tone="gold">{assigned.status.replaceAll("_", " ")}</Badge></div><h1 className="mt-3 text-2xl font-bold text-foreground">{assigned.serviceName}</h1><p className="mt-2 text-sm text-muted-foreground">Requested by {assigned.clientName}</p></div><div className="flex flex-wrap gap-2"><Link className={buttonClassName({ variant: "secondary" })} href={`/staff/clients/${clientKey}`}><UserRound className="h-4 w-4" />Client details</Link><Link className={buttonClassName()} href="/staff/messages/new"><MessageSquareText className="h-4 w-4" />Message client</Link></div></div>
    </section>
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card><CardHeader><CardTitle>Request brief</CardTitle><CardDescription>What the client needs and the result they expect.</CardDescription></CardHeader><CardContent className="grid gap-5"><div><p className="text-xs font-bold uppercase text-muted-foreground">Client notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{notes}</p></div><div className="border-t border-border pt-5"><p className="text-xs font-bold uppercase text-muted-foreground">Expected outcome</p><p className="mt-2 text-sm leading-7 text-foreground">{outcome}</p></div>{databaseRequest ? <div className="border-t border-border pt-5"><p className="text-xs font-bold uppercase text-muted-foreground">Selected services</p><div className="mt-3 grid gap-2">{databaseRequest.items.map((item) => <div className="rounded-md border border-border bg-muted/30 p-3" key={item.serviceId}><p className="font-semibold text-foreground">{item.serviceTitle}</p><p className="mt-1 text-sm text-muted-foreground">{item.priceLabel} | Quantity {item.quantity}</p></div>)}</div></div> : null}</CardContent></Card>
      <Card><CardHeader><CardTitle>Your next action</CardTitle><CardDescription>This request is assigned to you.</CardDescription></CardHeader><CardContent><p className="text-sm leading-6 text-foreground">{assigned.nextAction}</p><p className="mt-4 text-xs text-muted-foreground">Assigned {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(assigned.assignedAt))}</p></CardContent></Card>
    </section>
  </div>;
}
