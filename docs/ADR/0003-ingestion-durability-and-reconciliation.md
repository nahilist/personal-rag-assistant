# ADR 0003: Durable Ingestion Pipeline and Reconciliation

## Status
Accepted

## Context
Document parsing and vector embedding are long-running, multi-step asynchronous processes that must survive worker crashes, API restarts, and message loss. The queue must never be the authoritative record of state, and late or retried worker tasks must never reactivate deleted documents or stage duplicate active chunks.

## Decision
1. **Durable Database-Backed State**:
   - `documents`, `document_generations`, and `ingestion_jobs` in PostgreSQL are the sole source of truth for job lifecycle (`uploading` -> `queued` -> `extracting` -> `chunking` -> `embedding` -> `ready` / `failed` / `deleting`).
   - Transactional Outbox pattern: `outbox_events` are inserted in the same database transaction as document completion.
2. **Leased Worker Execution and Idempotency**:
   - Workers claim jobs by advancing attempt count and setting `lease_until` timestamp.
   - Jobs are identified by `(document_id, generation)`.
   - Before activating staged chunks, worker checks that `documents.deleted_at IS NULL` and generation is current.
3. **Reconciliation Daemon**:
   - A periodic reconciler checks for orphaned jobs (`lease_until < NOW()` with non-terminal status) and unpublished outbox events, retrying bounded transient errors up to 3 attempts with exponential backoff.
4. **Immediate Deletion Revocation**:
   - Deletion marks `deleted_at = NOW()` immediately, revoking retrieval immediately. Background cleanup purges files, chunks, and caches idempotently.

## Consequences
- Zero lost jobs or phantom active chunks.
- Late workers gracefully abort if a user deletes a file during embedding.
- Fast recovery from worker or queue restarts.

