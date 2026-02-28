import Anthropic from "@anthropic-ai/sdk";
import { ConversationMessage } from "@/lib/types/session";

const client = new Anthropic();

export interface GenerationResult {
  html: string;
  metadata: {
    components_used: string[];
    query_interpretation: string;
  };
}

export async function generateUI(
  systemPrompt: string,
  conversationHistory: ConversationMessage[],
  userQuery: string
): Promise<GenerationResult> {
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: userQuery },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    temperature: 0.3,
    system: systemPrompt,
    messages,
  });

  const rawText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return parseResponse(rawText);
}

function parseResponse(raw: string): GenerationResult {
  let html = stripMarkdownFences(raw);

  const metadataMatch = html.match(
    /<!--\s*METADATA:\s*(\{[\s\S]*?\})\s*-->/
  );

  let metadata: GenerationResult["metadata"] = {
    components_used: [],
    query_interpretation: "",
  };

  if (metadataMatch) {
    try {
      metadata = JSON.parse(metadataMatch[1]);
    } catch {
      // Keep defaults if JSON parsing fails
    }
    html = html.replace(metadataMatch[0], "").trim();
  }

  return { html, metadata };
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:html)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}
