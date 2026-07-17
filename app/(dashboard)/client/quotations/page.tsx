import Link from "next/link";
import { ArrowRight, BadgeDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/features/auth/server";
import { listClientQuotations } from "@/repositories/quotation-repository";

export default async function ClientQuotationsPage() {
  const principal = await requireUser();
  const quotations = await listClientQuotations(principal.id);
  return <div className="grid gap-5"><section className="rounded-md border border-border bg-card p-5"><Badge tone="teal">Pricing documents</Badge><h1 className="mt-3 text-2xl font-bold text-foreground">Quotations</h1><p className="mt-2 text-sm text-muted-foreground">Review formal pricing sent by IFTA and accept it securely.</p></section><Card><CardHeader><CardTitle>Your quotations</CardTitle><CardDescription>{quotations.length} quotation{quotations.length === 1 ? "" : "s"}</CardDescription></CardHeader><CardContent className="grid gap-2">{quotations.length === 0 ? <EmptyState title="No quotations yet" description="Request pricing from your service cart and your formal quotations will appear here." /> : quotations.map((quotation) => <div className="flex flex-col justify-between gap-3 border-t border-border py-4 first:border-0 first:pt-0 sm:flex-row sm:items-center" key={quotation.id}><div><div className="flex flex-wrap gap-2"><p className="font-semibold text-foreground">{quotation.number}</p><Badge tone={quotation.status === "accepted" ? "green" : "gold"}>{quotation.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Valid until {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(quotation.validUntil))}</p></div><div className="flex items-center gap-3"><p className="font-bold text-foreground">{quotation.currency} {quotation.total.toLocaleString("en-KE")}</p><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/client/quotations/${quotation.id}`}>Open<ArrowRight className="h-4 w-4" /></Link></div></div>)}</CardContent></Card><Link className={buttonClassName({ className: "w-fit" })} href="/client/services"><BadgeDollarSign className="h-4 w-4" />Request another quotation</Link></div>;
}
