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
import { GenerateRequest } from "@/lib/types/api";

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

  const { workflow_id, session_id, query } = body;

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

  // Validate query
  if (typeof query !== "string" || query.trim() === "") {
    return NextResponse.json(
      { error: "Query cannot be empty" },
      { status: 400 }
    );
  }
  if (query.length > 2000) {
    return NextResponse.json(
      { error: "Query exceeds maximum length of 2000 characters" },
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
  const systemPrompt = buildSystemPrompt(schema, mockData);

  try {
    const result = await generateUI(
      systemPrompt,
      session.conversation,
      query
    );

    // Add messages to session
    addMessage(session_id, { role: "user", content: query });
    addMessage(session_id, { role: "assistant", content: result.html });

    const conversationTurn = Math.ceil(session.conversation.length / 2);

    return NextResponse.json({
      session_id,
      html: result.html,
      metadata: {
        ...result.metadata,
        conversation_turn: conversationTurn,
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
