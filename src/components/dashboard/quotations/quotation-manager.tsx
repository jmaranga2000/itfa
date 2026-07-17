import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Send } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { saveAndSendQuotationAction } from "@/features/quotations/actions";
import type { EngagementRequestRecord } from "@/repositories/engagement-request-repository";
import type { QuotationRecord } from "@/repositories/quotation-repository";

export function QuotationRequestList({ baseHref, requests }: { baseHref: string; requests: EngagementRequestRecord[] }) {
  return <AdminPageSurface description="Prepare, send and track client quotations from service requests." icon={BadgeDollarSign} summary={[{ label: "Requests", value: requests.length, helper: "Pricing requests received", icon: BadgeDollarSign }, { label: "Awaiting quote", value: requests.filter((request) => ["quotation_requested", "quotation_preparing"].includes(request.status)).length, helper: "Need pricing", icon: Send }]} title="Quotations">
    {requests.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No quotation requests are waiting.</p> : <div className="divide-y divide-border">{requests.map((request) => <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center" key={request.id}><div><div className="flex flex-wrap gap-2"><Badge tone="teal">{request.reference}</Badge><Badge tone={request.status === "quotation_sent" ? "green" : "gold"}>{request.status.replaceAll("_", " ")}</Badge></div><p className="mt-3 font-semibold text-foreground">{request.items.map((item) => item.serviceTitle).join(", ")}</p><p className="mt-1 text-sm text-muted-foreground">{request.clientName} | {request.clientEmail}</p></div><Link className={buttonClassName()} href={`${baseHref}/${request.id}`}>{request.status === "quotation_sent" ? "Open quotation" : "Prepare quotation"}<ArrowRight className="h-4 w-4" /></Link></div>)}</div>}
  </AdminPageSurface>;
}

export function QuotationEditor({ baseHref, request, quotation, suggestedLines, sent }: { baseHref: string; request: EngagementRequestRecord; quotation: QuotationRecord | null; suggestedLines: Array<{ serviceId: string; description: string; quantity: number; unitPrice: number; total: number; sourceLabel: string }>; sent?: boolean }) {
  const lines = quotation?.lines.map((line) => ({ ...line, sourceLabel: "Saved quotation line" })) ?? suggestedLines;
  return <div className="grid gap-5">
    {sent ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">The branded quotation was sent to the client portal and email.</p> : null}
    <section className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-center"><div><Badge tone="teal">{request.reference}</Badge><h1 className="mt-3 text-2xl font-bold text-foreground">Prepare quotation</h1><p className="mt-2 text-sm text-muted-foreground">{request.clientName} | {request.clientEmail}</p></div><Link className={buttonClassName({ variant: "secondary" })} href={baseHref}>Back to quotations</Link></section>
    <form action={saveAndSendQuotationAction} className="overflow-hidden rounded-md border border-border bg-card">
      <input name="requestId" type="hidden" value={request.id} /><input name="returnBase" type="hidden" value={baseHref} /><input name="lineCount" type="hidden" value={lines.length} />
      <div className="border-b border-border bg-brand-deep px-5 py-4 text-white"><p className="text-xs font-bold uppercase text-brand-mist">IFTA Consulting (K) Ltd</p><h2 className="mt-2 text-xl font-bold">Quotation details</h2></div>
      <div className="grid gap-5 p-5"><div className="grid gap-4 sm:grid-cols-3"><div className="grid gap-2"><Label htmlFor="currency">Currency</Label><Input defaultValue={quotation?.currency ?? "KES"} id="currency" maxLength={3} name="currency" required /></div><div className="grid gap-2"><Label htmlFor="validDays">Valid for</Label><Input defaultValue={30} id="validDays" max={90} min={1} name="validDays" required type="number" /></div><div className="grid gap-2"><Label htmlFor="taxRate">Tax rate (%)</Label><Input defaultValue={quotation?.taxRate ?? 0} id="taxRate" max={100} min={0} name="taxRate" required step="0.01" type="number" /></div></div>
        <div className="overflow-x-auto rounded-md border border-border"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-brand-soft text-brand-deep"><tr><th className="p-3">Service</th><th className="w-24 p-3">Qty</th><th className="w-44 p-3">Unit price</th><th className="w-40 p-3">Source</th></tr></thead><tbody>{lines.map((line, index) => <tr className="border-t border-border" key={`${line.serviceId}-${index}`}><td className="p-3"><input name={`serviceId:${index}`} type="hidden" value={line.serviceId ?? ""} /><Input defaultValue={line.description} name={`description:${index}`} required /></td><td className="p-3"><Input defaultValue={line.quantity} min={1} name={`quantity:${index}`} required type="number" /></td><td className="p-3"><Input defaultValue={line.unitPrice} min={0} name={`unitPrice:${index}`} required step="0.01" type="number" /></td><td className="p-3 text-xs text-muted-foreground">{line.sourceLabel}</td></tr>)}</tbody></table></div>
        <div className="grid gap-4 md:grid-cols-2"><div className="grid gap-2"><Label htmlFor="notes">Client notes</Label><Textarea defaultValue={quotation?.notes ?? "This quotation is based on the currently understood scope. Material changes may require a revised quotation."} id="notes" name="notes" /></div><div className="grid gap-2"><Label htmlFor="terms">Terms</Label><Textarea defaultValue={quotation?.terms ?? "Fees and payment timing will be confirmed in the engagement letter. Work begins after quotation acceptance, KYC completion and administrative approval."} id="terms" name="terms" required /></div></div>
      </div>
      <div className="flex flex-col gap-3 border-t border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Sending updates the portal and emails the client a branded copy.</p><SubmitButton pendingText="Creating and sending..."><Send className="h-4 w-4" />{quotation ? "Update and resend quotation" : "Create and send quotation"}</SubmitButton></div>
    </form>
  </div>;
}
