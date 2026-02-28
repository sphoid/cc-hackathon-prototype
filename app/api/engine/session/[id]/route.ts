import { NextResponse } from "next/server";
import { getSession, deleteSession } from "@/lib/engine/session-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSession(id);

  if (!session) {
    return NextResponse.json(
      { error: `Session not found: ${id}` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: session.id,
    workflow_id: session.workflow_id,
    created_at: session.created_at.toISOString(),
    last_active: session.last_active.toISOString(),
    conversation: session.conversation.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
    })),
    context: session.context,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteSession(id);

  if (!deleted) {
    return NextResponse.json(
      { error: `Session not found: ${id}` },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: `Session ${id} deleted` });
}
