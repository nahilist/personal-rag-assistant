import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.workers.tasks import run_ingestion_job
from app.repositories.models import IngestionJob
from sqlalchemy import select


@pytest.mark.asyncio
async def test_two_user_document_and_chat_isolation(
    client: AsyncClient,
    db_session: AsyncSession,
    auth_headers_a: dict,
    auth_headers_b: dict,
):
    # 1. User A reserves an upload
    res_a = await client.post(
        "/api/v1/documents/uploads",
        json={"filename": "alice_secret.md", "byte_size": 250, "mime_type": "text/markdown"},
        headers=auth_headers_a,
    )
    assert res_a.status_code == 200
    doc_a_id = res_a.json()["document_id"]

    # User A uploads binary
    doc_content = b"# Alice Secret Project\nThe secret code is ALICE-TOP-SECRET-99."
    up_res = await client.post(
        f"/api/v1/documents/{doc_a_id}/upload-binary",
        content=doc_content,
        headers=auth_headers_a,
    )
    assert up_res.status_code == 200

    # User A completes upload
    comp_res = await client.post(
        f"/api/v1/documents/{doc_a_id}/complete",
        headers=auth_headers_a,
    )
    assert comp_res.status_code == 202

    # Process ingestion for User A's document
    job_stmt = select(IngestionJob).where(IngestionJob.document_id == uuid.UUID(doc_a_id))
    job = (await db_session.execute(job_stmt)).scalar_one()
    await run_ingestion_job(db_session, job.id)

    # 2. User B lists documents: must NOT see User A's document
    list_b = await client.get("/api/v1/documents", headers=auth_headers_b)
    assert list_b.status_code == 200
    b_items = list_b.json()["items"]
    assert not any(d["id"] == doc_a_id for d in b_items)

    # 3. User B attempts direct GET of User A's document: must return 404
    get_b = await client.get(f"/api/v1/documents/{doc_a_id}", headers=auth_headers_b)
    assert get_b.status_code == 404

    # 4. User B attempts source excerpt preview of User A's document: must return 404
    source_b = await client.get(f"/api/v1/documents/{doc_a_id}/source", headers=auth_headers_b)
    assert source_b.status_code == 404

    # 5. User B attempts to DELETE User A's document: must return 404
    del_b = await client.delete(f"/api/v1/documents/{doc_a_id}", headers=auth_headers_b)
    assert del_b.status_code == 404

    # Verify User A's document is still active and ready
    get_a = await client.get(f"/api/v1/documents/{doc_a_id}", headers=auth_headers_a)
    assert get_a.status_code == 200
    assert get_a.json()["status"] == "ready"

    # 6. User A creates a conversation
    conv_a = await client.post(
        "/api/v1/conversations",
        json={"title": "Alice Chat", "document_ids": [doc_a_id]},
        headers=auth_headers_a,
    )
    assert conv_a.status_code == 200
    conv_a_id = conv_a.json()["id"]

    # User B lists conversations: must NOT see Alice's chat
    convs_b = await client.get("/api/v1/conversations", headers=auth_headers_b)
    assert convs_b.status_code == 200
    assert not any(c["id"] == conv_a_id for c in convs_b.json()["items"])

    # User B attempts to read Alice's messages: must return 404
    msgs_b = await client.get(f"/api/v1/conversations/{conv_a_id}/messages", headers=auth_headers_b)
    assert msgs_b.status_code == 404

    # 7. User B creates their own conversation and tries to scope Alice's document into it
    conv_b_attack = await client.post(
        "/api/v1/conversations",
        json={"title": "Bob Infiltration Chat", "document_ids": [doc_a_id]},
        headers=auth_headers_b,
    )
    assert conv_b_attack.status_code == 200
    # Scoping should strip out Alice's document ID because Bob does not own it
    assert doc_a_id not in conv_b_attack.json()["document_ids"]

    # 8. User B asks about Alice's secret in their own chat: must NOT retrieve Alice's content
    bob_conv_id = conv_b_attack.json()["id"]
    chat_res = await client.post(
        f"/api/v1/conversations/{bob_conv_id}/messages",
        json={
            "request_key": str(uuid.uuid4()),
            "message": "What is the secret code of the project?",
        },
        headers=auth_headers_b,
    )
    assert chat_res.status_code == 200
    stream_text = chat_res.text
    # Verify no leaks of ALICE-TOP-SECRET
    assert "ALICE-TOP-SECRET" not in stream_text
    assert "insufficient evidence" in stream_text.lower()
