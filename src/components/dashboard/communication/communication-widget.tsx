import Link from "next/link";
import { ArrowUpRight, Bell, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommunicationHubData } from "@/repositories/communication-repository";

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

export function CommunicationWidget({
  data,
  messagesHref,
  notificationsHref,
}: {
  data: CommunicationHubData;
  messagesHref: string;
  notificationsHref: string;
}) {
  const topNotifications = data.notifications.slice(0, 3);
  const topConversations = data.conversations.slice(0, 3);

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <CardTitle>Communication</CardTitle>
            <CardDescription>Messages, replies and announcements.</CardDescription>
          </div>
          <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={messagesHref}>
            Open messages
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Unread", data.summary.unreadMessages],
              ["Open", data.summary.openConversations],
              ["Announcements", data.summary.recentAnnouncements],
            ].map(([label, value]) => (
              <div className="rounded-md border border-border px-3 py-2" key={label}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {topConversations.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              No conversations yet.
            </div>
          ) : (
            topConversations.map((conversation) => (
              <Link
                className="flex items-start gap-3 rounded-md border border-border px-3 py-3 transition-colors hover:border-accent"
                href={conversation.actionUrl}
                key={conversation.id}
              >
                <MessageSquareText
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {conversation.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {conversation.lastMessagePreview || "No messages yet"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {dateLabel(conversation.lastActivityAt)}
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Unread alerts and required actions.</CardDescription>
          </div>
          <Link
            className={buttonClassName({ variant: "secondary", size: "sm" })}
            href={notificationsHref}
          >
            Open centre
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone={data.summary.unreadNotifications > 0 ? "gold" : "green"}>
              {data.summary.unreadNotifications} unread
            </Badge>
            <Badge tone={data.summary.actionRequired > 0 ? "red" : "slate"}>
              {data.summary.actionRequired} action required
            </Badge>
          </div>

          {topNotifications.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            topNotifications.map((notification) => (
              <Link
                className="flex items-start gap-3 rounded-md border border-border px-3 py-3 transition-colors hover:border-accent"
                href={notification.actionUrl}
                key={notification.id}
              >
                <Bell aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {notification.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {notification.description}
                  </p>
                </div>
                {!notification.readAt ? <Badge tone="red">New</Badge> : null}
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
