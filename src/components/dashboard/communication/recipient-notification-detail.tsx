import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BellRing, Check, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { markNotificationReadAction } from "@/features/communication/actions";
import type { CommunicationNotification } from "@/repositories/communication-repository";

const typeLabels: Record<string, string> = {
  announcement: "Information",
  action_required: "Action required",
  new_message: "New message",
  new_engagement: "New engagement",
  engagement_update: "Engagement update",
  kyc_update: "KYC update",
  document_uploaded: "Document uploaded",
  document_approved: "Document approved",
  task_assigned: "Task assigned",
  invoice_generated: "Invoice generated",
  payment_received: "Payment received",
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RecipientNotificationDetail({
  backHref,
  notification,
}: {
  backHref: string;
  notification: CommunicationNotification;
}) {
  const actionRequired = notification.type === "action_required";

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="min-w-0">
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                href={backHref}
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Back to notifications
              </Link>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge tone={actionRequired ? "red" : "teal"}>
                  {typeLabels[notification.type] ?? "Notification"}
                </Badge>
                <Badge tone={notification.readAt ? "slate" : "gold"}>
                  {notification.readAt ? "Read" : "New"}
                </Badge>
              </div>
              <CardTitle className="mt-3 text-2xl">{notification.title}</CardTitle>
              <CardDescription className="mt-2 flex items-center gap-2">
                <Clock3 aria-hidden="true" className="h-4 w-4" />
                {dateLabel(notification.createdAt)}
              </CardDescription>
            </div>
            {!notification.readAt ? (
              <form action={markNotificationReadAction}>
                <input name="notificationId" type="hidden" value={notification.id} />
                <button
                  className={buttonClassName({ variant: "secondary" })}
                  type="submit"
                >
                  <Check aria-hidden="true" className="h-4 w-4" />
                  Mark as read
                </button>
              </form>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="p-5 md:p-7">
          <div className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-brand-soft text-primary">
              <BellRing aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="whitespace-pre-wrap text-base leading-8 text-foreground">
                {notification.description}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">Related area</p>
              <p className="mt-1 text-sm capitalize text-muted-foreground">
                {notification.relatedModule}
                {notification.relatedRecordId ? ` · ${notification.relatedRecordId}` : ""}
              </p>
            </div>
            <Link className={buttonClassName()} href={notification.actionUrl}>
              Open related page
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
