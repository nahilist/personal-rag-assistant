# AGENTS.md — Personal RAG Assistant

## Purpose

These instructions apply to coding agents working anywhere in this repository. Build a private, full-stack, multi-user document assistant with grounded answers and verifiable citations. Read the actual repository before changing it; documentation describes intended behavior and may precede implementation.

## Read before working

Read `README.md`, `PROJECT-OVERVIEW.md`, `ARCHITECTURE.md`, `PROJECT-STRUCTURE.md`, and `TODO.md` from the documentation directory. Read the relevant domain documents before implementing that feature:

- Product and UI: `PRD.md`, `UX-AND-PAGES.md`.
- Documents and retrieval: `DOCUMENT-INGESTION.md`, `RAG-PIPELINE.md`.
- Persistence and endpoints: `DATABASE.md`, `API.md`.
- Safety: `SECURITY-AND-PRIVACY.md`.
- Infrastructure: `DEPLOYMENT-AND-DOCKER.md`, `SCALING-AND-COSTS.md`.
- Verification and operations: `TESTING-AND-EVALUATION.md`, `MONITORING-AND-RUNBOOK.md`, `LAUNCH-CHECKLIST.md`.

The documentation bundle initially has these files together. In an application repository, keep `AGENTS.md` at the repository root and place domain documents under `docs/`; resolve links according to their actual location. Do not assume files or services exist because they appear in a proposed layout.

## Project baseline

- Next.js App Router, TypeScript and Tailwind for the frontend.
- FastAPI and Pydantic for the backend.
- Supabase Auth, private Storage, PostgreSQL and pgvector.
- Celery and Redis for background ingestion, backed by durable PostgreSQL job state and outbox delivery.
- Configurable LLM and embedding adapters; no provider-specific logic scattered through feature code.
- Ollama for optional local development; hosted inference or private model serving for public deployment.
- REST endpoints and POST fetch streaming with SSE-formatted events.

Inspect existing package manifests, lockfiles and configuration before installing dependencies. Reuse compatible existing dependencies and patterns. Do not change the stack without a concrete reason and an architecture decision record.

## Capacity contract

Plan initially for 1,000 registered users, 100 active sessions and 20 simultaneous model generations. These are targets requiring real load tests, not guaranteed capacity. Registered users and concurrent generations must never be described as the same metric.

Use shared atomic admission control across API replicas, bounded queues, per-user quotas and timeouts. Do not introduce unbounded uploads, parser work, context windows, output lengths or retries. Do not claim that free model weights provide free production hosting.

## Working method

1. Inspect relevant code, instructions, migrations and tests.
2. Select the next incomplete task from `TODO.md` within the user's requested scope.
3. Implement the smallest complete user flow, including real persistence, authorization and necessary failure states.
4. Run the relevant existing checks and add meaningful tests for changed behavior.
5. Update affected API/schema/operating documentation.
6. Mark tasks complete only after implementation and verification. Report blockers and unverified assumptions explicitly.

Start with auth and ownership isolation, then one vertical slice: upload a text PDF, ingest it asynchronously, ask a question and open its citation. Extend only after that flow works.

Do not make unrelated edits, erase user changes, invent successful test results or present mocked behavior as production functionality. Use fixtures in tests and clearly labeled local demos only. Avoid unnecessary abstractions and infrastructure.

## Frontend rules

- Use strict TypeScript and typed API contracts. Generate clients from OpenAPI when the project supports it.
- Keep reusable components and domain logic separate; reuse established UI patterns.
- Provide responsive layouts, keyboard navigation, visible focus and labeled controls.
- Handle loading, empty, processing, insufficient-evidence, expired-session, interrupted-stream, quota and provider-failure states.
- Use safe Markdown rendering; never render untrusted raw HTML without proper sanitization.
- Public environment variables contain public configuration only. Privileged credentials never enter browser bundles.
- Authentication redirects must preserve password-recovery handling before ordinary authenticated-dashboard navigation.

## Backend and authorization rules

- Validate requests with schemas and verify JWT signatures, allowed algorithms, issuer, audience and expiry using configured project settings; support key rotation.
- Derive identity from the verified token. Never trust a submitted `user_id`, admin flag, plan or ownership claim.
- Enforce ownership on every endpoint, database query, vector retrieval, source preview, download, export and mutation.
- Enable RLS and matching insert/update policies on exposed user tables. Keep storage private.
- Prefer user-scoped database operations and security-invoker retrieval functions.
- Privileged worker credentials bypass RLS; isolate their use and apply explicit ownership/document predicates.
- Cross-entity associations must belong to the same user; enforce this with schema constraints as well as application validation.
- Avoid connection-pool identity leakage: authenticated role/claims must be transaction-local and cleared correctly.
- Use cursor pagination, bounded payloads, clear error codes and request IDs. Do not expose raw internal errors.

## Document ingestion rules

- Reserve quotas atomically; authorize uploads only for an exact server-generated private object key.
- Finalize against actual object size and content signature, not browser metadata.
- Enforce limits on file bytes, pages, extracted text, archive expansion, memory and execution time.
- MVP supports text-based PDF, DOCX, TXT and Markdown. Detect scanned/encrypted/unsupported files and return a specific actionable status.
- Parse and embed in background workers, never in a long-running web request.
- Persist jobs and outbox events transactionally. Queue delivery is retryable; the queue is not the authoritative job database.
- Make jobs idempotent by document and generation, with leases, bounded retries and reconciliation.
- Stage and atomically activate complete index generations. Late jobs must not reactivate deleted documents.
- Preserve page or section provenance; do not invent page numbers for formats without stable pages.

## Retrieval and model rules

- Apply authorization before returning retrieval candidates. Never search globally and filter only the final answer.
- Search only ready, authorized, active document generations within validated conversation scope.
- Pin embedding model, revision, dimension and distance configuration. Re-embed through a new generation when changing incompatible settings.
- Enforce tokenizer-based input/output budgets and bounded conversation history.
- Treat retrieved text as untrusted data. Document instructions cannot override system rules or expand permissions.
- MVP has no executable tools, autonomous actions, code execution or arbitrary URL fetches.
- Abstain when the supplied evidence is insufficient. Never fabricate facts, quotations, document titles or citations.
- Citation labels must resolve server-side to retrieved authorized chunks. Recheck ownership when opening historical sources.
- Distinguish citation format validity from factual support; evaluate both.
- Never share cached answers across users. Include scope and document generations in private cache identities, or disable caching until invalidation is reliable.

## Streaming and reliability

- Use POST fetch streaming for authenticated chat bodies; do not assume native EventSource supports the POST contract.
- Support heartbeat events, bounded model timeouts and proxy streaming settings.
- Persist request/message IDs and idempotency keys so retries cannot duplicate charges or messages.
- Handle cancellation, disconnects and partial outputs with explicit message status.
- Release concurrency and quota reservations on completion, failure and cancellation; reconcile expired leases after crashes.
- Persist final request status independently of whether the browser receives the final event.

## Database changes

- Write versioned migrations; do not manually alter production schema as an undocumented fix.
- Prefer backward-compatible expand/contract migrations.
- Add ownership constraints and appropriate user/document indexes.
- Benchmark filtered vector-search recall and latency; an ANN index is not automatically the best choice for small per-user corpora.
- Changing embedding dimension requires a compatible schema/index migration and re-index strategy.
- Never run destructive resets, delete production data or rewrite shared migration history without explicit authorization.

## Privacy and deletion

- Never log secrets, full document text, access tokens or complete prompts by default.
- Use short-lived authorized source/download links.
- Revoke document retrieval immediately on deletion; purge originals, chunks, previews and caches through an idempotent tracked job.
- Handle deletion races with ingestion and historical citations.
- Explain that saved answers may still contain document content until the associated conversation/account is deleted.
- Document external model processing and actual retention behavior. Do not imply all computation stays on the user's device.
- Keep administrator operations minimal and audited; routine monitoring should not expose private content.

## Testing requirements

Run checks appropriate to the changed behavior using commands discovered from the repository. Do not invent package scripts or assume a test passed because it exists.

Before public launch, verify:

- Cross-user denial across every endpoint, storage path and vector/source lookup.
- Recovery links for valid, expired, reused, existing-session and production-domain cases.
- Invalid files, parser bounds, duplicate finalization, worker crashes and retries.
- Deletion during indexing and inability to retrieve old sources afterward.
- Idempotency, quota races, global concurrency, cancellation and disconnect behavior.
- Unsupported questions, malicious document instructions and valid source-backed answers.
- Real-model load tests alongside ingestion. Mock-model throughput is not production inference capacity.

Maintain a multilingual evaluation dataset and measure retrieval recall, citation support, abstention, latency and usage. Report actual checks run and remaining gaps.

## Deployment and operations

- Separate web/API, ingestion, dispatcher and model serving processes.
- Keep database, Redis and model services private; expose only intended ingress.
- Use pinned dependencies, non-root containers, resource limits and managed secrets.
- Validate environment variables at startup and document their names without real values.
- Configure exact local/staging/production auth callbacks and allowed origins.
- Verify backups of both database and original private files, plus restoration and application rollback.
- Do not provision paid resources, publish externally, send messages or change production access unless authorized by the user's task.

## Scope boundaries

Do not add billing, OCR infrastructure, shared workspaces, external connectors, autonomous agents, Kubernetes or a separate vector database just because they might be useful. These require product need or measured constraints. Do not spawn subagents unless the user or applicable instructions explicitly request delegation.

## Completion report

Report concisely:

1. What changed and the resulting user behavior.
2. Checks run and their outcomes.
3. Remaining blockers, unverified behavior or material limitations.

Never claim production readiness, security or 1,000-user capacity without the corresponding evidence.
