import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { AI_WORKSPACE_KEYS } from "@/features/ai/workspaces";

const aiMessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    responseId: { type: String, default: null },
    sources: { type: [{ title: String, url: String }], default: [] },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const aiConversationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    workspaceKey: { type: String, enum: AI_WORKSPACE_KEYS, required: true, index: true },
    portal: { type: String, enum: ["admin", "staff", "client"], default: "admin", index: true },
    createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    createdByEmail: { type: String, required: true, index: true },
    model: { type: String, required: true },
    messages: { type: [aiMessageSchema], default: [] },
    messageCount: { type: Number, default: 0 },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    archivedAt: { type: Date, default: null, index: true },
  },
  { collection: "ai_conversations", timestamps: true },
);

aiConversationSchema.index({ archivedAt: 1, lastActivityAt: -1 });
aiConversationSchema.index({ createdByUserId: 1, lastActivityAt: -1 });

export type AiConversationDocument = InferSchemaType<typeof aiConversationSchema>;
export const AiConversationModel =
  (mongoose.models.AiConversation as Model<AiConversationDocument> | undefined) ??
  mongoose.model<AiConversationDocument>("AiConversation", aiConversationSchema);
