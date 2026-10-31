import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.workers.tasks import run_ingestion_job
from app.repositories.models import IngestionJob, Message, MessageSource


@pytest.mark.asyncio
async def test_complete_vertical_slice(
    client: AsyncClient,
    db_session: AsyncSession,
    auth_headers_a: dict,
):
    # 1. Profile / Usage check
    me_res = await client.get("/api/v1/me", headers=auth_headers_a)
    assert me_res.status_code == 200
    assert me_res.json()["usage"]["document_count"] == 0

    # 2. Upload Reservation
    doc_text = """# Quarterly Financial Report
In Q3 2026, total net profit grew by 42% reaching $18.5M.
The main driver was cloud enterprise adoption in the APAC region.
Operating expenses remained strictly controlled at $4.2M.

# Conclusion
The leadership team projects sustained profit margins through Q4.
"""
    res_upload = await client.post(
        "/api/v1/documents/uploads",
        json={
            "filename": "q3_report.md",
            "byte_size": len(doc_text.encode("utf-8")),
            "mime_type": "text/markdown",
        },
        headers=auth_headers_a,
    )
    assert res_upload.status_code == 200
    doc_id = res_upload.json()["document_id"]

    # 3. Upload Binary
    up_bin = await client.post(
        f"/api/v1/documents/{doc_id}/upload-binary",
        content=doc_text.encode("utf-8"),
        headers=auth_headers_a,
    )
    assert up_bin.status_code == 200

    # 4. Complete Upload
    comp_res = await client.post(
        f"/api/v1/documents/{doc_id}/complete",
        headers=auth_headers_a,
    )
    assert comp_res.status_code == 202

    # 5. Verify Ingestion Job completed or run it
    job_stmt = select(IngestionJob).where(IngestionJob.document_id == uuid.UUID(doc_id))
    job = (await db_session.execute(job_stmt)).scalar_one()
    if job.stage != "completed":
        success = await run_ingestion_job(db_session, job.id)
        assert success is True
    await db_session.refresh(job)
    assert job.stage == "completed"

    # 6. Verify Document Status is Ready
    doc_info = await client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers_a)
    assert doc_info.status_code == 200
    assert doc_info.json()["status"] == "ready"

    # 7. Create Conversation
    conv_res = await client.post(
        "/api/v1/conversations",
        json={"title": "Financial Inquiries", "document_ids": [doc_id]},
        headers=auth_headers_a,
    )
    assert conv_res.status_code == 200
    conv_id = conv_res.json()["id"]

    # 8. Send Chat Message & Receive Stream
    req_key = str(uuid.uuid4())
    chat_stream = await client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={
            "request_key": req_key,
            "message": "What is the main conclusion of the Q3 report?",
            "document_ids": [doc_id],
        },
        headers=auth_headers_a,
    )
    assert chat_stream.status_code == 200
    body = chat_stream.text

    assert "event: request" in body
    assert "event: delta" in body
    assert "event: sources" in body
    assert "event: done" in body
    assert "S1" in body

    # 9. Verify Persisted Message and MessageSource
    msgs_res = await client.get(f"/api/v1/conversations/{conv_id}/messages", headers=auth_headers_a)
    assert msgs_res.status_code == 200
    messages = msgs_res.json()["items"]
    assert len(messages) >= 2  # user and assistant
    asst_msg = next(m for m in messages if m["role"] == "assistant")
    assert asst_msg["sources"] is not None
    assert len(asst_msg["sources"]) > 0
    assert asst_msg["sources"][0]["label"] == "S1"

    # 10. Source Excerpt Verification
    source_res = await client.get(f"/api/v1/documents/{doc_id}/source", headers=auth_headers_a)
    assert source_res.status_code == 200
    assert "net profit" in source_res.json()["content"]

    # 11. Delete Document and Immediate Revocation Check
    del_res = await client.delete(f"/api/v1/documents/{doc_id}", headers=auth_headers_a)
    assert del_res.status_code == 202

    # Querying the document now should return 404
    post_del = await client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers_a)
    assert post_del.status_code == 404
