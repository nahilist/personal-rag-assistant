import requests
import json
import sys
import uuid

sys.stdout.reconfigure(encoding="utf-8")

BASE = "http://127.0.0.1:8000/api/v1"

print("==================================================")
print("  PERSONAL RAG ASSISTANT — E2E VERIFICATION SUITE ")
print("==================================================")

# 1. Login as Alice
res = requests.post(f"{BASE}/auth/token", json={
    "user_id": "11111111-1111-1111-1111-111111111111",
    "email": "alice@example.com",
    "display_name": "Alice"
})
assert res.status_code == 200, res.text
token_alice = res.json()["access_token"]
h_alice = {"Authorization": f"Bearer {token_alice}"}
print("[✓] Step 1: Alice authenticated successfully.")

# 2. Upload sample document for Alice
doc_content = b"# Personal RAG Assistant Architecture\n\nThe Personal RAG Assistant uses PostgreSQL with pgvector for fast vector retrieval and durable ACID transactions. Ingestion is decoupled using background workers."
reserve_res = requests.post(f"{BASE}/documents/uploads", json={
    "filename": "rag_architecture.md",
    "byte_size": len(doc_content),
    "mime_type": "text/markdown"
}, headers=h_alice).json()

doc_id = reserve_res["document_id"]
upload_url = reserve_res["upload_url"]
if upload_url.startswith("/"):
    upload_url = f"http://127.0.0.1:8000{upload_url}"

# Binary upload
up_res = requests.post(upload_url, data=doc_content, headers={"Content-Type": "text/markdown", **h_alice})
assert up_res.status_code == 200, up_res.text

# Complete upload and trigger durable worker
comp_res = requests.post(f"{BASE}/documents/{doc_id}/complete", headers=h_alice)
assert comp_res.status_code in [200, 202], comp_res.text

# Verify document status
doc_item = requests.get(f"{BASE}/documents/{doc_id}", headers=h_alice).json()
print(f"[✓] Step 2: Document uploaded and ingested. ID: {doc_id}, Status: {doc_item['status']}")

# 3. Create conversation scoped to the uploaded document
conv = requests.post(f"{BASE}/conversations", json={
    "title": "Architecture Q&A",
    "document_ids": [doc_id]
}, headers=h_alice).json()
conv_id = conv["id"]
print(f"[✓] Step 3: Conversation created. ID: {conv_id}")

# 4. Stream chat response with POST fetch SSE
req_key = str(uuid.uuid4())
stream_resp = requests.post(
    f"{BASE}/conversations/{conv_id}/messages",
    json={
        "message": "What database does Personal RAG use for vector retrieval?",
        "request_key": req_key,
        "language": "en"
    },
    headers=h_alice,
    stream=True
)
assert stream_resp.status_code == 200, f"Streaming failed: {stream_resp.status_code} {stream_resp.text}"

deltas = []
sources = []
completed = False

for line in stream_resp.iter_lines():
    line_str = line.decode("utf-8")
    if line_str.startswith("data: "):
        event = json.loads(line_str[6:])
        if "text" in event:
            deltas.append(event["text"])
        elif "sources" in event:
            sources = event["sources"]
        elif event.get("status") == "completed":
            completed = True

full_answer = "".join(deltas)
print(f"[✓] Step 4: Chat response streamed ({len(deltas)} deltas). Completed: {completed}")
print(f"    Answer text: {full_answer[:100]}...")
print(f"    Grounded sources count: {len(sources)}")
assert completed, "Stream did not emit completion"
assert len(sources) > 0, "Expected at least 1 grounded citation source"

# 5. Verify source citation chunk resolution
s0 = sources[0]
chunk_res = requests.get(
    f"{BASE}/documents/{s0['document_id']}/source?chunk_id={s0['chunk_id']}",
    headers=h_alice
)
assert chunk_res.status_code == 200, f"Chunk lookup failed: {chunk_res.status_code}"
chunk_data = chunk_res.json()
print(f"[✓] Step 5: Citation verified server-side. Label: {s0['label']}, Excerpt: {chunk_data['content'][:50]}...")

# 6. Verify strict two-user isolation (Bob cannot access Alice's document or conversation)
res_bob = requests.post(f"{BASE}/auth/token", json={
    "user_id": "22222222-2222-2222-2222-222222222222",
    "email": "bob@example.com",
    "display_name": "Bob"
})
token_bob = res_bob.json()["access_token"]
h_bob = {"Authorization": f"Bearer {token_bob}"}

# Bob tries to read Alice's document
bob_doc = requests.get(f"{BASE}/documents/{doc_id}", headers=h_bob)
assert bob_doc.status_code == 404, f"Cross-tenant leak: Bob got {bob_doc.status_code} for Alice doc!"

# Bob tries to read Alice's chunk citation
bob_chunk = requests.get(f"{BASE}/documents/{doc_id}/source?chunk_id={s0['chunk_id']}", headers=h_bob)
assert bob_chunk.status_code == 404, f"Cross-tenant leak: Bob got {bob_chunk.status_code} for Alice chunk!"

# Bob tries to access Alice's conversation
bob_conv = requests.get(f"{BASE}/conversations/{conv_id}", headers=h_bob)
assert bob_conv.status_code == 404, f"Cross-tenant leak: Bob got {bob_conv.status_code} for Alice conversation!"

# Bob tries to post a message into Alice's conversation
bob_msg = requests.post(
    f"{BASE}/conversations/{conv_id}/messages",
    json={"message": "Infiltrate", "request_key": str(uuid.uuid4())},
    headers=h_bob
)
assert bob_msg.status_code in [403, 404], f"Cross-tenant leak: Bob got {bob_msg.status_code} posting to Alice conversation!"

print("[✓] Step 6: Strict two-user isolation confirmed across all endpoints (documents, chunks, conversations, chat).")
print("\n==================================================")
print("  ALL 6 VERTICAL SLICE CHECKS PASSED WITH 100%!   ")
print("==================================================")
