# ADR 0001: Model and Embedding Provider Architecture

## Status
Accepted

## Context
The Personal RAG Assistant requires text generation and dense semantic embeddings for retrieval across multi-language user documents (English, Hindi, Hinglish). The application must run locally without external cloud billing during local testing (using Ollama or deterministic local embeddings) and support hosted production inference (OpenAI-compatible APIs or self-hosted vLLM) with strict cost, timeout, and context token budgets.

## Decision
1. **Configurable Adapter Pattern**: All LLM and embedding calls are abstracted through `LLMProvider` and `EmbeddingProvider` interfaces. No provider-specific SDK logic is scattered in feature code.
2. **LLM Inference**:
   - Development default: Ollama (`/api/chat` or OpenAI-compatible endpoint) or local test mock provider.
   - Production: OpenAI-compatible endpoint (vLLM or hosted provider) with strict token limits (800 max tokens output, 7,800 context token ceiling).
   - Enforce server-side streaming via POST SSE with heartbeat timeouts.
3. **Embeddings**:
   - Pinned model revision and dimension (e.g. `text-embedding-3-small` / `bge-m3` / dimension 1536 or 768 or 384).
   - Changing embedding configuration increments index generation and requires re-indexing prior to atomic activation.
   - Queries and indexed chunks must strictly use the exact same embedding configuration.

## Consequences
- Clean separation of provider logic from domain orchestration.
- Seamless switching between local offline development and production endpoints via environment variables.
- Prevents embedding dimension mismatch and silent retrieval degradation.

