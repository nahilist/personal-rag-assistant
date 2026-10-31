# Document ingestion and lifecycle

[Documentation index](README.md) | Version 1.0 | 31 October 2026

1. API authenticates the user and atomically reserves storage/document quota.
2. Create an `uploading` document with a server-generated storage key containing the verified user UUID and document UUID.
3. Issue a short-lived upload authorization for that exact key.
4. Browser uploads; finalize endpoint verifies object existence, actual size and content signature. Invalid/abandoned uploads are cleaned up and reservations released.
5. In one database transaction, mark queued and insert a durable job plus outbox event.
6. An outbox dispatcher publishes the job to Celery; reconcile unpublished/pending jobs periodically.
7. Worker extracts content in a restricted process with limits on time, memory, pages, archive expansion, and output bytes.
8. Normalize text while preserving page/heading boundaries. Detect insufficient extractable text and mark `ocr_required` as a failure code.
9. Chunk, embed in batches, and stage a new index generation.
10. Atomically activate a completed generation only if the document has not been deleted or superseded.
11. Mark ready, release reservations, and publish updated status. Polling is sufficient initially.

States: `uploading → queued → extracting → chunking → embedding → ready`; any processing stage may become `failed`; any active state may become `deleting → deleted`.

Retry transient errors three times with exponential backoff and jitter. Invalid files are terminal failures. Jobs use `(document_id, generation)` as idempotency identity and a worker lease/heartbeat. Late workers cannot reactivate deleted documents. A reconciliation task repairs stuck leases and missing queue deliveries.

