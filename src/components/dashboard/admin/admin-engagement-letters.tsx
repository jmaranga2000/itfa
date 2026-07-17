import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FilePenLine,
  FileSignature,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { EngagementLetterDocument } from "@/components/dashboard/engagement-letters/engagement-letter-document";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/ui/print-button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  sendEngagementLetterAction,
  signAdminEngagementLetterAction,
  updateEngagementLetterDraftAction,
} from "@/features/engagement-letters/actions";
import { convertEngagementRequestAction } from "@/features/client/request-admin-actions";
import type { EngagementLetterRecord } from "@/repositories/engagement-letter-repository";

const inputClassName = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20";
const textareaClassName = "w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20";

function statusLabel(status: EngagementLetterRecord["status"]) {
  return {
    draft: "Draft",
    awaiting_signatures: "Awaiting signatures",
    partially_signed: "Partially signed",
    completed: "Completed",
    void: "Void",
  }[status];
}

function statusTone(status: EngagementLetterRecord["status"]) {
  if (status === "completed") return "green" as const;
  if (status === "awaiting_signatures" || status === "partially_signed") return "gold" as const;
  if (status === "void") return "red" as const;
  return "slate" as const;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: "Africa/Nairobi" }).format(new Date(value));
}

export function AdminEngagementLetters({ letters }: { letters: EngagementLetterRecord[] }) {
  const awaiting = letters.filter((letter) => ["awaiting_signatures", "partially_signed"].includes(letter.status)).length;
  const completed = letters.filter((letter) => letter.status === "completed").length;
  const drafts = letters.filter((letter) => letter.status === "draft").length;
  return (
    <AdminPageSurface
      actions={<Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/letter-templates"><FilePenLine className="h-4 w-4" />Letter templates</Link>}
      description="Prepare, send and track engagement letters before client work is activated."
      icon={FileSignature}
      summary={[
        { label: "Letters", value: letters.length, helper: "Current engagement records", icon: FileSignature },
        { label: "Drafts", value: drafts, helper: "Ready for review", icon: FilePenLine },
        { label: "Awaiting", value: awaiting, helper: "Signatures outstanding", icon: Clock3 },
        { label: "Completed", value: completed, helper: "Ready for activation", icon: CheckCircle2 },
      ]}
      title="Engagement letters"
    >
      {letters.length === 0 ? (
        <div className="p-8 text-center"><FileSignature className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-3 font-bold text-foreground">No engagement letters yet</h2><p className="mt-1 text-sm text-muted-foreground">Open a client request and choose Prepare engagement letter.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-border bg-muted/25 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Letter</th><th className="px-5 py-3">Client</th><th className="px-5 py-3">Services</th><th className="px-5 py-3">Signatures</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-border">
              {letters.map((letter) => {
                const signed = letter.signers.filter((signer) => signer.required && signer.status === "signed").length;
                const required = letter.signers.filter((signer) => signer.required).length;
                return <tr className="hover:bg-muted/15" key={letter.id}><td className="px-5 py-4"><p className="font-bold text-foreground">{letter.reference}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(letter.generatedAt)}</p></td><td className="px-5 py-4"><p className="font-semibold text-foreground">{letter.clientName}</p><p className="mt-1 text-xs text-muted-foreground">{letter.clientEmail}</p></td><td className="max-w-72 px-5 py-4 text-muted-foreground">{letter.serviceNames.join(", ")}</td><td className="px-5 py-4">{signed}/{required} signed</td><td className="px-5 py-4"><Badge tone={statusTone(letter.status)}>{statusLabel(letter.status)}</Badge></td><td className="px-5 py-4 text-right"><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/admin/engagement-letters/${letter.id}`}>Manage<ArrowUpRight className="h-4 w-4" /></Link></td></tr>;
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageSurface>
  );
}

const errorMessages: Record<string, string> = {
  invalid: "Review the subject, fee, expiry date and letter content before saving.",
  locked: "This letter can no longer be edited because it has already been sent or signed.",
  send: "The letter could not be sent. Save the draft and try again.",
  signature: "Type the signatory's full legal name and confirm the signature declaration.",
  expired: "This letter has expired. Prepare a new version before requesting signatures.",
  signed: "The IFTA signature has already been completed.",
  changed: "The document fingerprint no longer matches its content. Prepare a new draft.",
  disabled: "Typed electronic signatures are disabled in Settings.",
};

export function AdminEngagementLetterDetail({ letter, query }: {
  letter: EngagementLetterRecord;
  query: { generated?: string; saved?: string; sent?: string; signed?: string; notice?: string; error?: string };
}) {
  const iftaSigner = letter.signers.find((signer) => signer.role === "ifta");
  const clientSigner = letter.signers.find((signer) => signer.role === "client");
  const canSign = letter.status !== "draft" && letter.status !== "completed" && iftaSigner?.status === "pending";
  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" href="/admin/engagement-letters"><ArrowLeft className="h-4 w-4" />Back to engagement letters</Link>
            <div className="mt-4 flex flex-wrap items-center gap-2"><Badge tone={statusTone(letter.status)}>{statusLabel(letter.status)}</Badge><span className="text-xs font-bold text-muted-foreground">{letter.reference}</span></div>
            <h1 className="mt-3 text-2xl font-bold text-foreground">{letter.subject}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{letter.clientName} · Request {letter.requestReference}</p>
          </div>
          <div className="flex flex-wrap gap-2"><PrintButton /><Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/admin/requests/${letter.requestId}`}>Open request</Link></div>
        </div>
      </section>

      {query.generated ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Customized letter prepared. Review it before sending.</p> : null}
      {query.saved ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Draft changes saved.</p> : null}
      {query.sent ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">The client was notified that this letter is ready for signature.</p> : null}
      {query.signed ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Your electronic signature was recorded.</p> : null}
      {query.notice === "signature-required" ? <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">The engagement will be activated after all required signatures are complete.</p> : null}
      {query.error && errorMessages[query.error] ? <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{errorMessages[query.error]}</p> : null}

      {letter.status === "draft" ? (
        <form action={updateEngagementLetterDraftAction} className="overflow-hidden rounded-md border border-border bg-card">
          <input name="letterId" type="hidden" value={letter.id} />
          <div className="border-b border-border p-5"><h2 className="font-bold text-foreground">Review and customize the draft</h2><p className="mt-1 text-sm text-muted-foreground">The client cannot see this letter until you send it for signature.</p></div>
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2 text-sm font-semibold text-foreground md:col-span-2 xl:col-span-4">Subject<input className={inputClassName} defaultValue={letter.subject} name="subject" required /></label>
            <label className="grid gap-2 text-sm font-semibold text-foreground">Professional fee<input className={inputClassName} defaultValue={letter.fee ?? ""} min="0" name="fee" type="number" /></label>
            <label className="grid gap-2 text-sm font-semibold text-foreground">Currency<input className={inputClassName} defaultValue={letter.currency} maxLength={3} name="currency" required /></label>
            <label className="grid gap-2 text-sm font-semibold text-foreground">Accept by<input className={inputClassName} defaultValue={letter.expiresAt.slice(0, 10)} name="expiresAt" required type="date" /></label>
            <div className="hidden xl:block" />
            <label className="grid gap-2 text-sm font-semibold text-foreground md:col-span-2 xl:col-span-4">Payment terms<textarea className={`${textareaClassName} min-h-24`} defaultValue={letter.paymentTerms} name="paymentTerms" required /></label>
            <label className="grid gap-2 text-sm font-semibold text-foreground md:col-span-2 xl:col-span-4">Letter content<textarea className={`${textareaClassName} min-h-[620px] font-mono text-xs`} defaultValue={letter.content} name="content" required /></label>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/15 p-4">
            <SubmitButton pendingText="Saving draft..."><FilePenLine className="h-4 w-4" />Save draft</SubmitButton>
          </div>
        </form>
      ) : <EngagementLetterDocument letter={letter} />}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Signature progress</CardTitle><CardDescription>Both required signers must accept the same document fingerprint.</CardDescription></CardHeader>
          <CardContent className="grid gap-3">
            {[iftaSigner, clientSigner].filter(Boolean).map((signer) => <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3" key={signer!.id}><div><p className="text-sm font-bold text-foreground">{signer!.role === "ifta" ? "IFTA Consulting" : letter.clientName}</p><p className="mt-1 text-xs text-muted-foreground">{signer!.name}</p></div><Badge tone={signer!.status === "signed" ? "green" : "gold"}>{signer!.status === "signed" ? "Signed" : signer!.required ? "Required" : "Optional"}</Badge></div>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Next action</CardTitle><CardDescription>{letter.status === "draft" ? "Send the reviewed letter to begin signing." : letter.status === "completed" ? "All required signatures are complete." : "Complete the outstanding signature."}</CardDescription></CardHeader>
          <CardContent className="grid gap-3">
            {letter.status === "draft" ? <form action={sendEngagementLetterAction}><input name="letterId" type="hidden" value={letter.id} /><SubmitButton className="w-full" pendingText="Sending to client..."><Send className="h-4 w-4" />Send for signatures</SubmitButton></form> : null}
            {canSign ? <form action={signAdminEngagementLetterAction} className="grid gap-3"><input name="letterId" type="hidden" value={letter.id} /><label className="grid gap-2 text-sm font-semibold text-foreground">Full legal name<input className={inputClassName} defaultValue={iftaSigner?.name} name="signatureText" required /></label><label className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><input className="mt-1 h-4 w-4 accent-primary" name="signatureAccepted" required type="checkbox" />I have reviewed this letter and intend this typed name to be my electronic signature for IFTA Consulting.</label><SubmitButton className="w-full" pendingText="Recording signature..."><ShieldCheck className="h-4 w-4" />Sign for IFTA</SubmitButton></form> : null}
            {letter.status === "completed" && !letter.workflowId ? <form action={convertEngagementRequestAction}><input name="requestId" type="hidden" value={letter.requestId} /><SubmitButton className="w-full" pendingText="Activating engagement..."><CheckCircle2 className="h-4 w-4" />Activate engagement</SubmitButton></form> : null}
            {letter.workflowId ? <Link className={buttonClassName({ className: "w-full" })} href={`/admin/workflows/${letter.workflowId}`}>Open active engagement<ArrowUpRight className="h-4 w-4" /></Link> : null}
            {letter.status !== "draft" && clientSigner?.status === "pending" ? <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><Users className="mt-0.5 h-4 w-4 shrink-0" />Waiting for {letter.clientName} to sign in the client portal.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
