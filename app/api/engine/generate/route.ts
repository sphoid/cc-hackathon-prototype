import { NextRequest, NextResponse } from "next/server";
import { getSchema } from "@/lib/engine/schema-loader";
import {
  getOrCreateSession,
  getSession,
  addMessage,
} from "@/lib/engine/session-store";
import { loadMockData } from "@/lib/mock-data/loader";
import { buildSystemPrompt } from "@/lib/engine/prompt-builder";
import { generateUI } from "@/lib/engine/claude-client";
import { normalizeQuery } from "@/lib/engine/query-normalizer";
import { GenerateRequest } from "@/lib/types/api";

// In-memory cache for auto-generated sub-workflow pages
const htmlCache = new Map<string, { html: string; metadata: Record<string, unknown> }>();

function buildCacheKey(
  workflowId: string,
  subWorkflowId: string,
  inputs?: Record<string, string>
): string {
  const sortedInputs = inputs
    ? Object.keys(inputs).sort().map((k) => `${k}=${inputs[k]}`).join("&")
    : "";
  return `${workflowId}:${subWorkflowId}:${sortedInputs}`;
}

export async function POST(request: NextRequest) {
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { workflow_id, session_id, query, sub_workflow_id, inputs, base_path } =
    body;

  // Validate required fields
  const missing: string[] = [];
  if (!workflow_id) missing.push("workflow_id");
  if (!session_id) missing.push("session_id");
  if (query === undefined || query === null) missing.push("query");
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Load schema
  const schema = await getSchema(workflow_id);
  if (!schema) {
    return NextResponse.json(
      { error: `Workflow not found: ${workflow_id}` },
      { status: 404 }
    );
  }

  // Validate sub_workflow_id if provided
  if (sub_workflow_id) {
    if (!schema.sub_workflows || !schema.sub_workflows[sub_workflow_id]) {
      return NextResponse.json(
        {
          error: `Sub-workflow not found: ${sub_workflow_id} in workflow ${workflow_id}`,
        },
        { status: 404 }
      );
    }
  }

  // Determine the effective query
  let effectiveQuery = typeof query === "string" ? query.trim() : "";
  const isAutoGenerate = !effectiveQuery && !!sub_workflow_id;

  if (isAutoGenerate && schema.sub_workflows) {
    const subWorkflow = schema.sub_workflows[sub_workflow_id!];
    effectiveQuery =
      subWorkflow.auto_generate_query ||
      `Generate the ${subWorkflow.name} page.`;
  }

  // Normalize phrasing so semantically identical queries produce identical output
  effectiveQuery = normalizeQuery(effectiveQuery);

  // Validate query — must have something to work with
  if (!effectiveQuery) {
    return NextResponse.json(
      { error: "Query cannot be empty" },
      { status: 400 }
    );
  }
  if (effectiveQuery.length > 2000) {
    return NextResponse.json(
      { error: "Query exceeds maximum length of 2000 characters" },
      { status: 400 }
    );
  }

  // Check cache for auto-generated sub-workflow pages
  if (isAutoGenerate && sub_workflow_id) {
    const cacheKey = buildCacheKey(workflow_id, sub_workflow_id, inputs);
    const cached = htmlCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        session_id,
        html: cached.html,
        metadata: { ...cached.metadata, conversation_turn: 1, cached: true },
      });
    }
  }

  // Get or create session, check consistency
  const existingSession = getSession(session_id);
  if (existingSession && existingSession.workflow_id !== workflow_id) {
    return NextResponse.json(
      {
        error: `Session ${session_id} is bound to workflow ${existingSession.workflow_id}, not ${workflow_id}`,
      },
      { status: 400 }
    );
  }

  const session = getOrCreateSession(session_id, workflow_id);

  // Load mock data and build prompt
  const mockData = await loadMockData(workflow_id);
  const subWorkflowParams =
    sub_workflow_id && base_path
      ? { subWorkflowId: sub_workflow_id, basePath: base_path, inputs }
      : undefined;
  const systemPrompt = buildSystemPrompt(schema, mockData, subWorkflowParams);

  try {
    const rawStream = generateUIStream(
      systemPrompt,
      session.conversation,
      effectiveQuery
    );

    let fullText = "";
    const encoder = new TextEncoder();

    const sseStream = new ReadableStream({
      async start(controller) {
        const reader = rawStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (value.startsWith("\n[DONE]")) {
              const metadataJson = value.slice("\n[DONE]".length);
              let metadata: Record<string, unknown> = {};
              try {
                metadata = JSON.parse(metadataJson);
              } catch {
                // ignore parse errors
              }

              // Strip markdown fences and metadata comment from accumulated text for caching/session
              const html = fullText
                .replace(/^```(?:html)?\s*\n?/i, "")
                .replace(/\n?```\s*$/i, "")
                .replace(/<!--\s*METADATA:\s*\{[\s\S]*?\}\s*-->/g, "")
                .trim();

              // Cache auto-generated sub-workflow results
              if (isAutoGenerate && sub_workflow_id) {
                const cacheKey = buildCacheKey(workflow_id, sub_workflow_id, inputs);
                htmlCache.set(cacheKey, { html, metadata });
              }

              // Add messages to session
              addMessage(session_id, { role: "user", content: effectiveQuery });
              addMessage(session_id, { role: "assistant", content: html });

              const conversationTurn = Math.ceil(session.conversation.length / 2);

              controller.enqueue(
                encoder.encode(
                  `data: [DONE]\ndata: ${JSON.stringify({
                    session_id,
                    metadata: { ...metadata, conversation_turn: conversationTurn },
                  })}\n\n`
                )
              );
            } else {
              fullText += value;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(value)}\n\n`)
              );
            }
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: String(err) })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Claude generation failed:", error);
    return NextResponse.json(
      { error: "UI generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
