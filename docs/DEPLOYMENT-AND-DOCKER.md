# Deployment and Docker plan

[Documentation index](README.md) | Version 1.0 | 31 October 2026

### Local development

Run web, API, worker, dispatcher, Redis and local/test database services through Compose profiles. Ollama can run on the host or in an optional model profile. Container `localhost` points to that container, not your laptop; use configured service DNS names or the platform's supported host gateway. Never ship a production client pointing at your own localhost.

### Public launch

| Service | Initial deployment proposal |
|---|---|
| Web | Managed Next.js hosting or container host |
| API | Two stateless replicas behind TLS load balancer |
| Ingestion | One or two independently scalable workers |
| Dispatcher/scheduler | One logical scheduler with locking/reconciliation |
| Database/Auth/Storage | Managed Supabase project with production backups |
| Redis | Private authenticated managed instance; durable configuration appropriate to queue delivery |
| LLM | Hosted provider, or separate private GPU inference service |
| Embeddings | Private CPU/GPU service or provider; benchmark ingestion contention |

Resource starting hypothesis: each API replica 2 vCPU/4 GB, each parser worker 2–4 vCPU/4–8 GB, database 4 vCPU/16 GB. These are experiment inputs, not guarantees or minimum requirements. Measure memory, query latency and stream concurrency before purchasing capacity. Size inference separately using the chosen model, precision, context length and benchmarked throughput.

### Docker requirements

- Separate build/runtime stages, pinned dependencies, non-root users and health checks.
- No secrets in images or build arguments that leak into layers.
- Set parser process CPU/memory/time limits and use temporary directories with cleanup.
- API, queue, database and model network access follow least privilege; only public web/API ingress exposed.
- Compose is suitable for development and a small single-host pilot. Single-host Compose has a shared failure domain; the two-replica launch design requires appropriate hosts or a managed container platform.
- A Docker container does not make arbitrary file parsers safe by itself; enforce parser limits and patch dependencies.

### Environment contract

```dotenv
# Public browser configuration only
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_API_BASE_URL=

# Server-only configuration
SUPABASE_URL=
SUPABASE_JWKS_URL=
SUPABASE_JWT_ISSUER=
SUPABASE_JWT_AUDIENCE=
DATABASE_URL=
REDIS_URL=
STORAGE_BUCKET=private-documents
LLM_PROVIDER=
LLM_BASE_URL=
LLM_API_KEY=
LLM_MODEL=
EMBEDDING_BASE_URL=
EMBEDDING_MODEL=
EMBEDDING_REVISION=
EMBEDDING_DIMENSION=
ALLOWED_ORIGINS=
MAX_ACTIVE_GENERATIONS=20
MAX_UPLOAD_BYTES=20971520
```

Use the actual authentication project settings, do not assume issuer/audience values. Validate JWT signature, algorithm, issuer, audience, expiry and signing-key rotation. If privileged worker credentials are needed, inject them only into the worker environment; never add a public-prefixed service key.

### Release pipeline

Pull request → lint/typecheck → unit/integration/RLS tests → image/security checks → staging migrations → staging smoke/evaluation → production migration → rolling deployment → readiness and smoke verification. Use backward-compatible expand/contract migrations. Roll back application images safely; destructive schema rollback needs a separate recovery plan.

