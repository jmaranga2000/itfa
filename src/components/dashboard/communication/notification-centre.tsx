import Link from "next/link";
import { ArrowUpRight, Bell, Check, Search } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/communication/actions";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommunicationHubData } from "@/repositories/communication-repository";

const typeLabels: Record<string, string> = {
  new_message: "New message",
  new_engagement: "New engagement",
  engagement_update: "Engagement update",
  kyc_update: "KYC update",
  document_uploaded: "Document uploaded",
  document_approved: "Document approved",
  task_assigned: "Task assigned",
  invoice_generated: "Invoice generated",
  payment_received: "Payment received",
  announcement: "Announcement",
  action_required: "Action required",
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function notificationTone(type: string, readAt: string | null) {
  if (readAt) {
    return "slate" as const;
  }

  if (type === "action_required") {
    return "red" as const;
  }

  if (type === "announcement") {
    return "teal" as const;
  }

  return "gold" as const;
}

export function NotificationCentre({
  data,
  detailBaseHref,
}: {
  data: CommunicationHubData;
  detailBaseHref?: string;
}) {
  const unread = data.notifications.filter((notification) => !notification.readAt);
  const actionRequired = data.notifications.filter(
    (notification) => notification.type === "action_required" && !notification.readAt,
  );

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge tone="gold">Notification centre</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              Notifications
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Alerts, announcements and action items from the portal.
            </p>
          </div>
          <form action={markAllNotificationsReadAction}>
            <button className={buttonClassName({ variant: "secondary" })} type="submit">
              <Check aria-hidden="true" className="h-4 w-4" />
              Mark all read
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        {[
          ["Unread", unread.length],
          ["Action required", actionRequired.length],
          ["Announcements", data.announcements.length],
          ["Total", data.notifications.length],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl font-bold">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <CardTitle>Notification inbox</CardTitle>
                <CardDescription>Newest notifications first.</CardDescription>
              </div>
              <label className="relative w-full max-w-sm">
                <span className="sr-only">Search notifications</span>
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  placeholder="Search notifications"
                  type="search"
                />
              </label>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.notifications.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              data.notifications.map((notification) => (
                <article
                  className="grid gap-3 rounded-md border border-border p-4 lg:grid-cols-[1fr_auto]"
                  key={notification.id}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={notificationTone(notification.type, notification.readAt)}>
                        {typeLabels[notification.type] ?? notification.type}
                      </Badge>
                      {!notification.readAt ? <Badge tone="red">Unread</Badge> : null}
                      <span className="text-xs text-muted-foreground">
                        {dateLabel(notification.createdAt)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-sm font-semibold text-foreground">
                      {notification.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {notification.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link
                      className={buttonClassName({ variant: "secondary", size: "sm" })}
                      href={
                        detailBaseHref
                          ? `${detailBaseHref}/${notification.id}`
                          : notification.actionUrl
                      }
                    >
                      Open
                      <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                    {!notification.readAt ? (
                      <form action={markNotificationReadAction}>
                        <input name="notificationId" type="hidden" value={notification.id} />
                        <button className={buttonClassName({ variant: "ghost", size: "sm" })} type="submit">
                          <Check aria-hidden="true" className="h-4 w-4" />
                          Read
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent announcements</CardTitle>
            <CardDescription>Visible to your role.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.announcements.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">
                No announcements.
              </div>
            ) : (
              data.announcements.map((announcement) => (
                <Link
                  className="rounded-md border border-border px-3 py-3 transition-colors hover:border-accent"
                  href={announcement.actionUrl}
                  key={announcement.id}
                >
                  <div className="flex items-start gap-2">
                    <Bell aria-hidden="true" className="mt-0.5 h-4 w-4 text-accent" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {announcement.body}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
