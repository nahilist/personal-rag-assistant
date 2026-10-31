import hashlib
import math
from typing import List
from app.providers.embeddings.base import EmbeddingProvider
from app.core.config import settings


class DeterministicMockEmbeddingProvider(EmbeddingProvider):
    """
    Produces deterministic, unit-normalized vectors using word hashing.
    Words shared between queries and documents will produce high cosine similarity.
    """
    def __init__(self, dimension: int = 384):
        self._dim = dimension

    @property
    def dimension(self) -> int:
        return self._dim

    def _embed(self, text: str) -> List[float]:
        vec = [0.0] * self._dim
        words = text.lower().split()
        if not words:
            vec[0] = 1.0
            return vec

        for word in words:
            h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            idx = h % self._dim
            vec[idx] += 1.0

        # L2 normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        else:
            vec[0] = 1.0
        return vec

    async def embed_query(self, text: str) -> List[float]:
        return self._embed(text)

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed(t) for t in texts]
