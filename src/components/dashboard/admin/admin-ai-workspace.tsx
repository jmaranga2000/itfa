import Link from "next/link";
import {
  Archive,
  Bot,
  ExternalLink,
  FilePenLine,
  FileSearch,
  Landmark,
  LibraryBig,
  MessageSquareText,
  Plus,
  Scale,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClassName } from "@/components/ui/button";
import {
  archiveAdminAiConversationAction,
  sendAdminAiMessageAction,
} from "@/features/ai/actions";
import { AI_WORKSPACE_KEYS, AI_WORKSPACES, type AiWorkspaceKey } from "@/features/ai/workspaces";
import type { AiConversationRecord } from "@/repositories/ai-conversation-repository";
import { cn } from "@/lib/utils";

const workspaceIcons = {
  research: Search,
  kra_assessment: FileSearch,
  tax_objection: FilePenLine,
  legal_research: LibraryBig,
  tat_appeal: Scale,
  document_drafting: Landmark,
} satisfies Record<AiWorkspaceKey, typeof Search>;

const errorMessages: Record<string, string> = {
  invalid: "Add at least ten characters and choose the correct assistant before sending.",
  "not-configured": "OpenAI is not connected yet. Add the API key, then test the connection.",
  conversation: "That conversation is no longer available or belongs to another administrator.",
  provider: "The AI provider could not complete that message. Your question is saved, so you can try again.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function WorkspacePicker() {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {AI_WORKSPACE_KEYS.map((key) => {
        const workspace = AI_WORKSPACES[key];
        const Icon = workspaceIcons[key];
        return (
          <label className="group relative cursor-pointer" key={key}>
            <input
              className="peer sr-only"
              defaultChecked={key === "research"}
              name="workspaceKey"
              type="radio"
              value={key}
            />
            <span className="flex h-full min-h-28 items-start gap-3 rounded-md border border-border bg-background p-4 transition-colors group-hover:border-primary/50 peer-checked:border-primary peer-checked:bg-brand-soft">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-primary peer-checked:bg-background">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">{workspace.shortLabel}</span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                  {workspace.description}
                </span>
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function NewConversationForm({ configured }: { configured: boolean }) {
  return (
    <section className="p-5 lg:p-6">
      <div className="mb-5 max-w-3xl">
        <p className="text-xs font-bold uppercase text-primary">New conversation</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">Choose a specialist assistant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Each assistant follows a task-specific professional prompt and keeps its work in one traceable conversation.
        </p>
      </div>
      <form action={sendAdminAiMessageAction} className="space-y-5">
        <WorkspacePicker />
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="new-ai-message">
            What do you need help with?
          </label>
          <textarea
            className="min-h-40 w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20"
            disabled={!configured}
            id="new-ai-message"
            maxLength={12000}
            minLength={10}
            name="message"
            placeholder="Include the client context, relevant dates, amounts, documents available, and the outcome you need."
            required
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
            Review every result before relying on it or sending it to a client. Sensitive client data should only be included when necessary.
          </p>
          <SubmitButton disabled={!configured} pendingText="Preparing response...">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Start conversation
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}

function ConversationView({
  conversation,
  configured,
  principalId,
}: {
  conversation: AiConversationRecord;
  configured: boolean;
  principalId: string;
}) {
  const canContinue = conversation.createdByUserId === principalId;
  return (
    <div className="min-w-0">
      <header className="flex flex-col justify-between gap-3 border-b border-border bg-muted/20 p-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-sm bg-brand-soft px-2 py-1 text-xs font-bold text-primary">
              {conversation.workspaceLabel}
            </span>
            <span className="text-xs text-muted-foreground">{conversation.model}</span>
          </div>
          <h2 className="mt-2 break-words text-lg font-bold text-foreground">{conversation.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Started by {conversation.createdByEmail} · {formatDate(conversation.lastActivityAt)}
          </p>
        </div>
        <form action={archiveAdminAiConversationAction}>
          <input name="conversationId" type="hidden" value={conversation.id} />
          <SubmitButton pendingText="Archiving..." size="sm" variant="secondary">
            <Archive aria-hidden="true" className="h-4 w-4" />
            Archive
          </SubmitButton>
        </form>
      </header>

      <div className="max-h-[58vh] space-y-5 overflow-y-auto p-4 sm:p-6">
        {conversation.messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <article className={cn("flex", isUser ? "justify-end" : "justify-start")} key={message.id}>
              <div
                className={cn(
                  "max-w-[92%] rounded-md px-4 py-3 sm:max-w-[82%]",
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-muted/35 text-foreground",
                )}
              >
                <div className="mb-2 flex items-center gap-2 text-xs font-bold">
                  {isUser ? <Users aria-hidden="true" className="h-3.5 w-3.5" /> : <Bot aria-hidden="true" className="h-3.5 w-3.5" />}
                  {isUser ? "You" : conversation.workspaceLabel}
                </div>
                <div className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">
                  {message.content}
                </div>
                {message.sources.length > 0 ? (
                  <div className={cn("mt-4 border-t pt-3", isUser ? "border-primary-foreground/25" : "border-border")}>
                    <p className="mb-2 text-xs font-bold">Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source) => (
                        <a
                          className={cn(
                            "inline-flex max-w-full items-center gap-1 rounded-sm border px-2 py-1 text-xs underline-offset-2 hover:underline",
                            isUser ? "border-primary-foreground/30" : "border-border bg-background",
                          )}
                          href={source.url}
                          key={`${message.id}-${source.url}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span className="truncate">{source.title}</span>
                          <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
                <p className={cn("mt-3 text-[11px]", isUser ? "text-primary-foreground/75" : "text-muted-foreground")}>
                  {formatDate(message.createdAt)}
                  {!isUser && message.totalTokens > 0 ? ` · ${message.totalTokens.toLocaleString()} tokens` : ""}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="border-t border-border bg-background p-4">
        {canContinue ? (
          <form action={sendAdminAiMessageAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input name="conversationId" type="hidden" value={conversation.id} />
            <input name="workspaceKey" type="hidden" value={conversation.workspaceKey} />
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="ai-reply">
                Continue this conversation
              </label>
              <textarea
                className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20"
                disabled={!configured}
                id="ai-reply"
                maxLength={12000}
                minLength={10}
                name="message"
                placeholder="Add facts, ask for revisions, or request the next draft."
                required
              />
            </div>
            <SubmitButton className="sm:mb-0.5" disabled={!configured} pendingText="Sending...">
              <Send aria-hidden="true" className="h-4 w-4" />
              Send
            </SubmitButton>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            This conversation belongs to {conversation.createdByEmail}. It is available here for oversight and audit review.
          </p>
        )}
      </div>
    </div>
  );
}

export function AdminAiWorkspace({
  configured,
  conversations,
  activeConversation,
  summary,
  principalId,
  error,
  archived,
}: {
  configured: boolean;
  conversations: AiConversationRecord[];
  activeConversation: AiConversationRecord | null;
  summary: { conversations: number; messages: number; totalTokens: number; users: number };
  principalId: string;
  error?: string;
  archived?: boolean;
}) {
  return (
    <AdminPageSurface
      actions={(
        <Link className={buttonClassName({ size: "sm" })} href="/admin/ai-usage?new=1">
          <Plus aria-hidden="true" className="h-4 w-4" />
          New conversation
        </Link>
      )}
      description="Use focused professional assistants, review their sources, and retain a clear record of every AI-assisted task."
      icon={Sparkles}
      summary={[
        { label: "Conversations", value: summary.conversations, helper: "Active work", icon: MessageSquareText },
        { label: "Messages", value: summary.messages, helper: "Questions and responses", icon: Bot },
        { label: "Tokens", value: summary.totalTokens.toLocaleString(), helper: "Recorded usage", icon: Sparkles },
        { label: "Administrators", value: summary.users, helper: "AI workspace users", icon: Users },
      ]}
      title="AI activity"
    >
      {!configured ? (
        <div className="flex flex-col justify-between gap-3 border-b border-amber-300 bg-amber-50 px-5 py-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">OpenAI connection required</p>
            <p className="text-sm opacity-80">Connect and test OpenAI before starting a conversation.</p>
          </div>
          <Link className={buttonClassName({ size: "sm", variant: "secondary" })} href="/admin/integrations/openai">
            Manage connection
          </Link>
        </div>
      ) : null}
      {error && errorMessages[error] ? (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {errorMessages[error]}
        </div>
      ) : null}
      {archived ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          Conversation archived.
        </div>
      ) : null}

      <div className="grid min-w-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-muted/15 lg:border-b-0 lg:border-r">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-bold text-foreground">Recent conversations</p>
          </div>
          <nav aria-label="AI conversations" className="max-h-[72vh] overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <p className="p-3 text-sm leading-5 text-muted-foreground">No conversations yet.</p>
            ) : conversations.map((conversation) => (
              <Link
                className={cn(
                  "mb-1 block rounded-md border px-3 py-3 transition-colors",
                  activeConversation?.id === conversation.id
                    ? "border-primary bg-brand-soft"
                    : "border-transparent hover:border-border hover:bg-background",
                )}
                href={`/admin/ai-usage?conversation=${conversation.id}`}
                key={conversation.id}
              >
                <p className="line-clamp-2 text-sm font-semibold text-foreground">{conversation.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{conversation.workspaceLabel}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{formatDate(conversation.lastActivityAt)}</p>
              </Link>
            ))}
          </nav>
        </aside>

        {activeConversation ? (
          <ConversationView
            configured={configured}
            conversation={activeConversation}
            principalId={principalId}
          />
        ) : (
          <NewConversationForm configured={configured} />
        )}
      </div>
    </AdminPageSurface>
  );
}
