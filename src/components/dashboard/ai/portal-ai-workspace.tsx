import Link from "next/link";
import {
  Archive,
  Bot,
  ExternalLink,
  FilePenLine,
  FileSearch,
  Landmark,
  LibraryBig,
  Plus,
  Scale,
  Search,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  archivePortalAiConversationAction,
  sendPortalAiMessageAction,
} from "@/features/ai/actions";
import { AI_WORKSPACES, type AiWorkspaceKey } from "@/features/ai/workspaces";
import { cn } from "@/lib/utils";
import type { AiConversationRecord } from "@/repositories/ai-conversation-repository";

const workspaceIcons = {
  research: Search,
  kra_assessment: FileSearch,
  tax_objection: FilePenLine,
  legal_research: LibraryBig,
  tat_appeal: Scale,
  document_drafting: Landmark,
} satisfies Record<AiWorkspaceKey, typeof Search>;

const errors: Record<string, string> = {
  invalid: "Choose an assistant and enter a clear question of at least ten characters.",
  "not-configured": "The AI service is not connected. Please contact an administrator.",
  conversation: "That conversation is no longer available.",
  provider: "The AI service could not complete the response. Your message was saved, so you can try again.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function Conversation({
  configured,
  conversation,
  portal,
}: {
  configured: boolean;
  conversation: AiConversationRecord;
  portal: "staff" | "client";
}) {
  return (
    <div className="min-w-0">
      <header className="flex flex-col justify-between gap-3 border-b border-border bg-muted/20 p-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><Badge tone="teal">{conversation.workspaceLabel}</Badge><span className="text-xs text-muted-foreground">Updated {formatDate(conversation.lastActivityAt)}</span></div>
          <h2 className="mt-2 break-words text-lg font-bold text-foreground">{conversation.title}</h2>
        </div>
        <form action={archivePortalAiConversationAction}>
          <input name="conversationId" type="hidden" value={conversation.id} />
          <input name="portal" type="hidden" value={portal} />
          <SubmitButton pendingText="Archiving..." size="sm" variant="secondary"><Archive className="h-4 w-4" />Archive</SubmitButton>
        </form>
      </header>
      <div className="max-h-[58vh] space-y-4 overflow-y-auto p-4 sm:p-6">
        {conversation.messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <article className={cn("flex", isUser ? "justify-end" : "justify-start")} key={message.id}>
              <div className={cn("max-w-[92%] rounded-md px-4 py-3 sm:max-w-[82%]", isUser ? "bg-primary text-primary-foreground" : "border border-border bg-muted/35 text-foreground")}>
                <p className="mb-2 flex items-center gap-2 text-xs font-bold">{isUser ? <UserRound className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}{isUser ? "You" : conversation.workspaceLabel}</p>
                <div className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{message.content}</div>
                {message.sources.length ? <div className={cn("mt-4 border-t pt-3", isUser ? "border-primary-foreground/25" : "border-border")}><p className="mb-2 text-xs font-bold">Sources</p><div className="flex flex-wrap gap-2">{message.sources.map((source) => <a className={cn("inline-flex max-w-full items-center gap-1 rounded-sm border px-2 py-1 text-xs hover:underline", isUser ? "border-primary-foreground/30" : "border-border bg-background")} href={source.url} key={`${message.id}-${source.url}`} rel="noreferrer" target="_blank"><span className="truncate">{source.title}</span><ExternalLink className="h-3 w-3 shrink-0" /></a>)}</div></div> : null}
                <p className={cn("mt-3 text-[11px]", isUser ? "text-primary-foreground/75" : "text-muted-foreground")}>{formatDate(message.createdAt)}</p>
              </div>
            </article>
          );
        })}
      </div>
      <form action={sendPortalAiMessageAction} className="flex flex-col gap-3 border-t border-border bg-background p-4 sm:flex-row sm:items-end">
        <input name="conversationId" type="hidden" value={conversation.id} />
        <input name="portal" type="hidden" value={portal} />
        <input name="workspaceKey" type="hidden" value={conversation.workspaceKey} />
        <label className="grid min-w-0 flex-1 gap-2 text-sm font-semibold text-foreground">Continue this conversation<textarea className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" disabled={!configured} maxLength={12000} minLength={10} name="message" placeholder="Add facts, ask a follow-up question, or request a revision." required /></label>
        <SubmitButton disabled={!configured} pendingText="Preparing response..."><Send className="h-4 w-4" />Send</SubmitButton>
      </form>
    </div>
  );
}

export function PortalAiWorkspace({
  activeConversation,
  archived,
  availableWorkspaces,
  configured,
  conversations,
  error,
  portal,
}: {
  activeConversation: AiConversationRecord | null;
  archived?: boolean;
  availableWorkspaces: readonly AiWorkspaceKey[];
  configured: boolean;
  conversations: AiConversationRecord[];
  error?: string;
  portal: "staff" | "client";
}) {
  const basePath = `/${portal}/ai`;
  const clientView = portal === "client";
  return (
    <div className="grid min-w-0 gap-5">
      <section className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-center">
        <div><Badge tone="teal">AI workspace</Badge><h1 className="mt-3 text-2xl font-bold text-foreground">{clientView ? "IFTA AI assistant" : "Professional AI tools"}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{clientView ? "Research questions, understand KRA documents and prepare drafts to discuss with your IFTA adviser." : "Use specialist research, tax, legal and drafting assistants with saved conversation history."}</p></div>
        <Link className={buttonClassName()} href={`${basePath}?new=1`}><Plus className="h-4 w-4" />New conversation</Link>
      </section>
      {!configured ? <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">The AI connection is not available. Please contact an administrator.</p> : null}
      {error && errors[error] ? <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{errors[error]}</p> : null}
      {archived ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Conversation archived.</p> : null}
      <section className="overflow-hidden rounded-md border border-border bg-card lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-muted/15 lg:border-b-0 lg:border-r"><p className="border-b border-border px-4 py-3 text-sm font-bold text-foreground">Recent conversations</p><nav className="max-h-[70vh] overflow-y-auto p-2">{conversations.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No conversations yet.</p> : conversations.map((conversation) => <Link className={cn("mb-1 block rounded-md border px-3 py-3", activeConversation?.id === conversation.id ? "border-primary bg-brand-soft" : "border-transparent hover:border-border hover:bg-background")} href={`${basePath}?conversation=${conversation.id}`} key={conversation.id}><p className="line-clamp-2 text-sm font-semibold text-foreground">{conversation.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{conversation.workspaceLabel}</p><p className="mt-2 text-[11px] text-muted-foreground">{formatDate(conversation.lastActivityAt)}</p></Link>)}</nav></aside>
        {activeConversation ? <Conversation configured={configured} conversation={activeConversation} portal={portal} /> : (
          <div className="p-5 lg:p-6"><div className="mb-5"><p className="text-xs font-bold uppercase text-primary">New conversation</p><h2 className="mt-1 text-xl font-bold text-foreground">Choose an assistant</h2></div><form action={sendPortalAiMessageAction} className="grid gap-5"><input name="portal" type="hidden" value={portal} /><div className="grid gap-2 md:grid-cols-2">{availableWorkspaces.map((key) => { const workspace = AI_WORKSPACES[key]; const Icon = workspaceIcons[key]; return <label className="cursor-pointer" key={key}><input className="peer sr-only" defaultChecked={key === availableWorkspaces[0]} name="workspaceKey" type="radio" value={key} /><span className="flex h-full min-h-24 items-start gap-3 rounded-md border border-border p-4 hover:border-primary/50 peer-checked:border-primary peer-checked:bg-brand-soft"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-primary"><Icon className="h-4 w-4" /></span><span><span className="block font-semibold text-foreground">{workspace.shortLabel}</span><span className="mt-1 block text-sm leading-5 text-muted-foreground">{workspace.description}</span></span></span></label>; })}</div><label className="grid gap-2 text-sm font-semibold text-foreground">What do you need help with?<textarea className="min-h-40 w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" disabled={!configured} maxLength={12000} minLength={10} name="message" placeholder={clientView ? "Describe your question, important dates and the document or decision you need help understanding." : "Include the client context, dates, amounts, available evidence and the outcome you need."} required /></label><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="max-w-2xl text-xs leading-5 text-muted-foreground">AI responses can contain errors. Review important tax, legal and financial decisions with a qualified IFTA adviser.</p><SubmitButton disabled={!configured} pendingText="Preparing response..."><Sparkles className="h-4 w-4" />Start conversation</SubmitButton></div></form></div>
        )}
      </section>
    </div>
  );
}
