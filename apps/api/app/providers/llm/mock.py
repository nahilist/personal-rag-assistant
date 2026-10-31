import asyncio
import re
from typing import AsyncGenerator, Dict, List
from app.providers.llm.base import LLMProvider


class GroundedMockLLMProvider(LLMProvider):
    """
    Simulates a strictly grounded, highly readable LLM assistant.
    Inspects evidence provided in the system message.
    If no evidence is present or query is unanswerable, returns an explicit abstention.
    When evidence is present, produces a well-structured, easy-to-understand explanation
    with clear markdown formatting and verifiable [S1], [S2] citations.
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
            chunk = " ".join(words[i:i+3]) + (" " if i + 3 < len(words) else "")
            yield chunk
            await asyncio.sleep(0.015)

    async def generate(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 800,
        temperature: float = 0.2
    ) -> str:
        sys_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
        user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        user_clean = user_msg.strip()
        user_lower = user_clean.lower()

        # 1. Conversational greetings
        cleaned_user = re.sub(r"[^\w\s]", "", user_lower).strip()
        if cleaned_user in ["hi", "hello", "hey", "hii", "hi there", "namaste", "greetings", "kaise ho", "help"]:
            return (
                "👋 **Hello!** I am your **Personal RAG Assistant**.\n\n"
                "You can ask me questions about your uploaded documents, and I will provide "
                "clear, grounded answers with **verifiable source citations** (like `[S1]`).\n\n"
                "Feel free to ask questions in **English**, **Hindi**, or **Hinglish**!"
            )

        # 2. Extract sources specifically from Authorized Document Excerpts section
        excerpts_section = (
            sys_msg.split("Authorized Document Excerpts:")[-1]
            if "Authorized Document Excerpts:" in sys_msg
            else sys_msg
        )
        sources_found = re.findall(
            r"\[(S\d+)\][^\n:]*:\s*(.*?)(?=\n\[S\d+\]|\Z)",
            excerpts_section,
            re.DOTALL
        )

        if not sources_found:
            return (
                "Based on your uploaded documents, there is **insufficient evidence** to answer this question. "
                "Please upload relevant files or refine your search."
            )

        # 3. Detect language
        is_hinglish = (
            "language: hinglish" in sys_msg.lower()
            or any(w in user_lower.split() for w in [
                "kya", "hai", "kitne", "kitna", "milti", "hota", "batao",
                "samjhao", "kaise", "hua", "tha", "me", "mein", "dino"
            ])
        )
        is_hindi = (
            not is_hinglish and (
                "language: hindi" in sys_msg.lower()
                or "language: hi" in sys_msg.lower()
                or bool(re.search(r"[\u0900-\u097F]", user_msg))
            )
        )

        # 4. Check keyword overlap / relevance
        stop_words = {
            "what", "is", "the", "in", "of", "for", "to", "a", "an", "are", "how", "many", "do",
            "does", "did", "and", "or", "on", "at", "by", "from", "with", "about", "tell", "me",
            "kya", "hai", "kitna", "kitne", "hota", "hote", "hain", "ko", "se", "mein", "me", "ka",
            "ki", "ke", "batao", "samjhao", "explain", "describe", "define", "give", "show", "din",
            "dino"
        }
        user_words = {w.lower() for w in re.findall(r"\w+", user_msg) if len(w) > 1} - stop_words

        best_source_idx = 0
        best_overlap_count = -1
        all_excerpt_words = set()

        for idx, (lbl, raw_exc) in enumerate(sources_found):
            cleaned_exc = re.sub(r"(?i)IMPORTANT SYSTEM OVERRIDE.*?(\n|\Z)", "", raw_exc)
            words = {w.lower() for w in re.findall(r"\w+", cleaned_exc)}
            all_excerpt_words.update(words)
            overlap = len(user_words & words)
            if overlap > best_overlap_count:
                best_overlap_count = overlap
                best_source_idx = idx

        # Abstain if question has zero factual overlap
        if user_words and not (user_words & all_excerpt_words):
            return (
                "Based on your uploaded documents, there is **insufficient evidence** to answer this question. "
                "The documents do not contain the requested details. Please upload relevant files or refine your search."
            )

        target_label, target_raw_excerpt = sources_found[best_source_idx]
        target_excerpt = re.sub(r"(?i)IMPORTANT SYSTEM OVERRIDE.*?(\n|\Z)", "", target_raw_excerpt).strip()

        # Split excerpt into individual sentences (handling '.', '!', '?', newline, and Hindi danda '।')
        raw_sentences = [
            s.strip()
            for s in re.split(r"(?<=[.!?\n\u0964])\s+", target_excerpt)
            if len(s.strip()) > 8
        ]
        if not raw_sentences:
            raw_sentences = [target_excerpt[:200]]

        def score_sentence(sent: str) -> int:
            s_words = {w.lower() for w in re.findall(r"\w+", sent)}
            return len(user_words & s_words)

        ranked_sentences = sorted(raw_sentences, key=score_sentence, reverse=True)
        primary_sentence = ranked_sentences[0] if ranked_sentences else raw_sentences[0]
        # Clean any markdown headers from primary sentence if present
        primary_sentence = re.sub(r"^#+\s*", "", primary_sentence).strip()

        supporting_sentences = [
            re.sub(r"^#+\s*", "", s).strip()
            for s in raw_sentences
            if s != primary_sentence and len(s.strip()) > 10
        ][:4]

        # Topic detection for heading (supporting both 'what is X' and 'X kya hai / kya hota hai')
        topic_match = re.search(
            r"(?:what is|what are|explain|define|tell me about)\s+([a-zA-Z0-9_\s\u0900-\u097F]+)",
            user_msg,
            re.IGNORECASE
        )
        if not topic_match:
            topic_match = re.search(
                r"([a-zA-Z0-9_\s\u0900-\u097F]+?)\s+(?:kya hai|kya hota hai|ke bare mein|batao|samjhao)",
                user_msg,
                re.IGNORECASE
            )

        raw_topic = topic_match.group(1).strip() if topic_match else user_msg
        clean_topic = re.sub(
            r"\b(samjhao|batao|karo|please|hai|kya|hota|what|is|are|the)\b",
            "",
            raw_topic,
            flags=re.IGNORECASE
        ).strip()
        clean_topic = re.sub(r"[?!.,]+$", "", clean_topic).strip()

        heading = clean_topic.title() if (clean_topic and len(clean_topic) <= 35) else "Key Details"

        # Format clean, human-friendly output
        if is_hindi:
            lines = [
                f"### {heading} (दस्तावेज़ सारांश)",
                f"आपके दस्तावेज़ के अनुसार, **{primary_sentence}** [{target_label}]।",
            ]
            if supporting_sentences:
                lines.append("\n#### मुख्य बिंदु (Key Highlights):")
                for s in supporting_sentences:
                    lines.append(f"- {s} [{target_label}]")
            return "\n".join(lines)

        elif is_hinglish:
            lines = [
                f"### {heading} Overview",
                f"Aapke uploaded document ke mutabik, **{primary_sentence}** [{target_label}].",
            ]
            if supporting_sentences:
                lines.append("\n#### Mukhya Points (Key Highlights):")
                for s in supporting_sentences:
                    lines.append(f"- {s} [{target_label}]")
            return "\n".join(lines)

        else:
            # English
            lines = [
                f"### {heading} Overview",
                f"Based on your document, **{primary_sentence}** [{target_label}].",
            ]
            if supporting_sentences:
                lines.append("\n#### Key Highlights & Rules:")
                for s in supporting_sentences:
                    clean_s = s.rstrip(".")
                    lines.append(f"- {clean_s} [{target_label}].")
            return "\n".join(lines)
