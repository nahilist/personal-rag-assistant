# Read this first

[Documentation index](README.md) | Version 1.0 | 31 October 2026

Build a private, multi-user assistant that answers questions from each user's uploaded documents, with verifiable source references. Start with a modular application, one database, and background workers. Scale individual services when measurements justify it.

This document combines the PRD, architecture, repository structure, data model, API contracts, RAG design, security requirements, deployment plan, testing strategy, operating procedures, and development backlog.

### Capacity assumptions

| Metric | Initial launch target | Meaning |
|---|---:|---|
| Registered users | 1,000 | Accounts stored in the system |
| Daily active users | 200 | Planning assumption, not a prediction |
| Simultaneous active sessions | 100 | Browsing, reading or chatting |
| Simultaneous model generations | 20 | Separate, explicitly limited inference capacity |
| Questions per active user/day | 20 | 4,000 requests/day |
| Documents per account | 20 | Initial hard quota |
| File size | 20 MB maximum | Also enforce page and extracted-text limits |
| Pages per document | 200 maximum | Prevent a small compressed file causing huge work |
| Storage per account | 200 MB | Aggregate quota overrides individual file limits |
| Model response limit | 800 tokens | Default; enforce server-side |

These are proposed product limits. Supporting 1,000 accounts does not prove support for 1,000 simultaneous model responses. The latter requires measured GPU/provider throughput, admission control, and materially greater budget.

### Initial decisions

- Frontend: Next.js App Router, TypeScript, Tailwind CSS.
- Backend: FastAPI, Python, Pydantic, explicit service modules.
- Identity/files/database: Supabase Auth, private Storage, PostgreSQL with pgvector.
- Durable ingestion queue: Celery with Redis; PostgreSQL remains authoritative for job state.
- LLM: configurable provider adapter supporting a hosted endpoint or a privately hosted open-weight model.
- Local model development: Ollama. Production self-hosting option: vLLM, subject to model/hardware compatibility and benchmarks.
- Embeddings: multilingual model selected by evaluation; fixed model revision and vector dimension per index generation.
- Transport: REST for mutations and reads; POST fetch streaming with SSE-formatted events for chat.
- Packaging: Docker for API, ingestion worker, and scheduler. Web may use a managed Next.js host.
- No Kubernetes required for the first launch.

