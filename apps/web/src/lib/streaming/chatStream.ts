import { getAuthToken } from "@/lib/auth/authStore";
import { MessageSource } from "@/types";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  return "http://127.0.0.1:8000/api/v1";
}

export interface StreamChatParams {
  conversationId: string;
  requestKey: string;
  message: string;
  documentIds?: string[];
  language?: string;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
  onSources: (sources: MessageSource[]) => void;
  onDone: (status: string) => void;
  onError: (err: Error) => void;
}

export async function streamChatMessage({
  conversationId,
  requestKey,
  message,
  documentIds,
  language = "en",
  signal,
  onDelta,
  onSources,
  onDone,
  onError,
}: StreamChatParams): Promise<void> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(
      `${baseUrl}/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          request_key: requestKey,
          message,
          document_ids: documentIds,
          language,
        }),
        signal,
      }
    );

    if (!response.ok) {
      let msg = "Chat stream failed";
      try {
        const j = await response.json();
        msg = j.error?.message || j.detail || msg;
      } catch {}
      throw new Error(msg);
    }

    if (!response.body) {
      throw new Error("No response body available for streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const block of parts) {
        if (!block.trim()) continue;
        const lines = block.split("\n");
        let eventName = "";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventName = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.slice(6).trim();
          }
        }

        if (eventName === "delta" && dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) onDelta(parsed.text);
          } catch {}
        } else if (eventName === "sources" && dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.sources) onSources(parsed.sources);
          } catch {}
        } else if (eventName === "done" && dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            onDone(parsed.status || "completed");
          } catch {
            onDone("completed");
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      onDone("cancelled");
    } else {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

