export type DocumentStatus =
  | "uploading"
  | "queued"
  | "extracting"
  | "chunking"
  | "embedding"
  | "ready"
  | "failed"
  | "deleting";

export interface DocumentItem {
  id: string;
  title: string;
  mime_type: string;
  byte_size: number;
  status: DocumentStatus;
  active_generation: number;
  failure_code?: string | null;
  failure_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserUsage {
  storage_bytes_used: number;
  storage_bytes_limit: number;
  document_count: number;
  document_limit: number;
  today_requests: number;
  daily_request_limit: number;
}

export interface UserProfile {
  id: string;
  email?: string | null;
  display_name?: string | null;
  preferred_language: string;
  created_at: string;
}

export interface MeData {
  user: UserProfile;
  usage: UserUsage;
}

export interface MessageSource {
  label: string;
  document_id: string;
  document_title?: string;
  chunk_id: string;
  page_start?: number | null;
  page_end?: number | null;
  section?: string | null;
  excerpt: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status: "pending" | "streaming" | "completed" | "failed" | "cancelled";
  created_at: string;
  sources?: MessageSource[] | null;
}

export interface Conversation {
  id: string;
  title: string;
  language: string;
  created_at: string;
  updated_at: string;
  document_ids: string[];
}

