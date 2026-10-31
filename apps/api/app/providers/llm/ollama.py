import json
from typing import AsyncGenerator, Dict, List
import httpx
from app.providers.llm.base import LLMProvider
from app.core.config import settings
from app.core.logging import logger


class OllamaLLMProvider(LLMProvider):
    def __init__(self):
        self.base_url = settings.LLM_BASE_URL.rstrip("/")
        self.model = settings.LLM_MODEL

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 800,
        temperature: float = 0.2
    ) -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": True,
                    "options": {"temperature": temperature, "num_predict": max_tokens}
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        msg = data.get("message", {})
                        content = msg.get("content", "")
                        if content:
                            yield content
                    except Exception:
                        continue

    async def generate(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 800,
        temperature: float = 0.2
    ) -> str:
        chunks = []
        async for chunk in self.generate_stream(messages, max_tokens, temperature):
            chunks.append(chunk)
        return "".join(chunks)


class OpenAILLMProvider(LLMProvider):
    def __init__(self):
        self.base_url = settings.LLM_BASE_URL.rstrip("/")
        self.api_key = settings.LLM_API_KEY
        self.model = settings.LLM_MODEL

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 800,
        temperature: float = 0.2
    ) -> AsyncGenerator[str, None]:
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers=headers,
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": True,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta
                    except Exception:
                        continue

    async def generate(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 800,
        temperature: float = 0.2
    ) -> str:
        chunks = []
        async for chunk in self.generate_stream(messages, max_tokens, temperature):
            chunks.append(chunk)
        return "".join(chunks)

