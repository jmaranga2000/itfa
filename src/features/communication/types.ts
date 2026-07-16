export const CONVERSATION_TYPES = ["direct", "engagement", "announcement"] as const;

export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export const CONVERSATION_STATUSES = [
  "open",
  "waiting_for_admin",
  "waiting_for_staff",
  "waiting_for_client",
  "resolved",
  "closed",
] as const;

export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const COMMUNICATION_MODULES = [
  "messages",
  "engagements",
  "kyc",
  "documents",
  "invoices",
  "payments",
  "tasks",
  "workflows",
  "announcements",
  "system",
] as const;

export type CommunicationModule = (typeof COMMUNICATION_MODULES)[number];

export const NOTIFICATION_TYPES = [
  "new_message",
  "new_engagement",
  "engagement_update",
  "kyc_update",
  "document_uploaded",
  "document_approved",
  "task_assigned",
  "invoice_generated",
  "payment_received",
  "announcement",
  "action_required",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const ANNOUNCEMENT_AUDIENCES = [
  "everyone",
  "all_staff",
  "all_clients",
  "selected_users",
] as const;

export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

export const ATTACHMENT_TYPES = ["pdf", "docx", "xlsx", "csv", "jpg", "png"] as const;

export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

export type ConversationParticipantRole = "admin" | "staff" | "client";
