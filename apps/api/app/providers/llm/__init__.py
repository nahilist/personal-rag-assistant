from app.core.config import settings
from app.providers.llm.base import LLMProvider
from app.providers.llm.mock import GroundedMockLLMProvider
from app.providers.llm.ollama import OllamaLLMProvider, OpenAILLMProvider


def get_llm_provider() -> LLMProvider:
    p_type = settings.LLM_PROVIDER.lower()
    if p_type == "ollama":
        return OllamaLLMProvider()
    elif p_type == "openai":
        return OpenAILLMProvider()
    return GroundedMockLLMProvider()
