import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  COMMUNICATION_MODULES,
  CONVERSATION_STATUSES,
  CONVERSATION_TYPES,
} from "@/features/communication/types";

const conversationParticipantSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    role: {
      type: String,
      required: true,
      enum: ["admin", "staff", "client"],
      index: true,
    },
    displayName: { type: String, required: true },
    email: { type: String, required: true },
    lastReadAt: { type: Date, default: null },
  },
  { _id: false },
);

const communicationConversationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: CONVERSATION_TYPES, index: true },
    status: {
      type: String,
      required: true,
      enum: CONVERSATION_STATUSES,
      default: "open",
      index: true,
    },
    participants: { type: [conversationParticipantSchema], required: true, default: [] },
    relatedModule: {
      type: String,
      enum: COMMUNICATION_MODULES,
      default: "messages",
      index: true,
    },
    relatedRecordId: { type: String, default: null, index: true },
    clientOrganizationId: { type: Schema.Types.ObjectId, default: null, index: true },
    engagementId: { type: Schema.Types.ObjectId, default: null, index: true },
    assignedStaffUserId: { type: Schema.Types.ObjectId, default: null, index: true },
    actionUrl: { type: String, required: true },
    lastMessagePreview: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null, index: true },
    lastActivityAt: { type: Date, required: true, default: Date.now, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null, index: true },
  },
  {
    collection: "communication_conversations",
    timestamps: true,
    optimisticConcurrency: true,
  },
);

communicationConversationSchema.index({ "participants.userId": 1, lastActivityAt: -1 });
communicationConversationSchema.index({ status: 1, lastActivityAt: -1 });
communicationConversationSchema.index({ type: 1, relatedModule: 1 });

export type CommunicationConversationDocument = InferSchemaType<
  typeof communicationConversationSchema
>;

export const CommunicationConversationModel =
  (mongoose.models.CommunicationConversation as
    | Model<CommunicationConversationDocument>
    | undefined) ??
  mongoose.model<CommunicationConversationDocument>(
    "CommunicationConversation",
    communicationConversationSchema,
  );
