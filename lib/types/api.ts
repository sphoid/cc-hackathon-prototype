export interface GenerateRequest {
  workflow_id: string;
  session_id: string;
  query: string;
  sub_workflow_id?: string;
  inputs?: Record<string, string>;
  base_path?: string;
}

export interface GenerateResponse {
  session_id: string;
  html: string;
  metadata: {
    components_used: string[];
    query_interpretation: string;
    conversation_turn: number;
  };
}

export interface WorkflowListResponse {
  workflows: {
    workflow_id: string;
    name: string;
    version: string;
  }[];
}

export interface SessionResponse {
  id: string;
  workflow_id: string;
  created_at: string;
  last_active: string;
  conversation: {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }[];
  context: Record<string, unknown>;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}
