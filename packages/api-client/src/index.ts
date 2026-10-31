export interface UserProfile {
  id: string;
  display_name: string | null;
  preferred_language: string;
  created_at: string;
}

export interface UserUsage {
  storage_bytes_used: number;
  storage_bytes_limit: number;
  document_count: number;
  document_limit: number;
  today_requests: number;
  daily_request_limit: number;
}

export interface MeResponse {
  user: UserProfile;
  usage: UserUsage;
}

export type DocumentStatus =
  | 'uploading'
  | 'queued'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'ready'
  | 'failed'
  | 'deleting';

export interface DocumentItem {
  id: string;
  title: string;
  status: DocumentStatus;
  mime_type: string;
  byte_size: number;
  active_generation: number;
  failure_code: string | null;
  failure_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  items: DocumentItem[];
  next_cursor: string | null;
  total: number;
}

export interface UploadReservationRequest {
  filename: string;
  byte_size: number;
  mime_type: string;
}

export interface UploadReservationResponse {
  document_id: string;
  storage_key: string;
  upload_url: string;
  expires_in_seconds: number;
}

export interface CompleteUploadRequest {
  checksum?: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  language: string;
  created_at: string;
  updated_at: string;
  document_ids: string[];
}

export interface MessageSourceItem {
  label: string;
  document_id: string;
  document_title?: string;
  page?: number;
  page_start?: number;
  page_end?: number;
  section?: string;
  excerpt: string;
}

export interface MessageItem {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: 'pending' | 'streaming' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  sources?: MessageSourceItem[];
}

export interface ChatRequest {
  request_key: string;
  message: string;
  document_ids?: string[];
  language?: string;
}

export interface ChatStreamSourceEvent {
  sources: MessageSourceItem[];
}

export interface ChatStreamDeltaEvent {
  text: string;
}

export interface ChatStreamDoneEvent {
  status: 'completed' | 'insufficient_evidence' | 'cancelled' | 'failed';
  message_id?: string;
}

