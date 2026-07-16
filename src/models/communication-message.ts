import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ATTACHMENT_TYPES } from "@/features/communication/types";

const messageAttachmentSchema = new Schema(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, required: true, enum: ATTACHMENT_TYPES },
    fileSize: { type: Number, default: null },
    url: { type: String, required: true },
  },
  { _id: false },
);

const messageReadReceiptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    readAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const communicationMessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "CommunicationConversation",
    },
    senderUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    senderName: { type: String, required: true },
    body: { type: String, required: true, trim: true },
    attachments: { type: [messageAttachmentSchema], default: [] },
    replyToMessageId: { type: Schema.Types.ObjectId, default: null, index: true },
    readReceipts: { type: [messageReadReceiptSchema], default: [] },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "communication_messages",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

communicationMessageSchema.index({ conversationId: 1, createdAt: 1 });
communicationMessageSchema.index({ senderUserId: 1, createdAt: -1 });

export type CommunicationMessageDocument = InferSchemaType<typeof communicationMessageSchema>;

export const CommunicationMessageModel =
  (mongoose.models.CommunicationMessage as Model<CommunicationMessageDocument> | undefined) ??
  mongoose.model<CommunicationMessageDocument>(
    "CommunicationMessage",
    communicationMessageSchema,
  );
