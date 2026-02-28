export interface Session {
  id: string;
  workflow_id: string;
  created_at: Date;
  last_active: Date;
  conversation: ConversationMessage[];
  context: Record<string, unknown>;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
