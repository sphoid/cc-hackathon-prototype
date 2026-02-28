export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onDone: (data: { session_id: string; metadata: Record<string, unknown> }) => void;
  onError: (error: string) => void;
}

export async function readSSEStream(
  response: Response,
  callbacks: StreamCallbacks
) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n\n");
    // Keep the last (possibly incomplete) chunk in the buffer
    buffer = lines.pop() || "";

    for (const block of lines) {
      const dataLines = block.split("\n").filter((l) => l.startsWith("data: "));
      if (dataLines.length === 0) continue;

      const firstData = dataLines[0].slice(6); // strip "data: "

      if (firstData === "[DONE]") {
        // Second data line has metadata
        if (dataLines.length > 1) {
          try {
            const meta = JSON.parse(dataLines[1].slice(6));
            callbacks.onDone(meta);
          } catch {
            callbacks.onDone({ session_id: "", metadata: {} });
          }
        }
      } else {
        try {
          const parsed = JSON.parse(firstData);
          if (typeof parsed === "string") {
            callbacks.onChunk(parsed);
          } else if (parsed.error) {
            callbacks.onError(parsed.error);
          }
        } catch {
          // skip unparseable chunks
        }
      }
    }
  }
}
