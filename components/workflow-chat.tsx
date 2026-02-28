"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
  turn: number;
}

export default function WorkflowChat({
  workflowId,
  workflowName,
}: {
  workflowId: string;
  workflowName: string;
}) {
  const [sessionId, setSessionId] = useState(
    () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
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

  const handleGenerate = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/engine/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_id: workflowId,
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-mono transition-colors duration-150"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            &larr; Back
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <h1
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {workflowName}
          </h1>
          {metadata && (
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              turn {metadata.conversation_turn}
            </span>
          )}
        </div>
        <button
          onClick={handleNewSession}
          className="text-xs font-mono px-3 py-1.5 rounded transition-colors duration-150"
          style={{
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--border-hover)";
            e.currentTarget.style.background = "var(--bg-surface)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          New session
        </button>
      </header>

      {/* Output area */}
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div
            className="mb-4 p-3 rounded-md text-sm max-w-4xl mx-auto"
            style={{
              background: "var(--error-bg)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "var(--error)",
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-6 h-6 rounded-full"
                style={{
                  border: "2px solid var(--border)",
                  borderTopColor: "var(--accent)",
                  animation: "spin-slow 0.8s linear infinite",
                }}
              />
              <span
                className="text-xs font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                generating...
              </span>
            </div>
          </div>
        )}

        {!loading && currentHtml && (
          <div
            ref={outputRef}
            className="prose max-w-none animate-fade-up"
            dangerouslySetInnerHTML={{ __html: currentHtml }}
          />
        )}

        {!loading && !currentHtml && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p
                className="text-base mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Describe the UI you need
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                The engine generates from the {workflowName.toLowerCase()} schema
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 px-5 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
            placeholder="Describe the UI you want to see..."
            className="flex-1 rounded-md px-4 py-2.5 text-sm focus:outline-none transition-colors duration-150"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: "var(--accent)",
              color: "var(--bg-primary)",
            }}
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
