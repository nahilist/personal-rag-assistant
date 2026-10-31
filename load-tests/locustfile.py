import uuid
from locust import HttpUser, task, between


class RAGAssistantUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        self.user_id = str(uuid.uuid4())
        # Generate mock test token
        payload_b64 = "eyJzdWIiOiAi" + self.user_id + "\", \"aud\": \"authenticated\"}"
        self.token = f"test-token-{self.user_id}"
        self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def get_profile_and_usage(self):
        self.client.get("/api/v1/me", headers=self.headers)

    @task(4)
    def list_documents(self):
        self.client.get("/api/v1/documents", headers=self.headers)

    @task(2)
    def reserve_upload(self):
        self.client.post(
            "/api/v1/documents/uploads",
            json={
                "filename": "load_test_doc.md",
                "byte_size": 2048,
                "mime_type": "text/markdown",
            },
            headers=self.headers,
        )

    @task(3)
    def list_conversations(self):
        self.client.get("/api/v1/conversations", headers=self.headers)

    @task(1)
    def send_chat_message(self):
        conv_res = self.client.post(
            "/api/v1/conversations",
            json={"title": "Load Test Chat"},
            headers=self.headers,
        )
        if conv_res.status_code == 200:
            conv_id = conv_res.json().get("id")
            if conv_id:
                self.client.post(
                    f"/api/v1/conversations/{conv_id}/messages",
                    json={
                        "request_key": str(uuid.uuid4()),
                        "message": "What are the key conclusions in this report?",
                    },
                    headers=self.headers,
                )

