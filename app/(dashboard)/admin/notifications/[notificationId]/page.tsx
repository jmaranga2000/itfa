import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  MessageSquareText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/features/auth/server";
import { markNotificationReadAction } from "@/features/communication/actions";
import { getNotificationForPrincipal } from "@/repositories/communication-repository";

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

function dateLabel(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export default async function AdminNotificationDetailPage({
  params,
}: {
  params: Promise<{ notificationId: string }>;
}) {
  const [{ notificationId }, principal] = await Promise.all([params, requireUser()]);
  const notification = await getNotificationForPrincipal(principal, notificationId);

  if (!notification) {
    notFound();
  }

  const typeLabel = typeLabels[notification.type] ?? notification.type;
  const readState = notification.readAt ? "Read" : "Unread";
  const threadEvents = [
    {
      actor: "System",
      body: notification.description,
      label: typeLabel,
      time: notification.createdAt,
    },
    {
      actor: "Portal routing",
      body: `Linked this notification to ${notification.relatedModule}${
        notification.relatedRecordId ? ` record ${notification.relatedRecordId}` : ""
      }.`,
      label: "Related record",
      time: notification.createdAt,
    },
    {
      actor: principal.email,
      body: notification.readAt
        ? "You marked this notification as read."
        : "This notification is still waiting for review.",
      label: readState,
      time: notification.readAt ?? notification.createdAt,
    },
  ];

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={notificationTone(notification.type, notification.readAt)}>
                {typeLabel}
              </Badge>
              {!notification.readAt ? <Badge tone="red">Unread</Badge> : null}
              <span className="text-xs font-medium text-muted-foreground">
                {dateLabel(notification.createdAt)}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-foreground">
              {notification.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              A focused notification thread with the related record, status and available actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href="/admin/notifications"
            >
              Back to notifications
            </Link>
            <Link className={buttonClassName()} href={notification.actionUrl}>
              Open related record
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText aria-hidden="true" className="h-5 w-5 text-accent" />
              Notification thread
            </CardTitle>
            <CardDescription>
              Conversation-style activity for this notification and its linked work item.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {threadEvents.map((event, index) => (
                <article className="flex gap-3" key={`${event.actor}-${event.label}`}>
                  <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground">
                    {index === 0 ? (
                      <Bell aria-hidden="true" className="h-4 w-4" />
                    ) : index === 1 ? (
                      <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 rounded-md border border-border bg-background px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{event.actor}</p>
                      <span className="text-xs font-medium text-muted-foreground">
                        {dateLabel(event.time)}
                      </span>
                    </div>
                    <Badge className="mt-2" tone={index === 0 ? "gold" : "slate"}>
                      {event.label}
                    </Badge>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid content-start gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Current state and routing context.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Read state</span>
                <Badge tone={notification.readAt ? "green" : "red"}>{readState}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Module</span>
                <span className="font-semibold text-foreground">{notification.relatedModule}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground">Related record</span>
                <span className="break-words font-mono text-xs font-semibold text-foreground">
                  {notification.relatedRecordId ?? "Not linked"}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-muted-foreground">
                <Clock3 aria-hidden="true" className="h-4 w-4" />
                <span>{dateLabel(notification.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Resolve the notification or continue to the work item.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {!notification.readAt ? (
                <form action={markNotificationReadAction}>
                  <input name="notificationId" type="hidden" value={notification.id} />
                  <button
                    className={buttonClassName({ variant: "secondary", className: "w-full" })}
                    type="submit"
                  >
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Mark as read
                  </button>
                </form>
              ) : null}
              <Link className={buttonClassName({ className: "w-full" })} href={notification.actionUrl}>
                Open related record
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
