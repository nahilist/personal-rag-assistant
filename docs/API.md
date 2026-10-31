# API specification

[Documentation index](README.md) | Version 1.0 | 31 October 2026

Base path: `/api/v1`. All application endpoints require a verified access token except health endpoints. Never trust `user_id` in request bodies.

| Method | Route | Contract |
|---|---|---|
| GET | `/me` | Current profile, limits and usage |
| POST | `/documents/uploads` | Reserve quota and return document ID/upload authorization |
| POST | `/documents/{id}/complete` | Validate stored object and queue ingestion; return 202 |
| GET | `/documents` | Cursor-paginated owned documents |
| GET | `/documents/{id}` | Status and safe metadata |
| POST | `/documents/{id}/retry` | Retry eligible failed ingestion |
| DELETE | `/documents/{id}` | Revoke access and enqueue purge; return 202 |
| GET | `/documents/{id}/source` | Authorized bounded excerpt or short-lived download |
| POST | `/conversations` | Create conversation with validated document scope |
| GET | `/conversations` | Cursor-paginated history |
| GET | `/conversations/{id}/messages` | Paginated message history |
| PATCH | `/conversations/{id}` | Rename or update validated scope |
| DELETE | `/conversations/{id}` | Delete conversation and messages |
| POST | `/conversations/{id}/messages` | Create request and stream answer |
| POST | `/requests/{id}/cancel` | Best-effort generation cancellation |
| GET | `/requests/{id}` | Recover completed/failed state after stream interruption |
| DELETE | `/me` | Start authenticated account deletion |
| GET | `/health/live` | Process liveness, no sensitive details |
| GET | `/health/ready` | Dependency readiness, restricted detail |

### Chat request example

```json
{
  "request_key": "client-generated-uuid",
  "message": "Is document ka main conclusion kya hai?",
  "document_ids": ["owned-ready-document-uuid"],
  "language": "hinglish"
}
```

### Stream events

```text
event: request
data: {"request_id":"uuid","message_id":"uuid"}

event: delta
data: {"text":"Document ke according..."}

event: sources
data: {"sources":[{"label":"S1","document_id":"uuid","page":4,"excerpt":"..."}]}

event: done
data: {"status":"completed"}
```

Use fetch with POST and a streaming reader; native EventSource does not send this POST body. Send heartbeats, disable proxy response buffering, and configure stream timeouts. Persist completion separately from network delivery. A disconnected browser must not cause an unbounded orphan generation; cancel or enforce a short bounded completion timeout.

Errors: `{ "error": { "code": "QUOTA_EXCEEDED", "message": "...", "request_id": "...", "retryable": false } }`. Use 400 validation, 401 authentication, 404 inaccessible/absent object, 409 invalid state, 413 oversized upload, 429 rate/capacity limit, 503 dependency unavailable. Include `Retry-After` when meaningful.

