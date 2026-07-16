import type { Principal } from "@/features/authorization/access-control";
import type { CommunicationModule, NotificationType } from "@/features/communication/types";
import { createCommunicationNotification } from "@/repositories/communication-repository";

type EventNotificationInput = {
  recipientUserIds: string[];
  actor?: Principal | null;
  title: string;
  description: string;
  relatedRecordId?: string | null;
  actionUrl: string;
};

type EventDefinition = {
  type: NotificationType;
  relatedModule: CommunicationModule;
};

const eventDefinitions = {
  newMessage: { type: "new_message", relatedModule: "messages" },
  engagementCreated: { type: "new_engagement", relatedModule: "engagements" },
  engagementAssigned: { type: "new_engagement", relatedModule: "engagements" },
  engagementUpdated: { type: "engagement_update", relatedModule: "engagements" },
  kycSubmitted: { type: "kyc_update", relatedModule: "kyc" },
  kycApproved: { type: "kyc_update", relatedModule: "kyc" },
  documentUploaded: { type: "document_uploaded", relatedModule: "documents" },
  documentApproved: { type: "document_approved", relatedModule: "documents" },
  invoiceGenerated: { type: "invoice_generated", relatedModule: "invoices" },
  paymentReceived: { type: "payment_received", relatedModule: "payments" },
  taskAssigned: { type: "task_assigned", relatedModule: "tasks" },
  taskOverdue: { type: "action_required", relatedModule: "tasks" },
  announcementPublished: { type: "announcement", relatedModule: "announcements" },
} satisfies Record<string, EventDefinition>;

async function notifyEvent(definition: EventDefinition, input: EventNotificationInput) {
  await Promise.all(
    input.recipientUserIds.map((recipientUserId) =>
      createCommunicationNotification({
        recipientUserId,
        type: definition.type,
        title: input.title,
        description: input.description,
        relatedModule: definition.relatedModule,
        relatedRecordId: input.relatedRecordId ?? null,
        actionUrl: input.actionUrl,
        createdByUserId: input.actor?.id ?? null,
      }),
    ),
  );
}

export function notifyNewMessage(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.newMessage, input);
}

export function notifyEngagementCreated(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.engagementCreated, input);
}

export function notifyEngagementAssigned(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.engagementAssigned, input);
}

export function notifyEngagementUpdated(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.engagementUpdated, input);
}

export function notifyKycSubmitted(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.kycSubmitted, input);
}

export function notifyKycApproved(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.kycApproved, input);
}

export function notifyDocumentUploaded(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.documentUploaded, input);
}

export function notifyDocumentApproved(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.documentApproved, input);
}

export function notifyInvoiceGenerated(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.invoiceGenerated, input);
}

export function notifyPaymentReceived(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.paymentReceived, input);
}

export function notifyTaskAssigned(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.taskAssigned, input);
}

export function notifyTaskOverdue(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.taskOverdue, input);
}

export function notifyAnnouncementPublished(input: EventNotificationInput) {
  return notifyEvent(eventDefinitions.announcementPublished, input);
}
