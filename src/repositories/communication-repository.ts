import { Types } from "mongoose";
import {
  hasAnyPermission,
  hasPermission,
  type Principal,
} from "@/features/authorization/access-control";
import { sendNewPortalMessageEmail } from "@/features/communication/message-email";
import { sendPushNotificationToUser } from "@/features/communication/push-notifications";
import type {
  AnnouncementAudience,
  CommunicationModule,
  ConversationParticipantRole,
  ConversationStatus,
  ConversationType,
  NotificationType,
} from "@/features/communication/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuthorizationError } from "@/lib/errors";
import { clientRecipientName } from "@/lib/client-recipient";
import { CommunicationAnnouncementModel } from "@/models/communication-announcement";
import { CommunicationConversationModel } from "@/models/communication-conversation";
import { CommunicationMessageModel } from "@/models/communication-message";
import { CommunicationNotificationModel } from "@/models/communication-notification";
import { ClientDocumentModel } from "@/models/client-document";
import { EngagementRequestModel } from "@/models/engagement-request";
import { RequestStaffAssignmentModel } from "@/models/request-staff-assignment";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";

export type CommunicationParticipant = {
  userId: string;
  role: ConversationParticipantRole;
  displayName: string;
  email: string;
  lastReadAt: string | null;
};

export type CommunicationConversation = {
  id: string;
  title: string;
  type: ConversationType;
  status: ConversationStatus;
  participants: CommunicationParticipant[];
  relatedModule: CommunicationModule;
  relatedRecordId: string | null;
  actionUrl: string;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  lastActivityAt: string;
  createdAt: string | null;
};

export type CommunicationMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderName: string;
  body: string;
  attachmentCount: number;
  attachments: Array<{ fileName: string; fileType: string; fileSize: number | null; url: string }>;
  readByCount: number;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
};

export type CommunicationNotification = {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  description: string;
  relatedModule: CommunicationModule;
  relatedRecordId: string | null;
  actionUrl: string;
  readAt: string | null;
  createdAt: string;
};

export type CommunicationAnnouncement = {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  actionUrl: string;
  sendEmail: boolean;
  publishedAt: string;
  expiresAt: string | null;
};

export type CommunicationSummary = {
  unreadNotifications: number;
  unreadMessages: number;
  actionRequired: number;
  openConversations: number;
  waitingForFirm: number;
  waitingForClient: number;
  recentAnnouncements: number;
};

export type CommunicationHubData = {
  summary: CommunicationSummary;
  conversations: CommunicationConversation[];
  activeConversation: CommunicationConversation | null;
  messages: CommunicationMessage[];
  notifications: CommunicationNotification[];
  announcements: CommunicationAnnouncement[];
};

type RawParticipant = {
  userId: Types.ObjectId;
  role: ConversationParticipantRole;
  displayName: string;
  email: string;
  lastReadAt?: Date | null;
};

type RawConversation = {
  _id: Types.ObjectId;
  title: string;
  type: ConversationType;
  status: ConversationStatus;
  participants?: RawParticipant[];
  relatedModule?: CommunicationModule;
  relatedRecordId?: string | null;
  engagementId?: Types.ObjectId | null;
  actionUrl: string;
  lastMessagePreview?: string;
  lastMessageAt?: Date | null;
  lastActivityAt?: Date;
  createdAt?: Date | null;
};

type RawMessage = {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderUserId: Types.ObjectId;
  senderName: string;
  body: string;
  attachments?: Array<{ fileName: string; fileType: string; fileSize?: number | null; url: string }>;
  readReceipts?: unknown[];
  createdAt?: Date | null;
  editedAt?: Date | null;
  deletedAt?: Date | null;
};

type RawNotification = {
  _id: Types.ObjectId;
  recipientUserId: Types.ObjectId;
  type: NotificationType;
  title: string;
  description: string;
  relatedModule: CommunicationModule;
  relatedRecordId?: string | null;
  actionUrl: string;
  readAt?: Date | null;
  createdAt?: Date | null;
};

type RawAnnouncement = {
  _id: Types.ObjectId;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  actionUrl?: string | null;
  sendEmail?: boolean;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
};

type RawDirectoryUser = {
  _id: Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  roleKeys?: string[];
};

export type CreateNotificationInput = {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  description: string;
  relatedModule: CommunicationModule;
  relatedRecordId?: string | null;
  actionUrl: string;
  createdByUserId?: string | null;
  announcementId?: string | null;
};

export type CreateMessageInput = {
  conversationId: string;
  sender: Principal;
  body: string;
  attachmentDocumentId?: string | null;
  replyToMessageId?: string | null;
};

export type CreateDirectConversationInput = {
  clientUserId: string;
  sender: Principal;
  subject: string;
  body: string;
  engagementId?: string | null;
  relatedModule?: CommunicationModule;
  relatedRecordId?: string | null;
};

export type PublishAnnouncementInput = {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  selectedUserIds?: string[];
  actionUrl?: string;
  sendEmail?: boolean;
  publisher: Principal;
};

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function requiredDate(value: Date | null | undefined) {
  return serializeDate(value) ?? new Date().toISOString();
}

function toObjectId(value: string | null | undefined) {
  if (!value || !Types.ObjectId.isValid(value)) {
    return null;
  }

  return new Types.ObjectId(value);
}

function isObjectId(value: Types.ObjectId | null): value is Types.ObjectId {
  return value !== null;
}

function isClientPrincipal(principal: Principal) {
  return principal.roleKeys.some((role) => role === "client" || role === "client_representative");
}

function isAdminPrincipal(principal: Principal) {
  return (
    principal.roleKeys.some((role) => role === "super_admin" || role === "admin") ||
    hasAnyPermission(principal, ["permissions.manage", "settings.manage", "staff.manage"])
  );
}

function participantRoleForPrincipal(principal: Principal): ConversationParticipantRole {
  if (isAdminPrincipal(principal)) {
    return "admin";
  }

  if (isClientPrincipal(principal)) {
    return "client";
  }

  return "staff";
}

function messageActionUrl(role: ConversationParticipantRole, conversationId: string, engagementId?: string | null) {
  const portal = role === "client" ? "client" : role === "staff" ? "staff" : "admin";
  if (engagementId) {
    const base = role === "admin" ? "/admin/active-engagements" : `/${portal}/engagements`;
    return `${base}/${engagementId}?tab=messages`;
  }
  return "/" + portal + "/messages?conversation=" + conversationId;
}

function conversationAccessFilter(principal: Principal, includeArchived = false): Record<string, unknown> {
  const principalId = toObjectId(principal.id);
  const base = includeArchived ? {} : { archivedAt: null };

  if (isAdminPrincipal(principal)) {
    return base;
  }

  const clauses: Record<string, unknown>[] = [];

  if (principalId) {
    clauses.push({ "participants.userId": principalId });
    clauses.push({ assignedStaffUserId: principalId });
  }

  const organizationIds = principal.clientOrganizationIds.map(toObjectId).filter(isObjectId);
  const engagementIds = principal.assignedEngagementIds.map(toObjectId).filter(isObjectId);

  if (organizationIds.length > 0) {
    clauses.push({ clientOrganizationId: { $in: organizationIds } });
  }

  if (engagementIds.length > 0) {
    clauses.push({ engagementId: { $in: engagementIds } });
  }

  if (clauses.length === 0) {
    return { ...base, _id: null };
  }

  return { ...base, $or: clauses };
}

function announcementAccessFilter(principal: Principal): Record<string, unknown> {
  const principalId = toObjectId(principal.id);
  const audience = isClientPrincipal(principal) ? "all_clients" : "all_staff";
  const selectedUserClause = principalId ? [{ audience: "selected_users", selectedUserIds: principalId }] : [];

  return {
    archivedAt: null,
    $or: [{ audience: "everyone" }, { audience }, ...selectedUserClause],
    $and: [
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      },
    ],
  };
}

function serializeParticipant(participant: RawParticipant): CommunicationParticipant {
  return {
    userId: participant.userId.toString(),
    role: participant.role,
    displayName: participant.displayName,
    email: participant.email,
    lastReadAt: serializeDate(participant.lastReadAt),
  };
}

function serializeConversation(conversation: RawConversation): CommunicationConversation {
  return {
    id: conversation._id.toString(),
    title: conversation.title,
    type: conversation.type,
    status: conversation.status,
    participants: (conversation.participants ?? []).map(serializeParticipant),
    relatedModule: conversation.relatedModule ?? "messages",
    relatedRecordId: conversation.relatedRecordId ?? null,
    actionUrl: conversation.actionUrl,
    lastMessagePreview: conversation.lastMessagePreview ?? "",
    lastMessageAt: serializeDate(conversation.lastMessageAt),
    lastActivityAt: requiredDate(conversation.lastActivityAt),
    createdAt: serializeDate(conversation.createdAt),
  };
}

function serializeMessage(message: RawMessage): CommunicationMessage {
  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    senderUserId: message.senderUserId.toString(),
    senderName: message.senderName,
    body: message.body,
    attachmentCount: message.attachments?.length ?? 0,
    attachments: (message.attachments ?? []).map((attachment) => ({
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize ?? null,
      url: attachment.url,
    })),
    readByCount: message.readReceipts?.length ?? 0,
    createdAt: requiredDate(message.createdAt),
    editedAt: serializeDate(message.editedAt),
    deletedAt: serializeDate(message.deletedAt),
  };
}

function serializeNotification(notification: RawNotification): CommunicationNotification {
  return {
    id: notification._id.toString(),
    recipientUserId: notification.recipientUserId.toString(),
    type: notification.type,
    title: notification.title,
    description: notification.description,
    relatedModule: notification.relatedModule,
    relatedRecordId: notification.relatedRecordId ?? null,
    actionUrl: notification.actionUrl,
    readAt: serializeDate(notification.readAt),
    createdAt: requiredDate(notification.createdAt),
  };
}

function serializeAnnouncement(announcement: RawAnnouncement): CommunicationAnnouncement {
  return {
    id: announcement._id.toString(),
    title: announcement.title,
    body: announcement.body,
    audience: announcement.audience,
    actionUrl: announcement.actionUrl ?? "/notifications",
    sendEmail: announcement.sendEmail ?? false,
    publishedAt: requiredDate(announcement.publishedAt),
    expiresAt: serializeDate(announcement.expiresAt),
  };
}

function displayName(user: RawDirectoryUser) {
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name || user.email;
}

function roleForUser(user: RawDirectoryUser): ConversationParticipantRole {
  if (user.roleKeys?.some((role) => role === "super_admin" || role === "admin")) {
    return "admin";
  }

  if (user.roleKeys?.some((role) => role === "client" || role === "client_representative")) {
    return "client";
  }

  return "staff";
}

async function assertConversationAccess(principal: Principal, conversationId: string, includeArchived = false) {
  await connectToDatabase();

  const objectId = toObjectId(conversationId);

  if (!objectId) {
    throw new AuthorizationError("Conversation not found.");
  }

  const conversation = await CommunicationConversationModel.findOne({
    _id: objectId,
    ...conversationAccessFilter(principal, includeArchived),
  })
    .lean()
    .exec();

  if (!conversation) {
    throw new AuthorizationError("This conversation is outside your access scope.");
  }

  return conversation as RawConversation;
}

export async function listConversationsForPrincipal(principal: Principal, limit = 30) {
  await connectToDatabase();

  const conversations = await CommunicationConversationModel.find(conversationAccessFilter(principal))
    .sort({ lastActivityAt: -1, createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();

  return (conversations as RawConversation[]).map(serializeConversation);
}

export async function getOrCreateEngagementConversation(
  principal: Principal,
  workflow: {
    id: string;
    reference: string;
    clientName: string;
    clientUserId: string | null;
    status: string;
    team: Array<{ userId: string | null }>;
  },
) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(workflow.id)) return null;
  const existing = await CommunicationConversationModel.findOne({
    engagementId: new Types.ObjectId(workflow.id),
    ...(workflow.status === "archived" ? {} : { archivedAt: null }),
  }).lean().exec();
  if (["archived", "read_only"].includes(workflow.status)) {
    return existing ? serializeConversation(existing as RawConversation) : null;
  }

  const participantIds = [...new Set([
    workflow.clientUserId,
    ...workflow.team.map((member) => member.userId),
  ].filter((value): value is string => typeof value === "string" && Types.ObjectId.isValid(value)))];
  const users = await UserModel.find({ _id: { $in: participantIds }, status: { $ne: "archived" } })
    .select("email firstName lastName roleKeys")
    .lean()
    .exec() as RawDirectoryUser[];
  if (users.length === 0) return null;
  const now = new Date();
  const previousReadAt = new Map(
    ((existing as RawConversation | null)?.participants ?? [])
      .map((participant) => [participant.userId.toString(), participant.lastReadAt] as const),
  );
  const participants = users.map((user) => ({
    userId: user._id,
    role: roleForUser(user),
    displayName: displayName(user),
    email: user.email,
    lastReadAt: previousReadAt.get(user._id.toString())
      ?? (user._id.toString() === principal.id ? now : null),
  }));
  if (existing) {
    const synchronized = await CommunicationConversationModel.findByIdAndUpdate(
      existing._id,
      { $set: { title: `${workflow.reference} - ${workflow.clientName}`, participants } },
      { new: true },
    ).lean().exec();
    return synchronized ? serializeConversation(synchronized as RawConversation) : null;
  }
  const conversation = await CommunicationConversationModel.create({
    title: `${workflow.reference} - ${workflow.clientName}`,
    type: "engagement",
    status: "open",
    participants,
    relatedModule: "engagements",
    relatedRecordId: workflow.id,
    engagementId: new Types.ObjectId(workflow.id),
    actionUrl: `/client/engagements/${workflow.id}?tab=messages`,
    lastActivityAt: now,
    createdByUserId: new Types.ObjectId(principal.id),
    archivedAt: null,
  });
  return serializeConversation(conversation.toObject() as unknown as RawConversation);
}

export async function listMessagesForConversation(
  principal: Principal,
  conversationId: string,
  limit = 80,
  includeArchived = false,
) {
  const conversation = await assertConversationAccess(principal, conversationId, includeArchived);

  const messages = await CommunicationMessageModel.find({
    conversationId: conversation._id,
    deletedAt: null,
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean()
    .exec();

  return (messages as RawMessage[]).map(serializeMessage);
}

export async function listNotificationsForPrincipal(principal: Principal, limit = 50) {
  await connectToDatabase();

  const principalId = toObjectId(principal.id);

  if (!principalId) {
    return [];
  }

  const notifications = await CommunicationNotificationModel.find({
    recipientUserId: principalId,
    archivedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();

  return (notifications as RawNotification[]).map(serializeNotification);
}

export async function listUnreadNotificationsForPrincipal(principal: Principal, limit = 12) {
  await connectToDatabase();
  const principalId = toObjectId(principal.id);
  if (!principalId) return [];
  const notifications = await CommunicationNotificationModel.find({
    recipientUserId: principalId,
    archivedAt: null,
    readAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
  return (notifications as RawNotification[]).map(serializeNotification);
}

export async function getNotificationForPrincipal(
  principal: Principal,
  notificationId: string,
) {
  await connectToDatabase();

  const principalId = toObjectId(principal.id);
  const objectId = toObjectId(notificationId);

  if (!principalId || !objectId) {
    return null;
  }

  const notification = await CommunicationNotificationModel.findOne({
    _id: objectId,
    recipientUserId: principalId,
    archivedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .lean()
    .exec();

  return notification ? serializeNotification(notification as RawNotification) : null;
}

export async function listAnnouncementsForPrincipal(principal: Principal, limit = 10) {
  await connectToDatabase();

  const announcements = await CommunicationAnnouncementModel.find(announcementAccessFilter(principal))
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean()
    .exec();

  return (announcements as RawAnnouncement[]).map(serializeAnnouncement);
}

export async function getCommunicationHubData(
  principal: Principal,
  activeConversationId?: string,
): Promise<CommunicationHubData> {
  const [conversations, notifications, announcements] = await Promise.all([
    listConversationsForPrincipal(principal),
    listNotificationsForPrincipal(principal),
    listAnnouncementsForPrincipal(principal),
  ]);
  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ??
    conversations[0] ??
    null;
  const messages = activeConversation
    ? await listMessagesForConversation(principal, activeConversation.id)
    : [];
  const participantRole = participantRoleForPrincipal(principal);
  const unreadNotifications = notifications.filter((notification) => !notification.readAt).length;
  const unreadMessages = conversations.filter((conversation) =>
    conversation.participants.some(
      (participant) =>
        participant.userId === principal.id &&
        conversation.lastMessageAt &&
        (!participant.lastReadAt || participant.lastReadAt < conversation.lastMessageAt),
    ),
  ).length;

  return {
    summary: {
      unreadNotifications,
      unreadMessages,
      actionRequired: notifications.filter(
        (notification) => notification.type === "action_required" && !notification.readAt,
      ).length,
      openConversations: conversations.filter(
        (conversation) => conversation.status !== "resolved" && conversation.status !== "closed",
      ).length,
      waitingForFirm: conversations.filter((conversation) =>
        participantRole === "client"
          ? conversation.status === "waiting_for_client"
          : conversation.status === "waiting_for_admin" ||
            conversation.status === "waiting_for_staff",
      ).length,
      waitingForClient: conversations.filter(
        (conversation) => conversation.status === "waiting_for_client",
      ).length,
      recentAnnouncements: announcements.length,
    },
    conversations,
    activeConversation,
    messages,
    notifications,
    announcements,
  };
}

export async function createCommunicationNotification(input: CreateNotificationInput) {
  await connectToDatabase();

  const recipientUserId = toObjectId(input.recipientUserId);

  if (!recipientUserId) {
    throw new Error("Cannot create notification for an invalid recipient.");
  }

  const notification = await CommunicationNotificationModel.create({
    recipientUserId,
    type: input.type,
    title: input.title,
    description: input.description,
    relatedModule: input.relatedModule,
    relatedRecordId: input.relatedRecordId ?? null,
    actionUrl: input.actionUrl,
    createdByUserId: toObjectId(input.createdByUserId ?? null),
    announcementId: toObjectId(input.announcementId ?? null),
    readAt: null,
    archivedAt: null,
  });
  await sendPushNotificationToUser(recipientUserId.toString(), {
    notificationId: notification._id.toString(),
    title: input.title,
    body: input.description,
    actionUrl: input.actionUrl,
    tag: `${input.type}-${input.relatedRecordId ?? notification._id.toString()}`,
  });
  return notification;
}

export async function createConversationMessage(input: CreateMessageInput) {
  await connectToDatabase();

  const senderId = toObjectId(input.sender.id);

  if (!senderId) {
    throw new Error("Cannot create message for an invalid sender.");
  }

  const conversation = await assertConversationAccess(input.sender, input.conversationId);
  const now = new Date();
  const attachmentId = toObjectId(input.attachmentDocumentId ?? null);
  const attachment = attachmentId && conversation.engagementId
    ? await ClientDocumentModel.findOne({ _id: attachmentId, workflowId: conversation.engagementId }).lean().exec()
    : null;
  const extension = attachment?.name.split(".").pop()?.toLowerCase();
  const attachmentType = extension === "jpeg" ? "jpg" : extension === "doc" ? "docx" : extension;
  const message = await CommunicationMessageModel.create({
    conversationId: conversation._id,
    senderUserId: senderId,
    senderName: input.sender.email,
    body: input.body,
    attachments: attachment && attachmentType && ["pdf", "docx", "xlsx", "csv", "jpg", "png"].includes(attachmentType)
      ? [{
          fileName: attachment.name,
          fileType: attachmentType,
          fileSize: attachment.size,
          url: `/api/engagements/${conversation.engagementId}/documents/${attachment._id}`,
        }]
      : [],
    replyToMessageId: toObjectId(input.replyToMessageId ?? null),
    readReceipts: [{ userId: senderId, readAt: now }],
    deletedAt: null,
  });

  await CommunicationConversationModel.updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessagePreview: input.body.slice(0, 160),
        lastMessageAt: now,
        lastActivityAt: now,
        status: participantRoleForPrincipal(input.sender) === "client"
          ? "waiting_for_admin"
          : "waiting_for_client",
      },
    },
  ).exec();

  const recipients = (conversation.participants ?? []).filter(
    (participant) => participant.userId.toString() !== input.sender.id,
  );

  await Promise.all(
    recipients.map((participant) =>
      createCommunicationNotification({
        recipientUserId: participant.userId.toString(),
        type: "new_message",
        title: conversation.title,
        description: input.body.slice(0, 140),
        relatedModule: "messages",
        relatedRecordId: conversation._id.toString(),
        actionUrl: messageActionUrl(
          participant.role,
          conversation._id.toString(),
          conversation.engagementId?.toString() ?? null,
        ),
        createdByUserId: input.sender.id,
      }),
    ),
  );

  if (participantRoleForPrincipal(input.sender) !== "client") {
    const clientRecipients = recipients.filter(
      (participant) => participant.role === "client",
    );
    const clientUserIds = clientRecipients
      .map((participant) => toObjectId(participant.userId.toString()))
      .filter(isObjectId);
    const registeredClients = (await UserModel.find({
      _id: { $in: clientUserIds },
      roleKeys: { $in: ["client", "client_representative"] },
      status: "active",
    })
      .select("email firstName lastName roleKeys")
      .lean()
      .exec()) as RawDirectoryUser[];
    const registeredClientsById = new Map(
      registeredClients.map((client) => [client._id.toString(), client]),
    );

    await Promise.all(
      clientRecipients.map((participant) => {
        const registeredClient = registeredClientsById.get(
          participant.userId.toString(),
        );

        if (!registeredClient) {
          return Promise.resolve({
            delivered: false,
            reason: "The registered client account is not active.",
          });
        }

        return sendNewPortalMessageEmail({
            recipientEmail: registeredClient.email,
            recipientName: clientRecipientName(
              registeredClient,
              participant.displayName,
            ),
            conversationId: conversation._id.toString(),
            subject: conversation.title,
            messagePreview: input.body,
          });
      }),
    );
  }

  if (conversation.engagementId) {
    await WorkflowInstanceModel.updateOne(
      { _id: conversation.engagementId },
      {
        $set: { lastActivityAt: now },
        $push: { activity: {
          type: "message_sent",
          title: "Message Sent",
          actorName: input.sender.displayName || input.sender.email,
          actorUserId: senderId,
          description: input.body.slice(0, 180),
          relatedResource: conversation._id.toString(),
          clientVisible: true,
          createdAt: now,
        } },
      },
    ).exec();
  }

  return message;
}

export async function createDirectClientConversation(input: CreateDirectConversationInput) {
  await connectToDatabase();

  const senderId = toObjectId(input.sender.id);
  const clientId = toObjectId(input.clientUserId);

  const senderRole = participantRoleForPrincipal(input.sender);
  if (!senderId || !clientId || senderRole === "client") {
    throw new AuthorizationError("Only IFTA team members can start client conversations.");
  }

  if (!isAdminPrincipal(input.sender)) {
    const assignedRequestIds = (await RequestStaffAssignmentModel.find({ staffUserId: senderId })
      .distinct("requestId")
      .exec()) as string[];
    const [workflowAccess, requestAccess] = await Promise.all([
      WorkflowInstanceModel.exists({
        clientUserId: clientId,
        $or: [
          { responsibleUserId: senderId },
          { "team.userId": senderId },
          { "tasks.assignedUserId": senderId },
        ],
      }),
      EngagementRequestModel.exists({
        _id: { $in: assignedRequestIds.filter((requestId) => Types.ObjectId.isValid(requestId)) },
        clientUserId: clientId,
      }),
    ]);
    if (!workflowAccess && !requestAccess) {
      throw new AuthorizationError("Staff can only message clients assigned to their work.");
    }
  }

  const client = (await UserModel.findOne({
    _id: clientId,
    roleKeys: { $in: ["client", "client_representative"] },
    status: { $ne: "archived" },
  })
    .select("email firstName lastName roleKeys")
    .lean()
    .exec()) as RawDirectoryUser | null;

  if (!client) {
    throw new Error("The selected client account is not available.");
  }

  const now = new Date();
  const conversation = await CommunicationConversationModel.create({
    title: input.subject,
    type: input.engagementId ? "engagement" : "direct",
    status: "waiting_for_client",
    participants: [
      {
        userId: senderId,
        role: senderRole,
        displayName: input.sender.email,
        email: input.sender.email,
        lastReadAt: now,
      },
      {
        userId: client._id,
        role: "client",
        displayName: displayName(client),
        email: client.email,
        lastReadAt: null,
      },
    ],
    relatedModule: input.relatedModule ?? "messages",
    relatedRecordId: input.relatedRecordId ?? null,
    engagementId: toObjectId(input.engagementId),
    actionUrl: "/client/messages",
    lastMessagePreview: "",
    lastMessageAt: null,
    lastActivityAt: now,
    createdByUserId: senderId,
    archivedAt: null,
  });

  await createConversationMessage({
    conversationId: conversation._id.toString(),
    sender: input.sender,
    body: input.body,
  });

  return conversation._id.toString();
}

export async function markNotificationRead(principal: Principal, notificationId: string) {
  await connectToDatabase();

  const principalId = toObjectId(principal.id);
  const objectId = toObjectId(notificationId);

  if (!principalId || !objectId) {
    return null;
  }

  return CommunicationNotificationModel.updateOne(
    { _id: objectId, recipientUserId: principalId },
    { $set: { readAt: new Date() } },
  ).exec();
}

export async function markAllNotificationsRead(principal: Principal) {
  await connectToDatabase();

  const principalId = toObjectId(principal.id);

  if (!principalId) {
    return null;
  }

  return CommunicationNotificationModel.updateMany(
    { recipientUserId: principalId, readAt: null },
    { $set: { readAt: new Date() } },
  ).exec();
}

export async function markRelatedNotificationsRead(principal: Principal, relatedRecordId: string) {
  await connectToDatabase();
  const principalId = toObjectId(principal.id);
  if (!principalId || !relatedRecordId) return null;
  return CommunicationNotificationModel.updateMany(
    { recipientUserId: principalId, relatedRecordId, readAt: null },
    { $set: { readAt: new Date() } },
  ).exec();
}

export async function publishCommunicationAnnouncement(input: PublishAnnouncementInput) {
  await connectToDatabase();

  if (!hasPermission(input.publisher, "settings.manage")) {
    throw new AuthorizationError("Only administrators can publish announcements.");
  }

  const publisherId = toObjectId(input.publisher.id);

  if (!publisherId) {
    throw new Error("Cannot publish announcement for an invalid publisher.");
  }

  const selectedUserIds = (input.selectedUserIds ?? []).map(toObjectId).filter(isObjectId);
  const announcement = await CommunicationAnnouncementModel.create({
    title: input.title,
    body: input.body,
    audience: input.audience,
    selectedUserIds,
    actionUrl: input.actionUrl ?? "/notifications",
    sendEmail: input.sendEmail ?? false,
    publishedByUserId: publisherId,
    publishedAt: new Date(),
    archivedAt: null,
  });
  const announcementId = announcement._id as Types.ObjectId;
  let recipientQuery = UserModel.find({ status: { $ne: "archived" } }).select("_id");

  if (input.audience === "selected_users") {
    recipientQuery = recipientQuery.where("_id").in(selectedUserIds);
  } else if (input.audience === "all_clients") {
    recipientQuery = recipientQuery.where("roleKeys").in(["client", "client_representative"]);
  } else if (input.audience === "all_staff") {
    recipientQuery = recipientQuery.where("roleKeys").nin(["client", "client_representative"]);
  }

  const recipients = await recipientQuery.lean().exec();

  await Promise.all(
    (recipients as Array<{ _id: Types.ObjectId }>).map((recipient) =>
      createCommunicationNotification({
        recipientUserId: recipient._id.toString(),
        type: "announcement",
        title: input.title,
        description: input.body.slice(0, 140),
        relatedModule: "announcements",
        relatedRecordId: announcementId.toString(),
        actionUrl: input.actionUrl ?? "/notifications",
        createdByUserId: input.publisher.id,
        announcementId: announcementId.toString(),
      }),
    ),
  );

  return announcement;
}

export async function buildParticipantFromUserId(userId: string) {
  await connectToDatabase();

  const objectId = toObjectId(userId);

  if (!objectId) {
    return null;
  }

  const user = await UserModel.findById(objectId)
    .select("email firstName lastName roleKeys")
    .lean()
    .exec();

  if (!user) {
    return null;
  }

  const rawUser = user as RawDirectoryUser;

  return {
    userId: rawUser._id,
    role: roleForUser(rawUser),
    displayName: displayName(rawUser),
    email: rawUser.email,
    lastReadAt: null,
  };
}
