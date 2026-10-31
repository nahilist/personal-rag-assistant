import hashlib
import re
from typing import List, Optional
from pydantic import BaseModel
from app.extraction.extractor import ExtractedPage

try:
    import tiktoken
    _enc = tiktoken.get_encoding("cl100k_base")
    def count_tokens(text: str) -> int:
        return len(_enc.encode(text))
except Exception:
    def count_tokens(text: str) -> int:
        # Approximate: ~4 chars per token
        return max(1, len(text) // 4)


class ChunkItem(BaseModel):
    chunk_index: int
    content: str
    page_start: int
    page_end: int
    section: Optional[str] = None
    token_count: int
    content_hash: str


class DocumentChunker:
    TARGET_CHUNK_TOKENS = 600
    OVERLAP_TOKENS = 100

    @classmethod
    def chunk_pages(cls, pages: List[ExtractedPage]) -> List[ChunkItem]:
        chunks: List[ChunkItem] = []
        chunk_idx = 0

        current_text_segments: List[str] = []
        current_token_count = 0
        current_page_start = pages[0].page_number if pages else 1
        current_page_end = current_page_start
        current_section = pages[0].section if pages else None

        for page in pages:
            # Split page into sentences or paragraphs
            paragraphs = [p.strip() for p in re.split(r"\n\n+", page.text) if p.strip()]
            if not paragraphs:
                paragraphs = [page.text.strip()] if page.text.strip() else []

            for para in paragraphs:
                para_tokens = count_tokens(para)

                if current_token_count + para_tokens > cls.TARGET_CHUNK_TOKENS and current_text_segments:
                    # Flush chunk
                    content = "\n\n".join(current_text_segments).strip()
                    c_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
                    chunks.append(
                        ChunkItem(
                            chunk_index=chunk_idx,
                            content=content,
                            page_start=current_page_start,
                            page_end=current_page_end,
                            section=current_section,
                            token_count=current_token_count,
                            content_hash=c_hash,
                        )
                    )
                    chunk_idx += 1

                    # Keep last paragraph for overlap if it fits
                    if para_tokens < cls.OVERLAP_TOKENS:
                        current_text_segments = [para]
                        current_token_count = para_tokens
                    else:
                        current_text_segments = []
                        current_token_count = 0

                    current_page_start = page.page_number
                    current_section = page.section or current_section

                current_text_segments.append(para)
                current_token_count += para_tokens
                current_page_end = page.page_number
                if page.section:
                    current_section = page.section

        if current_text_segments:
            content = "\n\n".join(current_text_segments).strip()
            c_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
            chunks.append(
                ChunkItem(
                    chunk_index=chunk_idx,
                    content=content,
                    page_start=current_page_start,
                    page_end=current_page_end,
                    section=current_section,
                    token_count=current_token_count,
                    content_hash=c_hash,
                )
            )

        return chunks
