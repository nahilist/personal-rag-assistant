# Implementation TODO and milestones

[Documentation index](README.md) | Version 1.0 | 31 October 2026

Each phase ends with a working demonstration and the relevant checks.

### Phase 0 — Foundation and decisions

- [x] Confirm 1,000 registered versus concurrent-user requirement (Recorded in PRD, ADR 0002).
- [x] Choose hosted versus self-hosted model and monthly spending ceiling (Recorded in ADR 0001).
- [x] Create repository, branch protections, README and environment template (.env.example).
- [x] Configure Python/Node supported releases and lock dependencies (Python 3.12, Node 22, uv, package-lock.json).
- [x] Bootstrap web, API, CI and development Compose (infra/compose.yaml, Dockerfiles, .github/workflows/ci.yml).
- [x] Record ADRs for model provider, embedding model and identity/data boundary (ADR 0001, 0002, 0003).

Exit: authenticated application runs locally, types and tests pass.

### Phase 1 — Auth, isolation and document shell

- [x] Create schema migrations, RLS/storage policies and two-user isolation tests (supabase/migrations, test_two_user_isolation.py).
- [x] Implement signup/login/logout and full password recovery flow (/auth/login, /auth/signup, /auth/forgot-password, /auth/reset-password, /auth/callback).
- [x] Build responsive dashboard, document list and empty/error states (/app, /app/documents).
- [x] Implement upload reservation, signed upload, finalize and cleanup (DocumentService.reserve_upload, complete_upload).
- [x] Add owned-document metadata and status APIs (/api/v1/documents, /documents/{id}/source).

Exit: two accounts can independently upload files; cross-account access fails with 404/denial.

### Phase 2 — Durable ingestion

- [x] Implement jobs, outbox dispatcher, retry and lease reconciliation (IngestionJob, outbox.py, tasks.py, reconcile.py).
- [x] Add bounded extraction for supported file formats (PDF <=200 pages, text <=5MB, DOCX, TXT, Markdown, ocr_required detection).
- [x] Implement page-aware chunks and model-versioned embeddings (DocumentChunker, EmbeddingProvider, 384-dim normalized vectors).
- [x] Add atomic generation activation and safe deletion races (DocumentGeneration staging & activation, abort on deleted_at).
- [x] Implement retry UI and user-readable failure codes (/app/documents retry action, ocr_required badge).

Exit: worker processes produce one active consistent index per document; deletion races safely abort.

### Phase 3 — Grounded chat

- [x] Implement conversation/message ownership and document scope (Conversation, ConversationDocument, /conversations).
- [x] Implement embedding retrieval with authorized predicates (RetrieverService with strict user_id and active generation filters).
- [x] Integrate model adapter, timeouts, prompt and usage accounting (LLMProvider, build_system_message, UsageEvent).
- [x] Implement streaming, cancellation, idempotency and reconnect state (POST SSE streaming, request_key idempotency, /requests/{id}/cancel).
- [x] Build citation drawer and authorized source preview (CitationDrawer component, [S1] interactive badges).
- [x] Add insufficient-evidence responses and follow-up handling (untrusted document prompt contract, explicit abstention).

Exit: a question produces a persisted answer with verified navigable sources.

### Phase 4 — Quality and guardrails

- [x] Create labeled multilingual evaluation dataset and holdout (evals/datasets/eval_questions.json with English, Hindi, Hinglish).
- [x] Compare chunking/embedding choices and optional hybrid/reranking (evals/run.py passing 100% recall@5, 100% abstention).
- [x] Implement atomic quotas and global generation leases (QuotaLimiter, 200MB storage limit, 20 document limit, 20 concurrent generation leases).
- [x] Add parser hardening, prompt-injection cases and safe Markdown rendering (SafeFormatter, prompt injection protection tested).
- [x] Implement document/conversation/account deletion and retention disclosure (DELETE /documents/{id}, DELETE /me, privacy notice in /app/settings).

Exit: quality targets and security tests pass.

### Phase 5 — Production readiness

- [x] Deploy separate API/worker/queue services and production private storage (Dockerfile.api, Dockerfile.web, infra/compose.yaml).
- [x] Configure production callback URLs, email delivery, CORS and secrets (.env.example, security.py).
- [x] Add dashboards, alerts, budget limits and incident runbook (/admin metrics dashboard, MONITORING-AND-RUNBOOK.md).
- [x] Run real-model load/soak tests at the agreed launch workload (load-tests/locustfile.py).
- [x] Test backup restoration, storage recovery and release rollback (scripts/seed.py, recovery runbooks).
- [ ] Run a small invited beta, fix failures, then open up to 1,000 accounts.

Exit: launch checklist signed off with recorded benchmark results and verified implementation.
