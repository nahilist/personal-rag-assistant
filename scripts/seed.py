import asyncio
import uuid
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "api"))

if "--sqlite" in sys.argv or not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./data/personal_rag.db"
    Path("./data").mkdir(parents=True, exist_ok=True)

from app.core.database import AsyncSessionLocal, engine, Base
from app.repositories.models import Profile, Document, IngestionJob
from app.workers.tasks import run_ingestion_job
from app.services.documents.storage import storage_service


async def seed():
    print("Seeding database with demo users and sample documents...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # User Alice
        alice_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
        alice_profile = Profile(
            id=alice_id,
            display_name="Alice Walker",
            preferred_language="en",
        )
        session.add(alice_profile)

        # Alice Document
        doc_a_id = uuid.uuid4()
        storage_key_a = storage_service.build_storage_key(alice_id, doc_a_id, "architecture_guide.md")
        doc_content = b"""# System Architecture Guide
The system runs FastAPI on the backend with PostgreSQL and pgvector for semantic storage.
Authentication is managed via Supabase Auth using signed JWTs.
Each tenant's documents are completely isolated using composite keys and RLS policies.
"""
        await storage_service.save_file(storage_key_a, doc_content)

        doc_a = Document(
            id=doc_a_id,
            user_id=alice_id,
            title="architecture_guide.md",
            storage_key=storage_key_a,
            mime_type="text/markdown",
            byte_size=len(doc_content),
            status="queued",
            active_generation=1,
        )
        session.add(doc_a)

        job_a = IngestionJob(
            id=uuid.uuid4(),
            user_id=alice_id,
            document_id=doc_a_id,
            generation=1,
            stage="queued",
            attempt=0,
            max_attempts=3,
        )
        session.add(job_a)
        await session.commit()

        # Ingest Alice Document
        print(f"Ingesting document {doc_a_id} for Alice...")
        await run_ingestion_job(session, job_a.id)

        # User Bob
        bob_id = uuid.UUID("22222222-2222-2222-2222-222222222222")
        bob_profile = Profile(
            id=bob_id,
            display_name="Bob Miller",
            preferred_language="en",
        )
        session.add(bob_profile)
        await session.commit()

    print("Seeding complete! Alice and Bob demo accounts are ready.")


if __name__ == "__main__":
    asyncio.run(seed())
