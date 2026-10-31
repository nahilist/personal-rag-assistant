-- Enable pgvector and pgcrypto extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    preferred_language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. DOCUMENTS
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    byte_size BIGINT NOT NULL DEFAULT 0,
    checksum TEXT,
    status TEXT NOT NULL DEFAULT 'uploading', -- uploading, queued, extracting, chunking, embedding, ready, failed, deleting
    failure_code TEXT,
    failure_message TEXT,
    active_generation INT NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_documents_id_user_id UNIQUE (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_documents_user_created ON public.documents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_user_status ON public.documents(user_id, status) WHERE deleted_at IS NULL;

-- 3. DOCUMENT GENERATIONS
CREATE TABLE IF NOT EXISTS public.document_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    user_id UUID NOT NULL,
    generation INT NOT NULL,
    embedding_model TEXT NOT NULL,
    embedding_revision TEXT NOT NULL,
    dimensions INT NOT NULL,
    chunker_version TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'staging', -- staging, active, superseded, aborted
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    activated_at TIMESTAMPTZ,
    CONSTRAINT fk_docgen_document_user FOREIGN KEY (document_id, user_id) REFERENCES public.documents(id, user_id) ON DELETE CASCADE,
    CONSTRAINT uq_docgen_doc_gen UNIQUE (document_id, generation)
);

-- 4. DOCUMENT CHUNKS
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    document_id UUID NOT NULL,
    generation INT NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384),
    page_start INT,
    page_end INT,
    section TEXT,
    token_count INT NOT NULL DEFAULT 0,
    content_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT fk_docchunks_document_user FOREIGN KEY (document_id, user_id) REFERENCES public.documents(id, user_id) ON DELETE CASCADE,
    CONSTRAINT uq_chunks_doc_gen_index UNIQUE (document_id, generation, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chunks_user_doc_gen ON public.document_chunks(user_id, document_id, generation);

-- 5. INGESTION JOBS
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    document_id UUID NOT NULL,
    generation INT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'queued', -- queued, extracting, chunking, embedding, completed, failed
    attempt INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    lease_until TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT fk_jobs_document_user FOREIGN KEY (document_id, user_id) REFERENCES public.documents(id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jobs_pending ON public.ingestion_jobs(stage, next_attempt_at) WHERE stage != 'completed';

-- 6. OUTBOX EVENTS
CREATE TABLE IF NOT EXISTS public.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    payload JSONB NOT NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_outbox_unpublished ON public.outbox_events(published_at) WHERE published_at IS NULL;

-- 7. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_conversations_id_user_id UNIQUE (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_created ON public.conversations(user_id, created_at DESC) WHERE deleted_at IS NULL;

-- 8. CONVERSATION DOCUMENTS (Document Scope)
CREATE TABLE IF NOT EXISTS public.conversation_documents (
    conversation_id UUID NOT NULL,
    document_id UUID NOT NULL,
    user_id UUID NOT NULL,
    PRIMARY KEY (conversation_id, document_id),
    CONSTRAINT fk_convdocs_conversation_user FOREIGN KEY (conversation_id, user_id) REFERENCES public.conversations(id, user_id) ON DELETE CASCADE,
    CONSTRAINT fk_convdocs_document_user FOREIGN KEY (document_id, user_id) REFERENCES public.documents(id, user_id) ON DELETE CASCADE
);

-- 9. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed', -- pending, streaming, completed, failed, cancelled
    request_key UUID,
    token_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT fk_messages_conversation_user FOREIGN KEY (conversation_id, user_id) REFERENCES public.conversations(id, user_id) ON DELETE CASCADE,
    CONSTRAINT uq_messages_user_request_key UNIQUE (user_id, request_key)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at ASC);

-- 10. MESSAGE SOURCES
CREATE TABLE IF NOT EXISTS public.message_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    document_id UUID NOT NULL,
    chunk_id UUID NOT NULL,
    generation INT NOT NULL,
    source_label TEXT NOT NULL,
    page_start INT,
    page_end INT,
    section TEXT,
    excerpt TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT fk_sources_document_user FOREIGN KEY (document_id, user_id) REFERENCES public.documents(id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_message_sources_message ON public.message_sources(message_id);

-- 11. QUOTA RESERVATIONS
CREATE TABLE IF NOT EXISTS public.quota_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL, -- storage_bytes, document_count
    units BIGINT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    state TEXT NOT NULL DEFAULT 'active', -- active, committed, released
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_quota_user_active ON public.quota_reservations(user_id, state, expires_at);

-- 12. USAGE EVENTS
CREATE TABLE IF NOT EXISTS public.usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id UUID,
    kind TEXT NOT NULL, -- llm_tokens, embedding_tokens, storage_bytes
    model TEXT,
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    units BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_usage_user_created ON public.usage_events(user_id, created_at DESC);

-- 13. AUDIT EVENTS
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    request_id UUID,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can select and update their own profile
CREATE POLICY profiles_user_policy ON public.profiles
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Documents: Users can access and modify only their own documents
CREATE POLICY documents_user_policy ON public.documents
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Document Generations: Users can access their own document generations
CREATE POLICY docgen_user_policy ON public.document_generations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Document Chunks: Users can access their own document chunks
CREATE POLICY docchunks_user_policy ON public.document_chunks
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Ingestion Jobs: Users can access their own ingestion jobs
CREATE POLICY jobs_user_policy ON public.ingestion_jobs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Conversations: Users can access and modify only their own conversations
CREATE POLICY conversations_user_policy ON public.conversations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Conversation Documents: Users can access their own scoped conversation documents
CREATE POLICY convdocs_user_policy ON public.conversation_documents
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Messages: Users can access their own messages
CREATE POLICY messages_user_policy ON public.messages
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Message Sources: Users can access their own message sources
CREATE POLICY sources_user_policy ON public.message_sources
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Quota Reservations: Users can access their own reservations
CREATE POLICY quota_user_policy ON public.quota_reservations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Usage Events: Users can view their own usage events
CREATE POLICY usage_user_policy ON public.usage_events
    FOR SELECT USING (auth.uid() = user_id);

-- ==============================================================================
-- SECURITY INVOKER RETRIEVAL FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.match_document_chunks(
    query_embedding vector(384),
    match_count INT,
    filter_user_id UUID,
    filter_document_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    generation INT,
    chunk_index INT,
    content TEXT,
    page_start INT,
    page_end INT,
    section TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    -- Strict ownership boundary: Caller must either be the user themselves or explicitly authorized
    IF auth.uid() IS NOT NULL AND auth.uid() != filter_user_id THEN
        RAISE EXCEPTION 'Cross-user access denied';
    END IF;

    RETURN QUERY
    SELECT
        c.id,
        c.document_id,
        c.generation,
        c.chunk_index,
        c.content,
        c.page_start,
        c.page_end,
        c.section,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM public.document_chunks c
    INNER JOIN public.documents d
        ON c.document_id = d.id AND c.user_id = d.user_id
    WHERE
        c.user_id = filter_user_id
        AND d.status = 'ready'
        AND d.deleted_at IS NULL
        AND c.generation = d.active_generation
        AND (filter_document_ids IS NULL OR c.document_id = ANY(filter_document_ids))
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
