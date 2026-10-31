import uuid
import os
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app

# Set test storage directory
os.environ["STORAGE_LOCAL_DIR"] = "./data/test_storage"
settings.STORAGE_LOCAL_DIR = "./data/test_storage"

TEST_DB_URL = "sqlite+aiosqlite:///./test_personal_rag.db"
test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestingSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def init_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    # Clean up test db file if exists
    if os.path.exists("./test_personal_rag.db"):
        try:
            os.remove("./test_personal_rag.db")
        except Exception:
            pass


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
def user_a():
    return uuid.UUID("11111111-1111-1111-1111-111111111111")


@pytest.fixture
def user_b():
    return uuid.UUID("22222222-2222-2222-2222-222222222222")


@pytest.fixture
def auth_headers_a(user_a):
    token = create_access_token(user_id=user_a, email="user_a@example.com")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_b(user_b):
    token = create_access_token(user_id=user_b, email="user_b@example.com")
    return {"Authorization": f"Bearer {token}"}
