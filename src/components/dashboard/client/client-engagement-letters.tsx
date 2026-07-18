import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Clock3, FileSignature, ShieldCheck } from "lucide-react";
import { EngagementLetterDocument } from "@/components/dashboard/engagement-letters/engagement-letter-document";
import { EngagementLetterFiles } from "@/components/dashboard/engagement-letters/engagement-letter-files";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/ui/print-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { signClientEngagementLetterAction } from "@/features/engagement-letters/actions";
import type { EngagementLetterRecord } from "@/repositories/engagement-letter-repository";

const inputClassName = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: "Africa/Nairobi" }).format(new Date(value));
}

export function ClientEngagementLetters({ letters }: { letters: EngagementLetterRecord[] }) {
  const pending = letters.filter((letter) => letter.signers.some((signer) => signer.role === "client" && signer.status === "pending")).length;
  return (
    <div className="grid min-w-0 gap-5">
      <section className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-center">
        <div><Badge tone="teal">Agreements</Badge><h1 className="mt-3 text-2xl font-bold text-foreground">Engagement letters</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review the agreed scope and fees, then sign securely before your engagement begins.</p></div>
        <div className="flex items-center gap-4"><div><p className="text-xs font-semibold text-muted-foreground">Waiting for you</p><p className="text-2xl font-bold text-foreground">{pending}</p></div><FileSignature className="h-8 w-8 text-primary" /></div>
      </section>
      {letters.length === 0 ? <Card><CardContent className="p-8 text-center"><FileSignature className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-3 font-bold text-foreground">No engagement letters yet</h2><p className="mt-1 text-sm text-muted-foreground">Letters will appear here after IFTA reviews your request.</p></CardContent></Card> : (
        <div className="grid gap-3">
          {letters.map((letter) => {
            const clientSigner = letter.signers.find((signer) => signer.role === "client");
            return <Card key={letter.id}><CardContent className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"><div className="min-w-0"><div className="flex flex-wrap gap-2"><Badge tone={letter.status === "completed" ? "green" : "gold"}>{letter.status === "completed" ? "Completed" : clientSigner?.status === "signed" ? "Waiting for IFTA" : "Your signature required"}</Badge><span className="text-xs font-semibold text-muted-foreground">{letter.reference}</span></div><h2 className="mt-3 font-bold text-foreground">{letter.subject}</h2><p className="mt-1 text-sm text-muted-foreground">Issued {formatDate(letter.generatedAt)} · Accept by {formatDate(letter.expiresAt)}</p></div><Link className={buttonClassName({ variant: letter.status === "completed" ? "secondary" : "primary" })} href={`/client/engagement-letters/${letter.id}`}>{clientSigner?.status === "pending" ? "Review and sign" : "View letter"}<ArrowUpRight className="h-4 w-4" /></Link></CardContent></Card>;
          })}
        </div>
      )}
    </div>
  );
}

const errorMessages: Record<string, string> = {
  signature: "Type your full legal name and confirm the electronic signature declaration.",
  expired: "This letter has expired. Please contact IFTA for a new version.",
  signed: "Your signature has already been recorded.",
  changed: "This letter could not be verified. Please contact IFTA before signing.",
  disabled: "Electronic signing is temporarily unavailable. Please contact IFTA.",
  forbidden: "You do not have permission to sign this letter.",
};

export function ClientEngagementLetterDetail({ letter, signed, error }: {
  letter: EngagementLetterRecord;
  signed?: boolean;
  error?: string;
}) {
  const clientSigner = letter.signers.find((signer) => signer.role === "client");
  const canSign = clientSigner?.status === "pending" && letter.status !== "completed";
  return (
    <div className="grid min-w-0 gap-5">
      <section className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-start">
        <div><Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" href="/client/engagement-letters"><ArrowLeft className="h-4 w-4" />Back to letters</Link><div className="mt-4 flex flex-wrap items-center gap-2"><Badge tone={letter.status === "completed" ? "green" : "gold"}>{letter.status === "completed" ? "Completed" : "Signature process"}</Badge><span className="text-xs font-bold text-muted-foreground">{letter.reference}</span></div><h1 className="mt-3 text-2xl font-bold text-foreground">{letter.subject}</h1><p className="mt-2 text-sm text-muted-foreground">Please review the complete letter before signing.</p></div><PrintButton /></section>
      {signed ? <p className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />Your electronic signature was recorded successfully.</p> : null}
      {error && errorMessages[error] ? <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{errorMessages[error]}</p> : null}
      <EngagementLetterDocument letter={letter} />
      <EngagementLetterFiles letter={letter} />
      {canSign ? (
        <Card>
          <CardHeader><CardTitle>Sign this engagement letter</CardTitle><CardDescription>Your typed legal name, account, signing time and this document fingerprint will form the electronic signature evidence.</CardDescription></CardHeader>
          <CardContent>
            <form action={signClientEngagementLetterAction} className="grid gap-4">
              <input name="letterId" type="hidden" value={letter.id} />
              <label className="grid gap-2 text-sm font-semibold text-foreground">Your full legal name<input autoComplete="name" className={inputClassName} defaultValue={letter.clientName} name="signatureText" required /></label>
              <label className="flex items-start gap-3 rounded-md border border-border bg-muted/15 p-3 text-sm leading-6 text-foreground"><input className="mt-1 h-4 w-4 shrink-0 accent-primary" name="signatureAccepted" required type="checkbox" /><span>I have read and understood this engagement letter. I agree to its terms and intend my typed name to be my electronic signature.</span></label>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Accept by {formatDate(letter.expiresAt)}</p><SubmitButton pendingText="Recording signature..."><FileSignature className="h-4 w-4" />Sign engagement letter</SubmitButton></div>
            </form>
          </CardContent>
        </Card>
      ) : letter.status !== "completed" ? <p className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900"><Clock3 className="h-4 w-4" />Your signature is complete. IFTA will complete the remaining approval.</p> : null}
    </div>
  );
}
