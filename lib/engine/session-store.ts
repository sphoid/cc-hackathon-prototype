import { Session, ConversationMessage } from "@/lib/types/session";

const sessions = new Map<string, Session>();

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function getOrCreateSession(id: string, workflowId: string): Session {
  const existing = sessions.get(id);
  if (existing) return existing;

  const session: Session = {
    id,
    workflow_id: workflowId,
    created_at: new Date(),
    last_active: new Date(),
    conversation: [],
    context: {},
  };
  sessions.set(id, session);
  return session;
}

export function addMessage(
  sessionId: string,
  message: Omit<ConversationMessage, "timestamp">
): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.conversation.push({ ...message, timestamp: new Date() });
  session.last_active = new Date();
}

export function updateContext(
  sessionId: string,
  context: Record<string, unknown>
): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.context = { ...session.context, ...context };
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}
