import Link from "next/link";
import { BellRing, CheckCheck, FilePenLine, Megaphone, Plus, Users } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminNotificationRecord } from "@/repositories/admin-notification-repository";

const audienceLabels: Record<AdminNotificationRecord["audience"], string> = {
  all_clients: "Clients",
  all_staff: "Staff",
  everyone: "Clients and staff",
};

function dateLabel(value: string | null) {
  if (!value) return "No expiry";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminNotificationManager({
  deleted,
  notifications,
}: {
  deleted?: boolean;
  notifications: AdminNotificationRecord[];
}) {
  const delivered = notifications.reduce(
    (total, notification) => total + notification.recipientCount,
    0,
  );
  const unread = notifications.reduce(
    (total, notification) => total + notification.unreadCount,
    0,
  );
  const actionRequired = notifications.filter(
    (notification) => notification.notificationType === "action_required",
  ).length;

  return (
    <AdminPageSurface
      actions={
        <Link className={buttonClassName()} href="/admin/notifications/new">
          <Plus aria-hidden="true" className="h-4 w-4" />
          New notification
        </Link>
      }
      description="Create one notification, choose its audience, and track delivery across staff and client inboxes."
      icon={BellRing}
      summary={[
        {
          label: "Notifications",
          value: notifications.length,
          helper: "Active broadcasts",
          icon: Megaphone,
        },
        {
          label: "Delivered",
          value: delivered,
          helper: "Recipient inbox entries",
          icon: Users,
        },
        {
          label: "Unread",
          value: unread,
          helper: "Still waiting to be read",
          icon: BellRing,
        },
        {
          label: "Action needed",
          value: actionRequired,
          helper: "Action-required broadcasts",
          icon: CheckCheck,
        },
      ]}
      title="Notifications"
    >
      {deleted ? (
        <p className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">
          The notification was removed from recipient inboxes.
        </p>
      ) : null}

      {notifications.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Notification</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <p className="max-w-md truncate font-semibold text-foreground">
                      {notification.title}
                    </p>
                    <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                      {notification.body}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge tone="teal">{audienceLabels[notification.audience]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      tone={
                        notification.notificationType === "action_required" ? "red" : "slate"
                      }
                    >
                      {notification.notificationType === "action_required"
                        ? "Action required"
                        : "Information"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-foreground">
                      {notification.readCount}/{notification.recipientCount} read
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {notification.unreadCount} unread
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateLabel(notification.expiresAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className={buttonClassName({ size: "sm", variant: "secondary" })}
                      href={`/admin/notifications/${notification.id}`}
                    >
                      <FilePenLine aria-hidden="true" className="h-4 w-4" />
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid justify-items-center gap-3 px-5 py-14 text-center">
          <BellRing aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">No notifications have been created</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create the first client or staff notification.
            </p>
          </div>
          <Link className={buttonClassName()} href="/admin/notifications/new">
            <Plus aria-hidden="true" className="h-4 w-4" />
            New notification
          </Link>
        </div>
      )}
    </AdminPageSurface>
  );
}
