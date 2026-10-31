import requests
import json
import uuid
import sys

sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8000/api/v1"

# Mimic the web client request() method logic
def client_request(endpoint, method="GET", body=None, token=None, is_binary=False):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    if is_binary:
        headers["Content-Type"] = "application/octet-stream"
    elif body is not None and not isinstance(body, (bytes, bytearray)):
        headers["Content-Type"] = "application/json"

    # Exact logic added to client.ts:
    if endpoint.startswith("http://") or endpoint.startswith("https://"):
        url = endpoint
    elif endpoint.startswith("/api/v1"):
        base_origin = BASE_URL.replace("/api/v1", "")
        url = f"{base_origin}{endpoint}"
    else:
        prefix = BASE_URL[:-1] if BASE_URL.endswith("/") else BASE_URL
        path = endpoint if endpoint.startswith("/") else f"/{endpoint}"
        url = f"{prefix}{path}"

    payload = json.dumps(body) if (body is not None and not is_binary) else body
    res = requests.request(method, url, data=payload, headers=headers)
    if not res.ok:
        raise Exception(f"HTTP {res.status_code}: {res.text}")
    return res.json()

print("--- Testing Browser Client Upload & Chat with URL Normalization ---")

# 1. Login as Bob
token_res = client_request("/auth/token", method="POST", body={
    "user_id": "22222222-2222-2222-2222-222222222222",
    "email": "bob@example.com",
    "display_name": "Bob"
})
token = token_res["access_token"]
print("[OK] 1. Bob logged in, access token obtained.")

# 2. Reserve upload for PDF with extractable text
pdf_str = """%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 120 >>
stream
BT
/F1 12 Tf
100 700 Td
(Frontend Architecture Overview: The UI uses Next.js App Router with TypeScript.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000236 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
480
%%EOF"""

pdf_content = pdf_str.encode("latin1")

reservation = client_request("/documents/uploads", method="POST", body={
    "filename": "frontend_architecture.pdf",
    "byte_size": len(pdf_content),
    "mime_type": "application/pdf"
}, token=token)

doc_id = reservation["document_id"]
upload_url = reservation["upload_url"]
print(f"[OK] 2. Reserved upload. doc_id={doc_id}, upload_url={upload_url}")

# 3. Upload binary using reservation.upload_url
up_res = client_request(upload_url, method="POST", body=pdf_content, token=token, is_binary=True)
print(f"[OK] 3. Binary payload uploaded: {up_res}")

# 4. Complete upload
comp_res = client_request(f"/documents/{doc_id}/complete", method="POST", token=token)
print(f"[OK] 4. Ingestion complete triggered: {comp_res}")

# 5. Check document status
doc_info = client_request(f"/documents/{doc_id}", method="GET", token=token)
print(f"[OK] 5. Document status in repository: {doc_info['status']}")
assert doc_info["status"] == "ready", f"Expected ready, got {doc_info['status']}"

# 6. Test conversational greeting
conv = client_request("/conversations", method="POST", body={
    "title": "Frontend Chat",
    "document_ids": [doc_id]
}, token=token)
conv_id = conv["id"]

# Send 'hii'
greet_resp = requests.post(
    f"{BASE_URL}/conversations/{conv_id}/messages",
    json={"message": "hii", "request_key": str(uuid.uuid4())},
    headers={"Authorization": f"Bearer {token}"},
    stream=True
)
deltas = []
for line in greet_resp.iter_lines():
    s = line.decode("utf-8")
    if s.startswith("data: "):
        ev = json.loads(s[6:])
        if "text" in ev:
            deltas.append(ev["text"])
print(f"[OK] 6. Sent 'hii', Assistant response: '{''.join(deltas)}'")

# Send question about the uploaded PDF: 'frontend system'
ask_resp = requests.post(
    f"{BASE_URL}/conversations/{conv_id}/messages",
    json={"message": "What is the frontend architecture?", "request_key": str(uuid.uuid4())},
    headers={"Authorization": f"Bearer {token}"},
    stream=True
)
ans_deltas = []
sources = []
for line in ask_resp.iter_lines():
    s = line.decode("utf-8")
    if s.startswith("data: "):
        ev = json.loads(s[6:])
        if "text" in ev:
            ans_deltas.append(ev["text"])
        elif "sources" in ev:
            sources = ev["sources"]

full_ans = "".join(ans_deltas)
print(f"[OK] 7. Sent 'What is the frontend architecture?', Assistant response:\n    {full_ans}")
print(f"    Grounded sources: {len(sources)} sources cited: {[s['label'] for s in sources]}")
assert len(sources) > 0, "Expected at least 1 grounded citation"

print("\n>>> ALL TESTS PASSED! PDF UPLOAD AND CONVERSATION FULLY RESOLVED! <<<")
