import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "Personal RAG Assistant"
    API_V1_PREFIX: str = "/api/v1"

    # Database & Cache
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgrespassword@localhost:54322/personal_rag"
    )
    # Fallback SQLite URL for local unit testing when Postgres is not running
    TEST_DATABASE_URL: str = "sqlite+aiosqlite:///./test_personal_rag.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Supabase Auth & JWT
    SUPABASE_URL: str = "http://localhost:54321"
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_JWKS_URL: Optional[str] = None
    SUPABASE_JWT_ISSUER: Optional[str] = None
    SUPABASE_JWT_AUDIENCE: str = "authenticated"
    SUPABASE_JWT_SECRET: str = "dev-secret-key-change-in-production-at-least-32-chars-long"

    # Storage
    STORAGE_BACKEND: str = "local"  # "local" or "supabase"
    STORAGE_BUCKET: str = "private-documents"
    STORAGE_LOCAL_DIR: str = "./data/storage"

    # LLM Settings
    LLM_PROVIDER: str = "mock"  # "mock", "ollama", "openai"
    LLM_BASE_URL: str = "http://localhost:11434/v1"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "llama3.2"

    # Embedding Settings
    EMBEDDING_PROVIDER: str = "mock"  # "mock", "ollama", "openai"
    EMBEDDING_BASE_URL: str = "http://localhost:11434/v1"
    EMBEDDING_API_KEY: str = ""
    EMBEDDING_MODEL: str = "all-minilm"
    EMBEDDING_REVISION: str = "v1"
    EMBEDDING_DIMENSION: int = 384

    # Quotas & Limits
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    MAX_ACTIVE_GENERATIONS: int = 20
    MAX_UPLOAD_BYTES: int = 20 * 1024 * 1024  # 20 MB
    MAX_DOCS_PER_USER: int = 20
    MAX_STORAGE_PER_USER: int = 200 * 1024 * 1024  # 200 MB
    MAX_PAGES_PER_DOC: int = 200
    MAX_DAILY_REQUESTS_PER_USER: int = 100
    REQUEST_TIMEOUT_SECONDS: int = 30


settings = Settings()

