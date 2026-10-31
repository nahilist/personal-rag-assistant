from app.core.config import settings
from app.providers.llm.base import LLMProvider
from app.providers.llm.mock import GroundedMockLLMProvider
from app.providers.llm.ollama import OllamaLLMProvider, OpenAILLMProvider

_llm_provider: LLMProvider | None = None


def get_llm_provider() -> LLMProvider:
    global _llm_provider
    if _llm_provider is None:
        p_type = settings.LLM_PROVIDER.lower()
        if p_type == "ollama":
            _llm_provider = OllamaLLMProvider()
        elif p_type == "openai":
            _llm_provider = OpenAILLMProvider()
        else:
            _llm_provider = GroundedMockLLMProvider()
    return _llm_provider
