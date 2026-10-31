import io
import re
from typing import List, Optional
from pydantic import BaseModel
from pypdf import PdfReader
from docx import Document as DocxDocument
from app.core.config import settings


class ExtractedPage(BaseModel):
    page_number: int
    text: str
    section: Optional[str] = None


class ExtractionError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


class DocumentExtractor:
    MAX_PAGES = 200
    MAX_TEXT_BYTES = 5 * 1024 * 1024  # 5 MB

    @classmethod
    def extract_pdf(cls, data: bytes) -> List[ExtractedPage]:
        try:
            reader = PdfReader(io.BytesIO(data))
        except Exception as e:
            raise ExtractionError("file_corrupted", f"Failed to parse PDF file: {str(e)}")

        if reader.is_encrypted:
            raise ExtractionError("encrypted_file", "Encrypted or password-protected PDFs are not supported.")

        num_pages = len(reader.pages)
        if num_pages > cls.MAX_PAGES:
            raise ExtractionError(
                "page_limit_exceeded",
                f"PDF has {num_pages} pages, which exceeds the limit of {cls.MAX_PAGES} pages."
            )

        pages: List[ExtractedPage] = []
        total_text_len = 0

        for i, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text() or ""
            except Exception:
                page_text = ""

            cleaned = re.sub(r"\s+", " ", page_text).strip()
            total_text_len += len(cleaned)
            pages.append(ExtractedPage(page_number=i + 1, text=cleaned))

        # Check for scanned / non-extractable PDF
        if total_text_len < 50:
            raise ExtractionError(
                "ocr_required",
                "Scanned or image-only PDF detected. Extractable text is insufficient and requires OCR."
            )

        return pages

    @classmethod
    def extract_docx(cls, data: bytes) -> List[ExtractedPage]:
        try:
            doc = DocxDocument(io.BytesIO(data))
        except Exception as e:
            raise ExtractionError("file_corrupted", f"Failed to parse DOCX file: {str(e)}")

        pages: List[ExtractedPage] = []
        current_section = "Introduction"
        current_paras: List[str] = []
        total_len = 0
        virtual_page = 1

        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue

            if para.style.name.startswith("Heading"):
                if current_paras:
                    section_text = " ".join(current_paras)
                    pages.append(ExtractedPage(page_number=virtual_page, text=section_text, section=current_section))
                    virtual_page += 1
                    current_paras = []
                current_section = text
            else:
                current_paras.append(text)
                total_len += len(text)
                if total_len > cls.MAX_TEXT_BYTES:
                    raise ExtractionError("text_limit_exceeded", "DOCX extracted text exceeds 5MB limit.")

        if current_paras:
            pages.append(ExtractedPage(page_number=virtual_page, text=" ".join(current_paras), section=current_section))

        if not pages or sum(len(p.text) for p in pages) < 10:
            raise ExtractionError("empty_document", "No readable text content found in DOCX file.")

        return pages

    @classmethod
    def extract_text(cls, data: bytes, is_markdown: bool = False) -> List[ExtractedPage]:
        try:
            content = data.decode("utf-8")
        except UnicodeDecodeError:
            try:
                content = data.decode("latin-1")
            except Exception:
                raise ExtractionError("unsupported_encoding", "Could not decode text file.")

        if len(content.encode("utf-8")) > cls.MAX_TEXT_BYTES:
            raise ExtractionError("text_limit_exceeded", "Text content exceeds 5MB limit.")

        # Split markdown by top level headings or split text by reasonable chunks
        lines = content.splitlines()
        pages: List[ExtractedPage] = []
        current_section = "Document"
        current_lines: List[str] = []
        virtual_page = 1

        for line in lines:
            line_str = line.strip()
            if is_markdown and line_str.startswith("#"):
                if current_lines:
                    text_block = "\n".join(current_lines).strip()
                    if text_block:
                        pages.append(ExtractedPage(page_number=virtual_page, text=text_block, section=current_section))
                        virtual_page += 1
                    current_lines = []
                current_section = line_str.lstrip("#").strip()
            else:
                current_lines.append(line)

            # Virtual page split around every 50 lines if no headings
            if len(current_lines) >= 80:
                text_block = "\n".join(current_lines).strip()
                if text_block:
                    pages.append(ExtractedPage(page_number=virtual_page, text=text_block, section=current_section))
                    virtual_page += 1
                current_lines = []

        if current_lines:
            text_block = "\n".join(current_lines).strip()
            if text_block:
                pages.append(ExtractedPage(page_number=virtual_page, text=text_block, section=current_section))

        if not pages:
            raise ExtractionError("empty_document", "Document is empty.")

        return pages

    @classmethod
    def extract(cls, mime_type: str, data: bytes) -> List[ExtractedPage]:
        if "pdf" in mime_type:
            return cls.extract_pdf(data)
        elif "wordprocessingml" in mime_type or "docx" in mime_type:
            return cls.extract_docx(data)
        elif "markdown" in mime_type or "md" in mime_type:
            return cls.extract_text(data, is_markdown=True)
        elif "text" in mime_type:
            return cls.extract_text(data, is_markdown=False)
        else:
            raise ExtractionError("unsupported_format", f"Unsupported file type: {mime_type}")

