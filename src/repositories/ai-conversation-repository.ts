import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { AI_WORKSPACES, type AiWorkspaceKey } from "@/features/ai/workspaces";
import { getServerEnv } from "@/lib/env";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AiConversationModel } from "@/models/ai-conversation";

export type AiMessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: Array<{ title: string; url: string }>;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  createdAt: string;
};

export type AiConversationRecord = {
  id: string;
  title: string;
  workspaceKey: AiWorkspaceKey;
  workspaceLabel: string;
  portal: "admin" | "staff" | "client";
  createdByUserId: string;
  createdByEmail: string;
  model: string;
  messageCount: number;
  totalTokens: number;
  lastActivityAt: string;
  messages: AiMessageRecord[];
};

type RawMessage = {
  _id?: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ title?: string; url?: string }>;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  createdAt?: Date | null;
};

type RawConversation = {
  _id: Types.ObjectId;
  title: string;
  workspaceKey: AiWorkspaceKey;
  portal?: "admin" | "staff" | "client";
  createdByUserId: Types.ObjectId;
  createdByEmail: string;
  model: string;
  messageCount?: number;
  totalTokens?: number;
  lastActivityAt?: Date | null;
  messages?: RawMessage[];
};

function serialize(record: RawConversation): AiConversationRecord {
  return {
    id: record._id.toString(),
    title: record.title,
    workspaceKey: record.workspaceKey,
    workspaceLabel: AI_WORKSPACES[record.workspaceKey].label,
    portal: record.portal ?? "admin",
    createdByUserId: record.createdByUserId.toString(),
    createdByEmail: record.createdByEmail,
    model: record.model,
    messageCount: record.messageCount ?? record.messages?.length ?? 0,
    totalTokens: record.totalTokens ?? 0,
    lastActivityAt: record.lastActivityAt?.toISOString() ?? new Date(0).toISOString(),
    messages: (record.messages ?? []).map((message) => ({
      id: message._id?.toString() ?? `${message.role}-${message.createdAt?.getTime() ?? 0}`,
      role: message.role,
      content: message.content,
      sources: (message.sources ?? []).flatMap((source) => source.url ? [{ title: source.title || source.url, url: source.url }] : []),
      inputTokens: message.inputTokens ?? 0,
      outputTokens: message.outputTokens ?? 0,
      totalTokens: message.totalTokens ?? 0,
      createdAt: message.createdAt?.toISOString() ?? new Date(0).toISOString(),
    })),
  };
}

export async function getAdminAiWorkspaceData(
  activeConversationId?: string,
  startNewConversation = false,
) {
  await connectToDatabase();
  const conversations = (await AiConversationModel.find({ archivedAt: null })
    .select("-messages")
    .sort({ lastActivityAt: -1 })
    .limit(50)
    .lean()
    .exec()) as unknown as RawConversation[];
  const selectedId = startNewConversation
    ? null
    : activeConversationId && Types.ObjectId.isValid(activeConversationId)
      ? activeConversationId
      : conversations[0]?._id.toString();
  const active = selectedId
    ? await AiConversationModel.findOne({ _id: selectedId, archivedAt: null }).lean().exec()
    : null;
  const summary = await AiConversationModel.aggregate<{
    _id: null;
    conversations: number;
    messages: number;
    totalTokens: number;
    users: string[];
  }>([
    { $match: { archivedAt: null } },
    { $group: { _id: null, conversations: { $sum: 1 }, messages: { $sum: "$messageCount" }, totalTokens: { $sum: "$totalTokens" }, users: { $addToSet: "$createdByEmail" } } },
  ]).exec();
  const totals = summary[0];
  return {
    configured: Boolean(getServerEnv().OPENAI_API_KEY),
    conversations: conversations.map(serialize),
    activeConversation: active ? serialize(active as unknown as RawConversation) : null,
    summary: {
      conversations: totals?.conversations ?? 0,
      messages: totals?.messages ?? 0,
      totalTokens: totals?.totalTokens ?? 0,
      users: totals?.users.length ?? 0,
    },
  };
}

export async function getPortalAiWorkspaceData(
  principal: Principal,
  portal: "staff" | "client",
  activeConversationId?: string,
  startNewConversation = false,
) {
  await connectToDatabase();
  const filter = { createdByUserId: new Types.ObjectId(principal.id), portal, archivedAt: null };
  const conversations = (await AiConversationModel.find(filter)
    .select("-messages")
    .sort({ lastActivityAt: -1 })
    .limit(50)
    .lean()
    .exec()) as unknown as RawConversation[];
  const selectedId = startNewConversation
    ? null
    : activeConversationId && Types.ObjectId.isValid(activeConversationId)
      ? activeConversationId
      : conversations[0]?._id.toString();
  const active = selectedId
    ? await AiConversationModel.findOne({ ...filter, _id: selectedId }).lean().exec()
    : null;
  return {
    configured: Boolean(getServerEnv().OPENAI_API_KEY),
    conversations: conversations.map(serialize),
    activeConversation: active ? serialize(active as unknown as RawConversation) : null,
  };
}

export async function prepareAiConversationMessage(input: {
  principal: Principal;
  conversationId?: string;
  workspaceKey: AiWorkspaceKey;
  message: string;
  portal?: "admin" | "staff" | "client";
}) {
  await connectToDatabase();
  const now = new Date();
  const model = getServerEnv().OPENAI_DEFAULT_MODEL?.trim() || "gpt-5.6-luna";
  const portal = input.portal ?? "admin";
  let conversation;
  if (input.conversationId && Types.ObjectId.isValid(input.conversationId)) {
    conversation = await AiConversationModel.findOne({
      _id: input.conversationId,
      createdByUserId: input.principal.id,
      archivedAt: null,
      ...(portal === "admin"
        ? { $or: [{ portal: "admin" }, { portal: { $exists: false } }] }
        : { portal }),
    }).exec();
    if (!conversation) return null;
    conversation.messages.push({ role: "user", content: input.message, createdAt: now });
    conversation.messageCount += 1;
    conversation.lastActivityAt = now;
    await conversation.save();
  } else {
    conversation = await AiConversationModel.create({
      title: input.message.replace(/\s+/g, " ").trim().slice(0, 72),
      workspaceKey: input.workspaceKey,
      portal,
      createdByUserId: new Types.ObjectId(input.principal.id),
      createdByEmail: input.principal.email,
      model,
      messages: [{ role: "user", content: input.message, createdAt: now }],
      messageCount: 1,
      lastActivityAt: now,
      archivedAt: null,
    });
  }
  const history = conversation.messages.slice(-18).map((message) => ({
    role: message.role,
    content: message.content,
  }));
  return { id: conversation._id.toString(), workspaceKey: conversation.workspaceKey, history };
}

export async function saveAiAssistantMessage(input: {
  conversationId: string;
  content: string;
  responseId: string | null;
  sources: Array<{ title: string; url: string }>;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}) {
  await connectToDatabase();
  await AiConversationModel.updateOne(
    { _id: input.conversationId, archivedAt: null },
    {
      $set: { model: input.model, lastActivityAt: new Date() },
      $push: { messages: {
        role: "assistant",
        content: input.content,
        responseId: input.responseId,
        sources: input.sources,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        totalTokens: input.totalTokens,
        createdAt: new Date(),
      } },
      $inc: {
        messageCount: 1,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        totalTokens: input.totalTokens,
      },
    },
  ).exec();
}

export async function archiveAiConversation(conversationId: string) {
  if (!Types.ObjectId.isValid(conversationId)) return false;
  await connectToDatabase();
  const result = await AiConversationModel.updateOne(
    { _id: conversationId, archivedAt: null },
    { $set: { archivedAt: new Date() } },
  ).exec();
  return result.modifiedCount > 0;
}

export async function archivePortalAiConversation(
  conversationId: string,
  principalId: string,
  portal: "staff" | "client",
) {
  if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(principalId)) return false;
  await connectToDatabase();
  const result = await AiConversationModel.updateOne(
    { _id: conversationId, createdByUserId: principalId, portal, archivedAt: null },
    { $set: { archivedAt: new Date() } },
  ).exec();
  return result.modifiedCount > 0;
}
