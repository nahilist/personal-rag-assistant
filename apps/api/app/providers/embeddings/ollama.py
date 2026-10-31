from typing import List
import httpx
from app.providers.embeddings.base import EmbeddingProvider
from app.core.config import settings
from app.core.logging import logger


class OllamaEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        self.base_url = settings.EMBEDDING_BASE_URL.rstrip("/")
        self.model = settings.EMBEDDING_MODEL
        self._dimension = settings.EMBEDDING_DIMENSION

    @property
    def dimension(self) -> int:
        return self._dimension

    async def embed_query(self, text: str) -> List[float]:
        res = await self.embed_documents([text])
        return res[0]

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        results: List[List[float]] = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            for text in texts:
                try:
                    resp = await client.post(
                        f"{self.base_url}/api/embeddings",
                        json={"model": self.model, "prompt": text}
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    results.append(data.get("embedding", [0.0] * self._dimension))
                except Exception as e:
                    logger.error(f"Ollama embedding failed: {str(e)}")
                    # Fallback
                    results.append([0.0] * self._dimension)
        return results


class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        self.base_url = settings.EMBEDDING_BASE_URL.rstrip("/")
        self.api_key = settings.EMBEDDING_API_KEY
        self.model = settings.EMBEDDING_MODEL
        self._dimension = settings.EMBEDDING_DIMENSION

    @property
    def dimension(self) -> int:
        return self._dimension

    async def embed_query(self, text: str) -> List[float]:
        res = await self.embed_documents([text])
        return res[0]

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.base_url}/embeddings",
                headers=headers,
                json={"input": texts, "model": self.model}
            )
            resp.raise_for_status()
            data = resp.json()
            return [item["embedding"] for item in data["data"]]

