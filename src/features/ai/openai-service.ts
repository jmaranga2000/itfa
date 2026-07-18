import { AI_WORKSPACES, aiInstructionsForPortal, type AiWorkspaceKey } from "@/features/ai/workspaces";
import { getServerEnv } from "@/lib/env";

type ConversationInput = { role: "user" | "assistant"; content: string };
type ResponsePayload = {
  id?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: Array<{ type?: string; title?: string; url?: string }>;
    }>;
  }>;
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  error?: { message?: string };
};

export async function generateOpenAiWorkspaceResponse(input: {
  workspaceKey: AiWorkspaceKey;
  portal?: "admin" | "staff" | "client";
  messages: ConversationInput[];
}) {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) throw new Error("OpenAI is not configured.");
  const model = env.OPENAI_DEFAULT_MODEL?.trim() || "gpt-5.6-luna";
  const workspace = AI_WORKSPACES[input.workspaceKey];
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: aiInstructionsForPortal(input.workspaceKey, input.portal ?? "admin"),
      input: input.messages.map((message) => ({ role: message.role, content: message.content })),
      ...(workspace.useWebSearch ? { tools: [{ type: "web_search" }] } : {}),
      max_output_tokens: 5000,
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const payload = (await response.json()) as ResponsePayload;
  if (!response.ok) throw new Error(payload.error?.message || `OpenAI returned status ${response.status}.`);
  const contentParts = (payload.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text");
  const content = contentParts.map((part) => part.text ?? "").join("\n").trim();
  if (!content) throw new Error("OpenAI returned an empty response.");
  const sourceMap = new Map<string, { title: string; url: string }>();
  for (const part of contentParts) {
    for (const annotation of part.annotations ?? []) {
      if (annotation.type === "url_citation" && annotation.url) {
        sourceMap.set(annotation.url, { title: annotation.title || annotation.url, url: annotation.url });
      }
    }
  }
  return {
    responseId: payload.id ?? null,
    content,
    sources: [...sourceMap.values()],
    model,
    inputTokens: payload.usage?.input_tokens ?? 0,
    outputTokens: payload.usage?.output_tokens ?? 0,
    totalTokens: payload.usage?.total_tokens ?? 0,
  };
}
