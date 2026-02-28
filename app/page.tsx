"use client";

import { useState, useEffect, useRef } from "react";

interface Workflow {
  workflow_id: string;
  name: string;
  version: string;
}

interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
  turn: number;
}

export default function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentHtml, setCurrentHtml] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [metadata, setMetadata] = useState<{
    components_used: string[];
    query_interpretation: string;
    conversation_turn: number;
  } | null>(null);
  const [error, setError] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/engine/workflows")
      .then((r) => r.json())
      .then((data) => {
        setWorkflows(data.workflows);
        if (data.workflows.length > 0) {
          setSelectedWorkflow(data.workflows[0].workflow_id);
        }
      });
    setSessionId(`sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  }, []);

  const handleGenerate = async () => {
    if (!query.trim() || !selectedWorkflow) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/engine/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_id: selectedWorkflow,
          session_id: sessionId,
          query: query.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }

      setCurrentHtml(data.html);
      setMetadata(data.metadata);
      setConversation((prev) => [
        ...prev,
        { role: "user", content: query.trim(), turn: data.metadata.conversation_turn },
        { role: "assistant", content: data.html, turn: data.metadata.conversation_turn },
      ]);
      setQuery("");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = () => {
    setSessionId(`sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    setConversation([]);
    setCurrentHtml("");
    setMetadata(null);
    setError("");
  };

  const handleWorkflowChange = (wfId: string) => {
    setSelectedWorkflow(wfId);
    handleNewSession();
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="w-80 border-r border-zinc-200 bg-white p-4 flex flex-col">
        <h1 className="text-lg font-bold mb-4">UI Workflow Engine</h1>

        {/* Workflow Selector */}
        <label className="text-sm font-medium text-zinc-600 mb-1">Workflow</label>
        <select
          value={selectedWorkflow}
          onChange={(e) => handleWorkflowChange(e.target.value)}
          className="w-full border border-zinc-300 rounded-md px-3 py-2 mb-4 text-sm bg-white"
        >
          {workflows.map((wf) => (
            <option key={wf.workflow_id} value={wf.workflow_id}>
              {wf.name} (v{wf.version})
            </option>
          ))}
        </select>

        {/* Session Info */}
        <div className="text-xs text-zinc-400 mb-2 font-mono truncate" title={sessionId}>
          Session: {sessionId}
        </div>
        <button
          onClick={handleNewSession}
          className="w-full text-sm border border-zinc-300 rounded-md px-3 py-1.5 mb-4 hover:bg-zinc-50 transition-colors"
        >
          New Session
        </button>

        {/* Conversation History */}
        <div className="text-sm font-medium text-zinc-600 mb-2">History</div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {conversation
            .filter((c) => c.role === "user")
            .map((entry, i) => (
              <div
                key={i}
                className="text-sm p-2 bg-zinc-50 rounded-md border border-zinc-100"
              >
                <span className="text-zinc-400 text-xs">Turn {entry.turn}:</span>{" "}
                <span className="text-zinc-700">{entry.content}</span>
              </div>
            ))}
        </div>

        {/* Metadata */}
        {metadata && (
          <div className="mt-4 border-t border-zinc-200 pt-3">
            <div className="text-xs font-medium text-zinc-500 mb-1">Metadata</div>
            <div className="text-xs text-zinc-600 space-y-1">
              <div>Turn: {metadata.conversation_turn}</div>
              <div>Interpretation: {metadata.query_interpretation}</div>
              <div>
                Components:{" "}
                {metadata.components_used.map((c, i) => (
                  <span
                    key={i}
                    className="inline-block bg-zinc-100 text-zinc-600 rounded px-1.5 py-0.5 mr-1 mt-0.5"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Output Panel */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                <span className="text-sm text-zinc-500">Generating UI...</span>
              </div>
            </div>
          )}

          {!loading && currentHtml && (
            <div
              ref={outputRef}
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: currentHtml }}
            />
          )}

          {!loading && !currentHtml && (
            <div className="flex items-center justify-center h-64 text-zinc-400">
              <div className="text-center">
                <p className="text-lg mb-2">Select a workflow and enter a query</p>
                <p className="text-sm">
                  The engine will generate a UI based on the workflow schema
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-zinc-200 bg-white p-4">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
              placeholder="Describe the UI you want to see..."
              className="flex-1 border border-zinc-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !query.trim()}
              className="px-6 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
