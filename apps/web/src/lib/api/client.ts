import { getAuthToken } from "@/lib/auth/authStore";
import {
  MeData,
  DocumentItem,
  Conversation,
  Message,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !(options.body instanceof ArrayBuffer) && !(options.body instanceof Blob)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || errJson.detail || errorDetail;
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth & Profile
  getMe: () => request<MeData>("/me"),
  deleteAccount: () => request<{ status: string }>("/me", { method: "DELETE" }),

  // Documents
  listDocuments: () =>
    request<{ items: DocumentItem[]; total: number }>("/documents"),
  getDocument: (id: string) => request<DocumentItem>(`/documents/${id}`),
  reserveUpload: (filename: string, byte_size: number, mime_type: string) =>
    request<{
      document_id: string;
      storage_key: string;
      upload_url: string;
      expires_in_seconds: number;
    }>("/documents/uploads", {
      method: "POST",
      body: JSON.stringify({ filename, byte_size, mime_type }),
    }),
  uploadBinary: (uploadUrl: string, data: ArrayBuffer | Blob) =>
    request<{ status: string; byte_size: number }>(uploadUrl, {
      method: "POST",
      body: data,
      headers: { "Content-Type": "application/octet-stream" },
    }),
  completeUpload: (docId: string) =>
    request<{ document_id: string; status: string }>(
      `/documents/${docId}/complete`,
      { method: "POST" }
    ),
  retryDocument: (docId: string) =>
    request<{ document_id: string; status: string }>(
      `/documents/${docId}/retry`,
      { method: "POST" }
    ),
  deleteDocument: (docId: string) =>
    request<{ document_id: string; status: string }>(
      `/documents/${docId}`,
      { method: "DELETE" }
    ),
  getDocumentSource: (docId: string, chunkId?: string) => {
    const q = chunkId ? `?chunk_id=${chunkId}` : "";
    return request<{
      document_id: string;
      title: string;
      content: string;
      page_start?: number;
      page_end?: number;
      section?: string;
    }>(`/documents/${docId}/source${q}`);
  },

  // Conversations & Chat
  listConversations: () =>
    request<{ items: Conversation[]; total: number }>("/conversations"),
  createConversation: (
    title: string,
    document_ids: string[] = [],
    language = "en"
  ) =>
    request<Conversation>("/conversations", {
      method: "POST",
      body: JSON.stringify({ title, document_ids, language }),
    }),
  getConversationMessages: (convId: string) =>
    request<{ items: Message[]; total: number }>(
      `/conversations/${convId}/messages`
    ),
  deleteConversation: (convId: string) =>
    request<{ status: string }>(`/conversations/${convId}`, {
      method: "DELETE",
    }),

  // Admin Metrics
  getAdminMetrics: () => request<any>("/admin/metrics"),
};
