import { Types } from "mongoose";
import { assertPermission, type Principal } from "@/features/authorization/access-control";
import type { AppRole } from "@/features/authorization/roles";
import type {
  AnnouncementAudience,
  CommunicationModule,
  NotificationType,
} from "@/features/communication/types";
import { writeAuditLog } from "@/features/audit/audit-service";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CommunicationAnnouncementModel } from "@/models/communication-announcement";
import { CommunicationNotificationModel } from "@/models/communication-notification";
import { UserModel } from "@/models/user";

const clientRoles: AppRole[] = ["client", "client_representative"];
const staffRoles: AppRole[] = [
  "engagement_manager",
  "consultant",
  "reviewer",
  "finance_officer",
  "document_controller",
  "support_staff",
  "auditor",
];

export type AdminNotificationInput = {
  title: string;
  body: string;
  audience: Exclude<AnnouncementAudience, "selected_users">;
  notificationType: Extract<NotificationType, "announcement" | "action_required">;
  relatedModule: CommunicationModule;
  relatedRecordId: string | null;
  actionUrl: string;
  expiresAt: Date | null;
};

export type AdminNotificationRecord = {
  id: string;
  title: string;
  body: string;
  audience: AdminNotificationInput["audience"];
  notificationType: AdminNotificationInput["notificationType"];
  relatedModule: CommunicationModule;
  relatedRecordId: string | null;
  actionUrl: string;
  publishedAt: string;
  expiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  recipientCount: number;
  readCount: number;
  unreadCount: number;
};

type RawAnnouncement = {
  _id: Types.ObjectId;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  notificationType?: NotificationType;
  relatedModule?: CommunicationModule;
  relatedRecordId?: string | null;
  actionUrl?: string | null;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

type DeliverySummary = {
  _id: Types.ObjectId;
  recipientCount: number;
  readCount: number;
};

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function requiredDate(value: Date | null | undefined) {
  return serializeDate(value) ?? new Date().toISOString();
}

function toObjectId(value: string) {
  return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
}

function normalizeActionUrl(value: string) {
  const url = value.trim();
  return url.startsWith("/") ? url : "/";
}

function mapAnnouncement(
  announcement: RawAnnouncement,
  summary?: DeliverySummary,
): AdminNotificationRecord {
  const recipientCount = summary?.recipientCount ?? 0;
  const readCount = summary?.readCount ?? 0;

  return {
    id: announcement._id.toString(),
    title: announcement.title,
    body: announcement.body,
    audience:
      announcement.audience === "all_clients" || announcement.audience === "all_staff"
        ? announcement.audience
        : "everyone",
    notificationType:
      announcement.notificationType === "action_required" ? "action_required" : "announcement",
    relatedModule: announcement.relatedModule ?? "announcements",
    relatedRecordId: announcement.relatedRecordId ?? null,
    actionUrl: announcement.actionUrl ?? "/",
    publishedAt: requiredDate(announcement.publishedAt),
    expiresAt: serializeDate(announcement.expiresAt),
    createdAt: serializeDate(announcement.createdAt),
    updatedAt: serializeDate(announcement.updatedAt),
    recipientCount,
    readCount,
    unreadCount: Math.max(recipientCount - readCount, 0),
  };
}

function recipientFilter(audience: AdminNotificationInput["audience"]) {
  const roleKeys: AppRole[] =
    audience === "all_clients"
      ? clientRoles
      : audience === "all_staff"
        ? staffRoles
        : [...clientRoles, ...staffRoles];

  return {
    status: { $ne: "archived" as const },
    roleKeys: { $in: roleKeys },
  };
}

async function synchronizeRecipients(
  announcementId: Types.ObjectId,
  input: AdminNotificationInput,
  actor: Principal,
) {
  const recipients = (await UserModel.find(recipientFilter(input.audience))
    .select("_id")
    .lean()
    .exec()) as Array<{ _id: Types.ObjectId }>;
  const recipientIds = recipients.map((recipient) => recipient._id);
  const recipientIdSet = new Set(recipientIds.map((recipientId) => recipientId.toString()));
  const actorId = toObjectId(actor.id);
  const now = new Date();

  if (recipientIds.length === 0) {
    await CommunicationNotificationModel.updateMany(
      { announcementId, archivedAt: null },
      { $set: { archivedAt: now } },
    ).exec();
    return 0;
  }

  const existing = (await CommunicationNotificationModel.find({ announcementId })
    .select("recipientUserId")
    .lean()
    .exec()) as Array<{ recipientUserId: Types.ObjectId }>;
  const existingIds = new Set(
    existing.map((notification) => notification.recipientUserId.toString()),
  );
  const newRecipientIds = recipientIds.filter(
    (recipientId) => !existingIds.has(recipientId.toString()),
  );

  await CommunicationNotificationModel.updateMany(
    { announcementId, recipientUserId: { $in: recipientIds } },
    {
      $set: {
        type: input.notificationType,
        title: input.title,
        description: input.body,
        relatedModule: input.relatedModule,
        relatedRecordId: input.relatedRecordId,
        actionUrl: normalizeActionUrl(input.actionUrl),
        createdByUserId: actorId,
        expiresAt: input.expiresAt,
        archivedAt: null,
      },
    },
  ).exec();

  if (newRecipientIds.length > 0) {
    await CommunicationNotificationModel.insertMany(
      newRecipientIds.map((recipientUserId) => ({
        recipientUserId,
        type: input.notificationType,
        title: input.title,
        description: input.body,
        relatedModule: input.relatedModule,
        relatedRecordId: input.relatedRecordId,
        actionUrl: normalizeActionUrl(input.actionUrl),
        createdByUserId: actorId,
        announcementId,
        readAt: null,
        expiresAt: input.expiresAt,
        archivedAt: null,
      })),
    );
  }

  const removedRecipientIds = existing
    .map((notification) => notification.recipientUserId)
    .filter((recipientId) => !recipientIdSet.has(recipientId.toString()));
  if (removedRecipientIds.length > 0) {
    await CommunicationNotificationModel.updateMany(
      { announcementId, recipientUserId: { $in: removedRecipientIds } },
      { $set: { archivedAt: now } },
    ).exec();
  }

  return recipientIds.length;
}

async function deliverySummaries(announcementIds: Types.ObjectId[]) {
  if (announcementIds.length === 0) return new Map<string, DeliverySummary>();

  const summaries = (await CommunicationNotificationModel.aggregate([
    {
      $match: {
        announcementId: { $in: announcementIds },
        archivedAt: null,
      },
    },
    {
      $group: {
        _id: "$announcementId",
        recipientCount: { $sum: 1 },
        readCount: {
          $sum: {
            $cond: [{ $ne: ["$readAt", null] }, 1, 0],
          },
        },
      },
    },
  ]).exec()) as DeliverySummary[];

  return new Map(summaries.map((summary) => [summary._id.toString(), summary]));
}

export async function listAdminNotifications() {
  await connectToDatabase();
  const announcements = (await CommunicationAnnouncementModel.find({
    archivedAt: null,
    audience: { $in: ["everyone", "all_staff", "all_clients"] },
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean()
    .exec()) as RawAnnouncement[];
  const summaries = await deliverySummaries(
    announcements.map((announcement) => announcement._id),
  );

  return announcements.map((announcement) =>
    mapAnnouncement(announcement, summaries.get(announcement._id.toString())),
  );
}

export async function getAdminNotification(notificationId: string) {
  await connectToDatabase();
  const objectId = toObjectId(notificationId);
  if (!objectId) return null;

  const announcement = (await CommunicationAnnouncementModel.findOne({
    _id: objectId,
    archivedAt: null,
    audience: { $in: ["everyone", "all_staff", "all_clients"] },
  })
    .lean()
    .exec()) as RawAnnouncement | null;
  if (!announcement) return null;

  const summaries = await deliverySummaries([objectId]);
  return mapAnnouncement(announcement, summaries.get(notificationId));
}

export async function createAdminNotification(input: AdminNotificationInput, actor: Principal) {
  assertPermission(actor, "settings.manage");
  await connectToDatabase();
  const publisherId = toObjectId(actor.id);
  if (!publisherId) throw new Error("Cannot create a notification for an invalid administrator.");

  const announcement = await CommunicationAnnouncementModel.create({
    ...input,
    actionUrl: normalizeActionUrl(input.actionUrl),
    selectedUserIds: [],
    sendEmail: false,
    publishedByUserId: publisherId,
    publishedAt: new Date(),
    archivedAt: null,
  });
  const announcementId = announcement._id as Types.ObjectId;
  const recipientCount = await synchronizeRecipients(announcementId, input, actor);

  await writeAuditLog({
    actor,
    action: "notification.created",
    resourceType: "NotificationBroadcast",
    resourceId: announcementId.toString(),
    newValues: { ...input, recipientCount },
  });

  return announcementId.toString();
}

export async function updateAdminNotification(
  notificationId: string,
  input: AdminNotificationInput,
  actor: Principal,
) {
  assertPermission(actor, "settings.manage");
  await connectToDatabase();
  const objectId = toObjectId(notificationId);
  if (!objectId) return false;

  const previous = await CommunicationAnnouncementModel.findOne({
    _id: objectId,
    archivedAt: null,
  })
    .lean()
    .exec();
  if (!previous) return false;

  await CommunicationAnnouncementModel.updateOne(
    { _id: objectId },
    {
      $set: {
        ...input,
        actionUrl: normalizeActionUrl(input.actionUrl),
        selectedUserIds: [],
      },
    },
  ).exec();
  const recipientCount = await synchronizeRecipients(objectId, input, actor);

  await writeAuditLog({
    actor,
    action: "notification.updated",
    resourceType: "NotificationBroadcast",
    resourceId: notificationId,
    previousValues: previous,
    newValues: { ...input, recipientCount },
  });

  return true;
}

export async function archiveAdminNotification(notificationId: string, actor: Principal) {
  assertPermission(actor, "settings.manage");
  await connectToDatabase();
  const objectId = toObjectId(notificationId);
  if (!objectId) return false;

  const archivedAt = new Date();
  const announcement = await CommunicationAnnouncementModel.findOneAndUpdate(
    { _id: objectId, archivedAt: null },
    { $set: { archivedAt } },
    { new: false },
  )
    .lean()
    .exec();
  if (!announcement) return false;

  await CommunicationNotificationModel.updateMany(
    { announcementId: objectId, archivedAt: null },
    { $set: { archivedAt } },
  ).exec();
  await writeAuditLog({
    actor,
    action: "notification.archived",
    resourceType: "NotificationBroadcast",
    resourceId: notificationId,
    previousValues: announcement,
  });

  return true;
}
