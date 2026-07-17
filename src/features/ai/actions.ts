"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/features/audit/audit-service";
import { generateOpenAiWorkspaceResponse } from "@/features/ai/openai-service";
import { AI_WORKSPACE_KEYS } from "@/features/ai/workspaces";
import { requirePermission } from "@/features/auth/server";
import { getServerEnv } from "@/lib/env";
import { archiveAiConversation, prepareAiConversationMessage, saveAiAssistantMessage } from "@/repositories/ai-conversation-repository";

const messageSchema = z.object({
  conversationId: z.string().trim().optional(),
  workspaceKey: z.enum(AI_WORKSPACE_KEYS),
  message: z.string().trim().min(10).max(12000),
});

export async function sendAdminAiMessageAction(formData: FormData) {
  const actor = await requirePermission("ai.admin");
  const parsed = messageSchema.safeParse({
    conversationId: String(formData.get("conversationId") ?? "") || undefined,
    workspaceKey: formData.get("workspaceKey"),
    message: formData.get("message"),
  });
  if (!parsed.success) redirect("/admin/ai-usage?error=invalid");
  if (!getServerEnv().OPENAI_API_KEY) redirect("/admin/ai-usage?error=not-configured");
  const conversation = await prepareAiConversationMessage({ principal: actor, ...parsed.data });
  if (!conversation) redirect("/admin/ai-usage?error=conversation");

  let result;
  try {
    result = await generateOpenAiWorkspaceResponse({
      workspaceKey: conversation.workspaceKey,
      messages: conversation.history,
    });
  } catch (error) {
    console.error("Unable to generate the admin AI response.", error);
    redirect(`/admin/ai-usage?conversation=${conversation.id}&error=provider`);
  }
  await saveAiAssistantMessage({ conversationId: conversation.id, ...result });
  await writeAuditLog({
    actor,
    action: "ai.response_generated",
    resourceType: "AiConversation",
    resourceId: conversation.id,
    newValues: {
      workspaceKey: conversation.workspaceKey,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.totalTokens,
      sourceCount: result.sources.length,
    },
  });
  revalidatePath("/admin/ai-usage");
  redirect(`/admin/ai-usage?conversation=${conversation.id}`);
}

export async function archiveAdminAiConversationAction(formData: FormData) {
  const actor = await requirePermission("ai.admin");
  const conversationId = String(formData.get("conversationId") ?? "");
  if (await archiveAiConversation(conversationId)) {
    await writeAuditLog({
      actor,
      action: "ai.conversation_archived",
      resourceType: "AiConversation",
      resourceId: conversationId,
    });
  }
  revalidatePath("/admin/ai-usage");
  redirect("/admin/ai-usage?archived=1");
}
