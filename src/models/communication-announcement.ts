import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ANNOUNCEMENT_AUDIENCES } from "@/features/communication/types";

const communicationAnnouncementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    audience: {
      type: String,
      required: true,
      enum: ANNOUNCEMENT_AUDIENCES,
      default: "everyone",
      index: true,
    },
    selectedUserIds: { type: [Schema.Types.ObjectId], default: [], index: true },
    actionUrl: { type: String, default: "/notifications" },
    sendEmail: { type: Boolean, default: false },
    publishedByUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    publishedAt: { type: Date, required: true, default: Date.now, index: true },
    expiresAt: { type: Date, default: null, index: true },
    archivedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "communication_announcements",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

communicationAnnouncementSchema.index({ audience: 1, publishedAt: -1 });
communicationAnnouncementSchema.index({ selectedUserIds: 1, publishedAt: -1 });

export type CommunicationAnnouncementDocument = InferSchemaType<
  typeof communicationAnnouncementSchema
>;

export const CommunicationAnnouncementModel =
  (mongoose.models.CommunicationAnnouncement as
    | Model<CommunicationAnnouncementDocument>
    | undefined) ??
  mongoose.model<CommunicationAnnouncementDocument>(
    "CommunicationAnnouncement",
    communicationAnnouncementSchema,
  );
