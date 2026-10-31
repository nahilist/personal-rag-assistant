import asyncio
import re
from typing import AsyncGenerator, Dict, List
from app.providers.llm.base import LLMProvider


class GroundedMockLLMProvider(LLMProvider):
    """
    Simulates a strictly grounded LLM.
    Inspects evidence provided in the system message.
    If no evidence is present or query is unanswerable, returns an explicit abstention.
    When evidence is present, quotes/synthesizes and attaches [S1], [S2] citations.
    """
    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 800,
        temperature: float = 0.2
    ) -> AsyncGenerator[str, None]:
        full_text = await self.generate(messages, max_tokens, temperature)
        # Yield words in realistic streaming bursts
        words = full_text.split(" ")
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i:i+3]) + " "
            yield chunk
            await asyncio.sleep(0.01)

    async def generate(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 800,
        temperature: float = 0.2
    ) -> str:
        # Check system prompt for excerpts
        sys_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
        user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")

        # Look for [S1], [S2] blocks in system prompt
        sources_found = re.findall(r"\[(S\d+)\].*?:\s*(.*?)(?=\n\[S\d+\]|\Z)", sys_msg, re.DOTALL)

        if not sources_found:
            return "Based on your uploaded documents, there is insufficient evidence to answer this question. Please upload relevant files or refine your search."

        first_label, first_excerpt = sources_found[0]
        first_excerpt_snippet = first_excerpt.strip()[:180].replace("\n", " ")

        # Check if question has meaningful factual overlap with retrieved excerpt
        stop_words = {"what", "is", "the", "in", "of", "for", "to", "a", "an", "are", "how", "many", "do", "kitne", "mein", "hai", "ko", "se", "and", "or", "kya", "me"}
        user_words = {w.lower() for w in re.findall(r"\w+", user_msg) if len(w) > 1} - stop_words
        excerpt_words = {w.lower() for w in re.findall(r"\w+", first_excerpt)}

        if user_words and not (user_words & excerpt_words):
            return "Based on your uploaded documents, there is insufficient evidence to answer this question. Please upload relevant files or refine your search."

        if any(w in user_msg.lower() for w in ["conclusion", "summary", "kya", "what", "explain", "main"]):
            return (
                f"According to your document, {first_excerpt_snippet}... [{first_label}]. "
                f"This directly addresses your query based on the verified source excerpts."
            )

        return (
            f"Based on the provided document excerpts, {first_excerpt_snippet}... [{first_label}]."
        )
