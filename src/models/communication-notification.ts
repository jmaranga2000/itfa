import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  COMMUNICATION_MODULES,
  NOTIFICATION_TYPES,
} from "@/features/communication/types";

const communicationNotificationSchema = new Schema(
  {
    recipientUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, required: true, enum: NOTIFICATION_TYPES, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    relatedModule: {
      type: String,
      required: true,
      enum: COMMUNICATION_MODULES,
      index: true,
    },
    relatedRecordId: { type: String, default: null, index: true },
    actionUrl: { type: String, required: true },
    createdByUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    announcementId: { type: Schema.Types.ObjectId, default: null, index: true },
    readAt: { type: Date, default: null, index: true },
    archivedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "communication_notifications",
    timestamps: { createdAt: true, updatedAt: false },
  },
);

communicationNotificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });
communicationNotificationSchema.index({ relatedModule: 1, relatedRecordId: 1 });

export type CommunicationNotificationDocument = InferSchemaType<
  typeof communicationNotificationSchema
>;

export const CommunicationNotificationModel =
  (mongoose.models.CommunicationNotification as
    | Model<CommunicationNotificationDocument>
    | undefined) ??
  mongoose.model<CommunicationNotificationDocument>(
    "CommunicationNotification",
    communicationNotificationSchema,
  );
