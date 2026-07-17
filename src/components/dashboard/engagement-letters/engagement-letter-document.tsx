import { CheckCircle2, CircleDashed, FileCheck2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EngagementLetterRecord } from "@/repositories/engagement-letter-repository";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "long",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function LetterBody({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm leading-7 text-foreground">
      {content.split("\n").map((line, index) => {
        const value = line.trim();
        if (!value) return <div className="h-1" key={`space-${index}`} />;
        if (value.startsWith("# ")) return <h2 className="pt-2 text-2xl font-bold text-brand-deep dark:text-foreground" key={index}>{value.slice(2)}</h2>;
        if (value.startsWith("## ")) return <h3 className="border-b border-border pt-4 pb-2 text-base font-bold text-foreground" key={index}>{value.slice(3)}</h3>;
        if (/^\d+\.\s/.test(value)) return <p className="pl-4" key={index}>{value}</p>;
        return <p className="whitespace-pre-wrap" key={index}>{value}</p>;
      })}
    </div>
  );
}

export function SignatureRegister({ letter }: { letter: EngagementLetterRecord }) {
  return (
    <section className="border-t border-border bg-muted/15 px-5 py-5 sm:px-8">
      <div className="mb-4 flex items-center gap-2">
        <FileCheck2 aria-hidden="true" className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground">Electronic signature register</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {letter.signers.filter((signer) => signer.required || signer.status === "signed").map((signer) => (
          <div className="rounded-md border border-border bg-background p-4" key={signer.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">{signer.role === "ifta" ? "For IFTA Consulting" : "For the client"}</p>
                <p className="mt-2 text-sm font-bold text-foreground">{signer.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{signer.title}</p>
              </div>
              <Badge tone={signer.status === "signed" ? "green" : "gold"}>{signer.status === "signed" ? "Signed" : "Pending"}</Badge>
            </div>
            {signer.status === "signed" ? (
              <div className="mt-4 border-t border-border pt-3">
                <p className="font-serif text-xl italic text-primary">{signer.signatureText}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />Signed {signer.signedAt ? formatDate(signer.signedAt) : ""}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">Evidence: {signer.signatureHash?.slice(0, 16)}...</p>
              </div>
            ) : (
              <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground"><CircleDashed className="h-3.5 w-3.5" />Awaiting electronic signature</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function EngagementLetterDocument({ letter }: { letter: EngagementLetterRecord }) {
  const address = [letter.company.address, letter.company.city, letter.company.country].filter(Boolean).join(", ");
  return (
    <article className="overflow-hidden rounded-md border border-border bg-card shadow-sm print:border-0 print:shadow-none">
      <header className="border-b-4 border-primary bg-brand-soft px-5 py-6 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xl font-black text-brand-deep">{letter.company.tradingName}</p>
            <p className="mt-1 text-xs font-semibold text-brand-deep/75">Professional consulting and advisory services</p>
          </div>
          <div className="text-left text-xs leading-5 text-brand-deep/80 sm:text-right">
            {letter.company.email ? <p>{letter.company.email}</p> : null}
            {letter.company.phone ? <p>{letter.company.phone}</p> : null}
            {address ? <p>{address}</p> : null}
          </div>
        </div>
      </header>
      <div className="grid gap-5 border-b border-border px-5 py-5 sm:grid-cols-2 sm:px-8">
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground">Prepared for</p>
          <p className="mt-2 font-bold text-foreground">{letter.clientName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{letter.clientEmail}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase text-muted-foreground">Letter reference</p>
          <p className="mt-2 font-bold text-foreground">{letter.reference}</p>
          <p className="mt-1 text-sm text-muted-foreground">Issued {formatDate(letter.generatedAt)}</p>
        </div>
      </div>
      <div className="px-5 py-6 sm:px-8 sm:py-8">
        <LetterBody content={letter.content} />
      </div>
      <SignatureRegister letter={letter} />
      <footer className="flex items-start gap-2 border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-8">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Electronic signatures are linked to this document fingerprint: <span className="break-all font-mono">{letter.contentHash}</span>
      </footer>
    </article>
  );
}
