import Link from "next/link";
import { ArrowUpRight, Bell, Check } from "lucide-react";
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
    <Card className="overflow-hidden shadow-none">
      <CardHeader className="gap-5 border-b border-border">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <CardTitle className="text-2xl">Notifications</CardTitle>
            <CardDescription className="mt-1">
              Read important updates and open anything that needs your action.
            </CardDescription>
          </div>
          <form action={markAllNotificationsReadAction}>
            <button className={buttonClassName({ variant: "secondary" })} type="submit">
              <Check aria-hidden="true" className="h-4 w-4" />
              Mark all read
            </button>
          </form>
        </div>
        <div className="grid overflow-hidden rounded-md border border-border bg-background sm:grid-cols-4">
          {[
            ["Unread", unread.length],
            ["Action needed", actionRequired.length],
            ["Announcements", data.announcements.length],
            ["All messages", data.notifications.length],
          ].map(([label, value], index) => (
            <div
              className={[
                "px-4 py-3",
                index > 0 ? "border-t border-border sm:border-l sm:border-t-0" : "",
              ].join(" ")}
              key={label}
            >
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {data.notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {data.notifications.map((notification) => (
              <article
                className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center"
                key={notification.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={notificationTone(notification.type, notification.readAt)}>
                      {typeLabels[notification.type] ?? notification.type}
                    </Badge>
                    {!notification.readAt ? <span className="h-2 w-2 rounded-full bg-danger" title="Unread" /> : null}
                    <span className="text-xs text-muted-foreground">{dateLabel(notification.createdAt)}</span>
                  </div>
                  <h2 className="mt-2 text-sm font-semibold text-foreground">{notification.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {!notification.readAt ? (
                    <form action={markNotificationReadAction}>
                      <input name="notificationId" type="hidden" value={notification.id} />
                      <button className={buttonClassName({ variant: "ghost", size: "sm" })} type="submit">
                        <Check aria-hidden="true" className="h-4 w-4" />
                        Mark read
                      </button>
                    </form>
                  ) : null}
                  <Link
                    className={buttonClassName({ variant: "secondary", size: "sm" })}
                    href={detailBaseHref ? `${detailBaseHref}/${notification.id}` : notification.actionUrl}
                  >
                    Open
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>

      {data.announcements.length > 0 ? (
        <div className="border-t border-border bg-muted/20 px-5 py-4">
          <p className="mb-3 text-sm font-semibold text-foreground">Announcements</p>
          <div className="grid gap-3 md:grid-cols-2">
            {data.announcements.slice(0, 2).map((announcement) => (
              <Link className="flex items-start gap-2 text-sm" href={announcement.actionUrl} key={announcement.id}>
                <Bell aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold text-foreground">{announcement.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{announcement.body}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
