import Link from "next/link";
import { Save, Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminNotificationRecord } from "@/repositories/admin-notification-repository";

function dateTimeValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AdminNotificationForm({
  action,
  archiveAction,
  notification,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  archiveAction?: (formData: FormData) => Promise<void>;
  notification?: AdminNotificationRecord;
  submitLabel: string;
}) {
  return (
    <div>
      <form action={action}>
        {notification ? (
          <input name="notificationId" type="hidden" value={notification.id} />
        ) : null}

        <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="grid content-start gap-5">
            <div>
              <h2 className="text-base font-bold text-foreground">Message</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Write one clear update. Recipients will see this in their notification inbox.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                defaultValue={notification?.title}
                id="title"
                maxLength={180}
                name="title"
                placeholder="Quarterly portal maintenance"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="body">Notification message</Label>
              <Textarea
                className="min-h-52"
                defaultValue={notification?.body}
                id="body"
                maxLength={4000}
                name="body"
                placeholder="Explain what recipients need to know and what they should do next."
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="actionUrl">Where the Open button goes</Label>
                <Input
                  defaultValue={notification?.actionUrl ?? "/"}
                  id="actionUrl"
                  maxLength={500}
                  name="actionUrl"
                  placeholder="/client/documents"
                />
                <p className="text-xs text-muted-foreground">
                  Use a portal path beginning with `/`.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiresAt">Expiry date</Label>
                <Input
                  defaultValue={dateTimeValue(notification?.expiresAt)}
                  id="expiresAt"
                  name="expiresAt"
                  type="datetime-local"
                />
                <p className="text-xs text-muted-foreground">
                  Optional. The item remains visible when no date is set.
                </p>
              </div>
            </div>
          </section>

          <aside className="grid content-start gap-5 rounded-md border border-border bg-muted/20 p-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Delivery</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Choose who receives this notification and how it is presented.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="audience">Recipients</Label>
              <Select
                defaultValue={notification?.audience ?? "all_clients"}
                id="audience"
                name="audience"
              >
                <option value="all_clients">All clients</option>
                <option value="all_staff">All staff</option>
                <option value="everyone">Clients and staff</option>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notificationType">Notification type</Label>
              <Select
                defaultValue={notification?.notificationType ?? "announcement"}
                id="notificationType"
                name="notificationType"
              >
                <option value="announcement">Information</option>
                <option value="action_required">Action required</option>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="relatedModule">Related area</Label>
              <Select
                defaultValue={notification?.relatedModule ?? "announcements"}
                id="relatedModule"
                name="relatedModule"
              >
                <option value="announcements">General announcement</option>
                <option value="engagements">Engagements</option>
                <option value="kyc">KYC</option>
                <option value="documents">Documents</option>
                <option value="invoices">Invoices</option>
                <option value="payments">Payments</option>
                <option value="tasks">Tasks</option>
                <option value="workflows">Workflows</option>
                <option value="messages">Messages</option>
                <option value="system">System</option>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="relatedRecordId">Related record reference</Label>
              <Input
                defaultValue={notification?.relatedRecordId ?? ""}
                id="relatedRecordId"
                maxLength={160}
                name="relatedRecordId"
                placeholder="Optional"
              />
            </div>

            {notification ? (
              <div className="border-t border-border pt-4 text-sm">
                <div className="flex justify-between gap-3 py-1">
                  <span className="text-muted-foreground">Delivered</span>
                  <span className="font-semibold text-foreground">
                    {notification.recipientCount}
                  </span>
                </div>
                <div className="flex justify-between gap-3 py-1">
                  <span className="text-muted-foreground">Read</span>
                  <span className="font-semibold text-foreground">{notification.readCount}</span>
                </div>
                <div className="flex justify-between gap-3 py-1">
                  <span className="text-muted-foreground">Unread</span>
                  <span className="font-semibold text-foreground">
                    {notification.unreadCount}
                  </span>
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 p-4 sm:flex-row sm:justify-end">
          <Link
            className={buttonClassName({
              className: "w-full sm:w-auto",
              variant: "secondary",
            })}
            href="/admin/notifications"
          >
            Cancel
          </Link>
          <SubmitButton className="w-full sm:w-auto" pendingText="Saving notification...">
            <Save aria-hidden="true" className="h-4 w-4" />
            {submitLabel}
          </SubmitButton>
        </div>
      </form>

      {notification && archiveAction ? (
        <div className="border-t border-border p-4">
          <form action={archiveAction} className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <input name="notificationId" type="hidden" value={notification.id} />
            <div>
              <p className="text-sm font-semibold text-foreground">Delete this notification</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                It will be removed from every client and staff inbox.
              </p>
            </div>
            <SubmitButton
              className="w-full sm:w-auto"
              pendingText="Deleting..."
              variant="destructive"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Delete notification
            </SubmitButton>
          </form>
        </div>
      ) : null}
    </div>
  );
}
