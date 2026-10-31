# Database design

[Documentation index](README.md) | Version 1.0 | 31 October 2026

All IDs are server-generated UUIDs. All timestamps use UTC. User-facing times can be localized.

| Table | Main columns |
|---|---|
| `profiles` | `id` referencing auth user, display_name, preferred_language, created_at |
| `documents` | id, user_id, title, storage_key, mime_type, byte_size, checksum, status, failure_code, active_generation, deleted_at |
| `document_generations` | id, document_id, user_id, generation, embedding_model, embedding_revision, dimensions, chunker_version, state |
| `document_chunks` | id, user_id, document_id, generation, chunk_index, content, embedding, page_start, page_end, section, token_count, content_hash |
| `ingestion_jobs` | id, user_id, document_id, generation, stage, attempt, lease_until, next_attempt_at, error_code, timestamps |
| `outbox_events` | id, event_type, entity_id, payload, published_at, created_at |
| `conversations` | id, user_id, title, language, created_at, updated_at, deleted_at |
| `conversation_documents` | conversation_id, document_id, user_id |
| `messages` | id, conversation_id, user_id, role, content, status, request_key, created_at |
| `message_sources` | id, message_id, user_id, document_id, chunk_id, generation, source_label, page/section metadata |
| `usage_events` | id, user_id, request_id, kind, model, input_tokens, output_tokens, units, created_at |
| `quota_reservations` | id, user_id, resource_type, units, expires_at, state |
| `audit_events` | id, actor_id, action, resource_type, resource_id, request_id, created_at |

### Constraints and indexes

- Unique `(document_id, generation, chunk_index)` and `(user_id, request_key)` for relevant message requests.
- Composite unique `(id, user_id)` on parent entities and matching composite foreign keys on owned relationships. This prevents cross-user document/conversation associations.
- Index `(user_id, created_at)` for document/chat lists and `(user_id, document_id, generation)` for chunks.
- Vector index only after evaluating corpus size and query performance. Benchmark filtered ANN recall as well as latency; filtering can reduce the number of returned candidates.
- For a small per-user corpus, exact authorized vector search may be simpler and more accurate. Choose using real measurements.
- Full-text GIN index if hybrid retrieval is enabled.
- Explicit cascade policies for owned relational rows; storage deletion is a separate idempotent job.

### Authorization rules

- Enable RLS on every browser/API-exposed user table. Owner-only operations use `auth.uid() = user_id` and matching insert/update checks.
- Storage bucket is private; storage policies and signed URLs enforce verified ownership.
- Prefer security-invoker retrieval functions; set explicit function permissions and safe search paths.
- A user cannot set their own admin role or quota plan. Keep operational roles in a protected table/claim workflow.
- When pooling database connections, use transaction-local authenticated claims/roles and clear state. Test that one request cannot inherit another user's identity.
- Every read path—including vector RPCs, source preview, export and admin endpoints—needs authorization tests.

