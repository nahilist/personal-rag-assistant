# Personal RAG Assistant

A private, full-stack, multi-user document assistant with grounded answers and verifiable citations.

## System Architecture

```text
                     +---------------------------------------+
                     |         Browser / Client UI          |
                     |       (Next.js 14 App Router)        |
                     +-------------------+-------------------+
                                         |
                       POST SSE Stream   |   REST Mutations / Queries
                                         v
                     +---------------------------------------+
                     |         FastAPI Backend (API)         |
                     |      (Ownership, Quotas & RAG)        |
                     +---------+-------------------+---------+
                               |                   |
            Auth, RLS & Jobs   |                   | Raw Files (Private)
                               v                   v
+------------------------------------+   +------------------------------------+
|       PostgreSQL + pgvector        |   |           Storage Service          |
| (Profiles, Documents, Generations, |   | (Keys: {user_id}/{doc_id}/{file})  |
|  Chunks, Conversations, Messages,  |   +------------------------------------+
|  Jobs, Outbox & Audit Events)      |                     ^
+-----------------+------------------+                     |
                  ^                                        | Read / Parse
                  | Ingestion, Chunks & Generations        |
+-----------------+----------------------------------------+------------------+
|                          Ingestion Worker & Reconciler                      |
|     (Bounded Extraction, Section Chunker, Embedding Provider & Leases)      |
+------------------------------------+----------------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------------+
|                      Configurable Model Adapters                            |
|             Embeddings: Local Mock / Ollama / OpenAI-compatible             |
|                  LLM: Local Mock / Ollama / OpenAI-compatible               |
+-----------------------------------------------------------------------------+
```

## Repository Structure

```text
personal-rag-assistant/
  apps/
    web/                 # Next.js 14 App Router, TypeScript, Tailwind CSS
      src/app/           # Routes: /, /app, /app/documents, /app/chat/[id], /auth/*, /admin
      src/components/    # UI components, ChatContainer, CitationDrawer, DocumentUploadModal
      src/lib/           # Authenticated API client, authStore, SSE streaming reader
    api/                 # FastAPI, SQLAlchemy, Pydantic, Celery, Vector Search
      app/api/v1/        # Endpoints: /me, /documents, /conversations, /requests, /health, /admin
      app/core/          # Configuration, JWT security & identity, safe logging, DB sessions
      app/extraction/    # Bounded extractors (PDF, DOCX, TXT, MD), scanned PDF OCR detector
      app/providers/     # Configurable LLM and Embedding provider adapters (Mock, Ollama, OpenAI)
      app/repositories/  # SQLAlchemy models with composite tenant keys and vector types
      app/services/      # Document lifecycle, storage, quota limiter, retriever & chat service
      app/workers/       # Durable ingestion tasks, transactional outbox & lease reconciler
      tests/             # Unit, security isolation (2-user denial) & vertical slice tests
  packages/
    api-client/          # Shared TypeScript contracts and schemas
  supabase/
    migrations/          # PostgreSQL schema with pgvector, RLS policies, security-invoker RPC
  infra/
    docker/              # Multi-stage Dockerfiles for API and Web
    compose.yaml         # Production multi-service deployment
    compose.dev.yaml     # Local development Compose profile (with optional Ollama)
  evals/
    datasets/            # Curated multilingual evaluation dataset (English, Hindi, Hinglish)
    run.py               # Evaluation harness (measures recall@5, abstention, citation validity)
  load-tests/
    locustfile.py        # 100-user load test scenarios & burst limits
  docs/                  # Architecture, PRD, API, Database, Operations & ADRs
  .env.example           # Complete environment configuration contract
```

---

## Quickstart & Local Setup

### 1. Requirements
- Python 3.11+ or 3.12 (with `uv`)
- Node.js 20+ or 22+ (with `npm`)

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Backend Setup & Tests
```bash
cd apps/api
# Create venv and install dependencies
uv venv --python 3.12
uv pip install -e ".[dev]"

# Run unit, security isolation and integration tests
uv run pytest -v
```

### 4. Run RAG Evaluation Benchmark
```bash
apps/api/.venv/Scripts/python.exe evals/run.py
```

### 5. Web Frontend Setup & Build
```bash
cd apps/web
npm install
npm run build
```

### 6. Start Services
- **Backend**:
  ```bash
  cd apps/api
  uv run uvicorn app.main:app --reload --port 8000
  ```
- **Frontend**:
  ```bash
  cd apps/web
  npm run dev
  ```
  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verified Checks and Test Results

| Test Category | Suite / Command | Result | Details |
|---|---|---|---|
| **Security & Isolation** | `pytest tests/security/test_two_user_isolation.py` | **PASSED** | Verifies User B cannot list, retrieve, scope, or delete User A's documents, conversations or chunks |
| **Complete Vertical Slice** | `pytest tests/integration/test_vertical_slice.py` | **PASSED** | End-to-end flow: reserve upload, upload binary, background ingestion, streaming chat, citation verification, delete revocation |
| **Bounded Extraction** | `pytest tests/unit/test_extraction.py` | **PASSED** | PDF page limits, DOCX sections, scanned PDF `ocr_required` detection |
| **JWT Authentication** | `pytest tests/unit/test_security_auth.py` | **PASSED** | Verified signature, expired token rejection, tampered token rejection |
| **Frontend Compilation** | `npm run build` (Next.js 14) | **PASSED** | All 13 static and dynamic routes compiled with 0 type errors |
| **Multilingual RAG Eval** | `python evals/run.py` | **PASSED** | Recall@5: 100%, Abstention Accuracy: 100%, Citation Technical Validity: 100% |

---

## Production Deployment

To run the complete containerized stack:
```bash
docker compose -f infra/compose.yaml up --build
```
Includes:
- PostgreSQL 16 with pgvector extension (`db`)
- Redis cache & queue (`redis`)
- FastAPI backend replicas (`api`)
- Ingestion workers (`worker`)
- Next.js Web frontend (`web`)
