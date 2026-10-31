# Repository structure

[Documentation index](README.md) | Version 1.0 | 31 October 2026

```text
personal-rag-assistant/
  apps/
    web/
      src/app/(public)/
      src/app/auth/
      src/app/(app)/app/
      src/components/chat/
      src/components/documents/
      src/components/ui/
      src/lib/auth/
      src/lib/api/
      src/lib/streaming/
      src/types/
      tests/e2e/
    api/
      app/main.py
      app/core/config.py
      app/core/security.py
      app/core/logging.py
      app/api/v1/
      app/schemas/
      app/services/documents/
      app/services/chat/
      app/services/retrieval/
      app/services/quotas/
      app/providers/llm/
      app/providers/embeddings/
      app/repositories/
      app/workers/tasks.py
      app/workers/outbox.py
      app/workers/reconcile.py
      app/extraction/
      app/prompts/
      tests/unit/
      tests/integration/
      tests/security/
  packages/api-client/
  supabase/migrations/
  supabase/tests/
  infra/docker/
  infra/compose.yaml
  infra/compose.dev.yaml
  scripts/
  evals/datasets/
  evals/run.py
  load-tests/
  docs/
    PRD.md
    ARCHITECTURE.md
    DATABASE.md
    API.md
    SECURITY.md
    DEPLOYMENT.md
    RUNBOOK.md
    EVALUATION.md
    TODO.md
    ADR/
  .env.example
  README.md
```

This is the target source layout, not a claim that the application files already exist. This single blueprint can be split into the listed documentation files when creating the repository. API, worker and dispatcher share the Python codebase but run as separate processes.

