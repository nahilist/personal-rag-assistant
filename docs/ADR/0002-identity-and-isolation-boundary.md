# ADR 0002: Identity and Multi-User Isolation Boundary

## Status
Accepted

## Context
The Personal RAG Assistant is a multi-user application where each user's uploaded documents, extracted chunks, conversations, and search citations must be completely isolated. A critical requirement is that no user can access, list, search, preview, or delete another user's content under any condition (zero cross-user leakage).

## Decision
1. **Derive Identity Exclusively from Verified Token**:
   - Authentication uses Supabase Auth with JWT verification (RS256/HS256 signature, expiry, issuer, and audience).
   - Identity (`user_id`) is strictly extracted from verified claims (`sub` / `uid`). Never trust a client-supplied `user_id` or query parameter.
2. **Schema-Level Isolation Constraints**:
   - Every parent entity (`documents`, `conversations`) has a composite unique constraint `(id, user_id)`.
   - Child relational tables (`document_generations`, `document_chunks`, `ingestion_jobs`, `conversation_documents`, `messages`) enforce composite foreign keys referencing `(parent_id, user_id)`. This makes cross-user association mathematically impossible at the database constraint layer.
3. **Database Row Level Security (RLS)**:
   - RLS is enabled on all user-facing tables with policies requiring `auth.uid() = user_id`.
   - Search RPC functions use `security invoker` and explicitly filter on `user_id = auth.uid()`.
4. **Storage Isolation**:
   - Storage objects use strict paths: `{user_id}/{document_id}/{filename}`.
   - Storage access requires short-lived signed URLs generated only after server-side ownership verification.

## Consequences
- Multi-layer defense-in-depth: API auth layer, database composite foreign keys, RLS policies, and private storage keys.
- Impossible for Account A to associate Account B's documents into Account A's conversation.
