"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { readSSEStream } from "@/lib/stream-reader";

export default function SubWorkflowPage({
  workflowId,
  workflowName,
  subWorkflowId,
  basePath,
  inputs,
}: {
  workflowId: string;
  workflowName: string;
  subWorkflowId: string;
  basePath: string;
  inputs: Record<string, string>;
}) {
  const [sessionId] = useState(
    () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [currentHtml, setCurrentHtml] = useState("");
  const htmlRef = useRef("");
  const [metadata, setMetadata] = useState<{
    components_used: string[];
    query_interpretation: string;
    conversation_turn: number;
  } | null>(null);
  const [error, setError] = useState("");
  const hasGenerated = useRef(false);

  const fetchAndStream = useCallback(
    async (queryText: string) => {
      setLoading(true);
      setStreaming(false);
      setError("");

      try {
        const res = await fetch("/api/engine/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflow_id: workflowId,
            session_id: sessionId,
            query: queryText,
            sub_workflow_id: subWorkflowId,
            inputs,
            base_path: basePath,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Generation failed");
          setLoading(false);
          return;
        }

        const contentType = res.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          // Cache hit — JSON response
          const data = await res.json();
          setCurrentHtml(data.html);
          htmlRef.current = data.html;
          setMetadata(data.metadata);
          setLoading(false);
        } else {
          // Streaming response
          setStreaming(true);
          htmlRef.current = "";
          setCurrentHtml("");

          await readSSEStream(res, {
            onChunk: (chunk) => {
              htmlRef.current += chunk;
              setCurrentHtml(htmlRef.current);
            },
            onDone: (data) => {
              setMetadata(
                data.metadata as {
                  components_used: string[];
                  query_interpretation: string;
                  conversation_turn: number;
                }
              );
              // Clean up markdown fences from the displayed HTML
              const cleaned = htmlRef.current
                .replace(/^```(?:html)?\s*\n?/i, "")
                .replace(/\n?```\s*$/i, "")
                .replace(/<!--\s*METADATA:\s*\{[\s\S]*?\}\s*-->/g, "")
                .trim();
              htmlRef.current = cleaned;
              setCurrentHtml(cleaned);
              setStreaming(false);
              setLoading(false);
            },
            onError: (err) => {
              setError(err);
              setStreaming(false);
              setLoading(false);
            },
          });
        }
      } catch (err) {
        setError(String(err));
        setLoading(false);
        setStreaming(false);
      }
    },
    [workflowId, sessionId, subWorkflowId, inputs, basePath]
  );

  // Auto-generate on mount
  useEffect(() => {
    if (hasGenerated.current) return;
    hasGenerated.current = true;
    fetchAndStream("");
  }, [fetchAndStream]);

  const handleGenerate = async () => {
    if (!query.trim()) return;
    const q = query.trim();
    setQuery("");
    await fetchAndStream(q);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
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
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-secondary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
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
          {subWorkflowId !== "entry-point" && (
            <>
              <span
                className="text-xs font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                /
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: "var(--text-secondary)" }}
              >
                {subWorkflowId}
              </span>
            </>
          )}
          {metadata && (
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              turn {metadata.conversation_turn}
            </span>
          )}
        </div>
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

        {loading && !streaming && (
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

        {currentHtml && (
          <div>
            {streaming && (
              <div
                className="flex items-center gap-2 mb-3"
              >
                <div
                  className="w-3 h-3 rounded-full"
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
                  streaming...
                </span>
              </div>
            )}
            <div
              className={`prose max-w-none ${!streaming ? "animate-fade-up" : ""}`}
              dangerouslySetInnerHTML={{ __html: currentHtml }}
            />
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
            onKeyDown={(e) =>
              e.key === "Enter" && !loading && handleGenerate()
            }
            placeholder="Refine this view..."
            className="flex-1 rounded-md px-4 py-2.5 text-sm focus:outline-none transition-colors duration-150"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
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
