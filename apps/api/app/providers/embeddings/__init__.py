from app.core.config import settings
from app.providers.embeddings.base import EmbeddingProvider
from app.providers.embeddings.mock import DeterministicMockEmbeddingProvider
from app.providers.embeddings.ollama import OllamaEmbeddingProvider, OpenAIEmbeddingProvider

_provider: EmbeddingProvider | None = None


def get_embedding_provider() -> EmbeddingProvider:
    global _provider
    if _provider is None:
        p_type = settings.EMBEDDING_PROVIDER.lower()
        if p_type == "ollama":
            _provider = OllamaEmbeddingProvider()
        elif p_type == "openai":
            _provider = OpenAIEmbeddingProvider()
        else:
            _provider = DeterministicMockEmbeddingProvider(dimension=settings.EMBEDDING_DIMENSION)
    return _provider

