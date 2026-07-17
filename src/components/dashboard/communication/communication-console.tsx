import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Megaphone,
  Paperclip,
  Plus,
  Send,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { sendConversationMessageAction } from "@/features/communication/actions";
import type {
  CommunicationConversation,
  CommunicationHubData,
} from "@/repositories/communication-repository";
import { cn } from "@/lib/utils";

const typeLabels: Record<CommunicationConversation["type"], string> = {
  direct: "Direct",
  engagement: "Engagement",
  announcement: "Announcement",
};

const statusLabels: Record<CommunicationConversation["status"], string> = {
  open: "Open",
  waiting_for_admin: "Waiting for admin",
  waiting_for_staff: "Waiting for staff",
  waiting_for_client: "Waiting for client",
  resolved: "Resolved",
  closed: "Closed",
};

function dateLabel(value: string | null) {
  if (!value) {
    return "No activity";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusTone(status: CommunicationConversation["status"]) {
  if (status === "waiting_for_admin" || status === "waiting_for_staff") {
    return "gold" as const;
  }

  if (status === "waiting_for_client") {
    return "teal" as const;
  }

  if (status === "resolved" || status === "closed") {
    return "green" as const;
  }

  return "slate" as const;
}

function EmptyConversation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No conversations yet</CardTitle>
        <CardDescription>
          Conversations will appear when admins, staff or clients send messages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-sm leading-6 text-muted-foreground">
          The communication module is ready to receive direct conversations, engagement threads
          and announcements.
        </div>
      </CardContent>
    </Card>
  );
}

export function CommunicationConsole({
  data,
  audienceLabel,
  baseHref,
  newMessageHref,
  principalId,
}: {
  data: CommunicationHubData;
  audienceLabel: string;
  baseHref: string;
  newMessageHref?: string;
  principalId: string;
}) {
  const activeConversation = data.activeConversation;

  return (
    <div className="grid min-w-0 max-w-full gap-5 overflow-x-hidden">
      <section className="min-w-0 rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge tone="teal">Communication centre</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Messages and conversations
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Centralized communication between admins, staff and clients.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            {newMessageHref ? (
              <Link className={buttonClassName()} href={newMessageHref}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                New client message
              </Link>
            ) : null}
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {[
                ["Open", data.summary.openConversations],
                ["Unread", data.summary.unreadMessages],
                ["Firm", data.summary.waitingForFirm],
                ["Client", data.summary.waitingForClient],
              ].map(([label, value]) => (
                <div className="rounded-md border border-border px-3 py-2" key={label}>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                  <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 max-w-full gap-5 xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(260px,320px)]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>{audienceLabel}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {data.conversations.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                No conversations found.
              </p>
            ) : (
              data.conversations.map((conversation) => {
                const active = activeConversation?.id === conversation.id;

                return (
                  <Link
                    className={cn(
                      "min-w-0 max-w-full overflow-hidden rounded-md border px-3 py-3 transition-colors",
                      active
                        ? "border-accent bg-muted"
                        : "border-border hover:border-accent hover:bg-muted/60",
                    )}
                    href={`${baseHref}?conversation=${encodeURIComponent(conversation.id)}`}
                    key={conversation.id}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {conversation.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {conversation.lastMessagePreview || "No messages yet"}
                        </p>
                      </div>
                      <Badge className="shrink-0" tone={statusTone(conversation.status)}>
                        {typeLabels[conversation.type]}
                      </Badge>
                    </div>
                    <div className="mt-3 flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{statusLabels[conversation.status]}</span>
                      <span className="shrink-0">{dateLabel(conversation.lastActivityAt)}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {activeConversation ? (
          <Card className="min-h-[620px] min-w-0 overflow-hidden">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <CardTitle>{activeConversation.title}</CardTitle>
                  <CardDescription>
                    {typeLabels[activeConversation.type]} conversation.
                  </CardDescription>
                </div>
                <Badge tone={statusTone(activeConversation.status)}>
                  {statusLabels[activeConversation.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid min-w-0 gap-4 overflow-hidden pt-5">
              {data.messages.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                  No messages have been sent in this conversation.
                </div>
              ) : (
                data.messages.map((message) => {
                  const mine = message.senderUserId === principalId;
                  return <div className={cn("flex min-w-0", mine ? "justify-end" : "justify-start")} key={message.id}>
                  <article className={cn("min-w-0 max-w-[85%] overflow-hidden rounded-md border p-4 md:max-w-[72%]", mine ? "border-brand-deep bg-brand-deep text-white" : "border-brand-mist bg-brand-soft text-brand-deep")}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold">{mine ? "You" : message.senderName}</p>
                      <span className={cn("text-xs", mine ? "text-white/70" : "text-brand-deep/65")}>
                        {dateLabel(message.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{message.body}</p>
                    {message.attachmentCount > 0 ? (
                      <p className={cn("mt-3 inline-flex items-center gap-2 text-xs font-semibold", mine ? "text-white/70" : "text-brand-deep/65")}>
                        <Paperclip aria-hidden="true" className="h-3.5 w-3.5" />
                        {message.attachmentCount} attachment{message.attachmentCount === 1 ? "" : "s"}
                      </p>
                    ) : null}
                  </article>
                  </div>;
                })
              )}

              <form
                action={sendConversationMessageAction}
                className="grid min-w-0 gap-3 border-t border-border pt-4"
              >
                <input
                  name="conversationId"
                  type="hidden"
                  value={activeConversation.id}
                />
                <input name="returnPath" type="hidden" value={baseHref} />
                <label className="text-sm font-semibold text-foreground" htmlFor="body">
                  Reply
                </label>
                <Textarea
                  className="min-h-28"
                  id="body"
                  maxLength={6000}
                  name="body"
                  placeholder="Write your reply..."
                  required
                />
                <div className="flex justify-end">
                  <SubmitButton pendingText="Sending...">
                    <Send aria-hidden="true" className="h-4 w-4" />
                    Send reply
                  </SubmitButton>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <EmptyConversation />
        )}

        <Card className="min-w-0 overflow-hidden xl:col-span-2 2xl:col-span-1">
          <CardHeader>
            <CardTitle>Conversation details</CardTitle>
            <CardDescription>Participants, resource link and current status.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {activeConversation ? (
              <>
                <div className="grid gap-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Participants
                  </p>
                  {activeConversation.participants.map((participant) => (
                    <div className="min-w-0 overflow-hidden rounded-md border border-border px-3 py-2" key={participant.userId}>
                      <div className="flex items-center gap-2">
                        <Users aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                        <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                          {participant.displayName}
                        </p>
                      </div>
                      <p className="mt-1 break-all text-xs text-muted-foreground">{participant.email}</p>
                    </div>
                  ))}
                </div>

                {activeConversation.relatedModule !== "messages" ? (
                  <div className="grid gap-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Related resource
                    </p>
                    <Link
                      className={buttonClassName({
                        variant: "secondary",
                        className: "justify-between",
                      })}
                      href={activeConversation.actionUrl}
                    >
                      Open resource
                      <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">
                Select a conversation to view details.
              </div>
            )}

            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2">
                <AlertCircle aria-hidden="true" className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-foreground">Notification routing</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                New messages notify every other participant and redirect to the conversation.
              </p>
            </div>

            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2">
                <Megaphone aria-hidden="true" className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-foreground">Announcements</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {data.announcements.length} recent announcement
                {data.announcements.length === 1 ? "" : "s"} visible to this user.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
