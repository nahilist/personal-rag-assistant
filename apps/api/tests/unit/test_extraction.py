import io
import pytest
from app.extraction.extractor import DocumentExtractor, ExtractionError
from app.extraction.chunker import DocumentChunker


def test_markdown_extraction_and_chunking():
    md_content = """# Introduction
This is a comprehensive guide to personal RAG systems.
Users can upload their documents safely.

# System Architecture
The backend uses FastAPI and PostgreSQL.
Storage is isolated per user.

# Conclusion
The system ensures that privacy and citations are strictly verified.
"""
    pages = DocumentExtractor.extract_text(md_content.encode("utf-8"), is_markdown=True)
    assert len(pages) >= 2
    assert any("Architecture" in (p.section or "") for p in pages)

    chunks = DocumentChunker.chunk_pages(pages)
    assert len(chunks) >= 1
    assert all(c.content_hash for c in chunks)
    assert all(c.token_count > 0 for c in chunks)


def test_plain_text_extraction():
    raw_text = "This is a plain text file containing project documentation.\nLine 2.\nLine 3."
    pages = DocumentExtractor.extract("text/plain", raw_text.encode("utf-8"))
    assert len(pages) == 1
    assert "plain text" in pages[0].text


def test_scanned_pdf_detection():
    # Build a minimal empty PDF without text
    from pypdf import PdfWriter
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    pdf_bytes = io.BytesIO()
    writer.write(pdf_bytes)

    with pytest.raises(ExtractionError) as exc_info:
        DocumentExtractor.extract("application/pdf", pdf_bytes.getvalue())

    assert exc_info.value.code == "ocr_required"

