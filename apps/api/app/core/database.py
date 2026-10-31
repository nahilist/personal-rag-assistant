import os
from pathlib import Path
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings
from app.core.logging import logger

Base = declarative_base()


def resolve_db_url() -> str:
    db_url = os.environ.get("DATABASE_URL", settings.DATABASE_URL)
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return db_url


current_db_url = resolve_db_url()

engine = create_async_engine(
    current_db_url,
    echo=False,
    pool_pre_ping=True if not current_db_url.startswith("sqlite") else False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def switch_to_sqlite(db_path: str = "./data/personal_rag.db"):
    global engine, AsyncSessionLocal, current_db_url
    target_dir = Path(db_path).parent
    target_dir.mkdir(parents=True, exist_ok=True)
    current_db_url = f"sqlite+aiosqlite:///{db_path}"
    engine = create_async_engine(current_db_url, echo=False)
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info(f"Switched to local SQLite database: {current_db_url}")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
