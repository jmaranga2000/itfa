import Link from "next/link";
import { Download, FilePlus2, FolderOpen, MessageSquareReply } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ClientDocumentRecord } from "@/repositories/client-portal-repository";

function statusTone(status: string) {
  if (["approved", "final"].includes(status)) return "green" as const;
  if (status === "replacement_requested") return "gold" as const;
  return "teal" as const;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(value));
}

export function ClientDocuments({ documents, notice }: { documents: ClientDocumentRecord[]; notice?: string }) {
  const shared = documents.filter((document) => document.direction === "received").length;
  const feedback = documents.filter((document) => document.status === "replacement_requested").length;

  return (
    <div className="grid min-w-0 gap-5">
      {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p> : null}
      <section className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-center">
        <div>
          <Badge tone="teal">Engagement files</Badge>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Documents</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Upload evidence, download files shared by IFTA and respond to review feedback.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={buttonClassName({ variant: "secondary" })} href="/client/documents/shared"><FolderOpen className="h-4 w-4" />Shared files ({shared})</Link>
          <Link className={buttonClassName({ variant: "secondary" })} href="/client/documents/feedback"><MessageSquareReply className="h-4 w-4" />Feedback ({feedback})</Link>
          <Link className={buttonClassName()} href="/client/documents/upload"><FilePlus2 className="h-4 w-4" />Upload document</Link>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>All documents</CardTitle>
          <CardDescription>{documents.length} file{documents.length === 1 ? "" : "s"} across your engagements.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {documents.length === 0 ? (
            <EmptyState title="No documents yet" description="Files you upload or receive from IFTA will appear here." />
          ) : documents.map((document) => (
            <div className="flex flex-col justify-between gap-3 border-t border-border py-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-center" key={document.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{document.name}</p><Badge tone={statusTone(document.status)}>{document.status.replaceAll("_", " ")}</Badge></div>
                <p className="mt-1 text-sm text-muted-foreground">{document.engagementReference} | {document.direction === "sent" ? "Uploaded by you" : "Shared by IFTA"} | {dateLabel(document.uploadedAt)}</p>
              </div>
              {document.downloadHref ? <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={document.downloadHref}><Download className="h-4 w-4" />Download</Link> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
