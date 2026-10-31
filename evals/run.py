import asyncio
import json
import uuid
import sys
from pathlib import Path

# Configure UTF-8 for console output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "api"))

from app.extraction.extractor import DocumentExtractor
from app.extraction.chunker import DocumentChunker
from app.providers.embeddings import get_embedding_provider
from app.services.retrieval.retriever import cosine_similarity
from app.providers.llm import get_llm_provider
from app.services.retrieval.prompts import build_system_message


async def run_evaluation():
    dataset_path = Path(__file__).parent / "datasets" / "eval_questions.json"
    with open(dataset_path, "r", encoding="utf-8") as f:
        questions = json.load(f)

    print(f"\n==================================================")
    print(f"Personal RAG Assistant - Evaluation Harness")
    print(f"Total Test Questions: {len(questions)}")
    print(f"==================================================\n")

    embedder = get_embedding_provider()
    llm = get_llm_provider()

    # Pre-index documents in memory for evaluation
    docs_chunks = {}
    for item in questions:
        doc_name = item["document"]
        if doc_name not in docs_chunks:
            pages = DocumentExtractor.extract_text(item["document_content"].encode("utf-8"), is_markdown=True)
            chunks = DocumentChunker.chunk_pages(pages)
            embeddings = await embedder.embed_documents([c.content for c in chunks])
            docs_chunks[doc_name] = list(zip(chunks, embeddings))

    retrieval_hits = 0
    answerable_count = 0
    abstention_hits = 0
    unanswerable_count = 0
    citation_valid_count = 0

    for idx, q in enumerate(questions, 1):
        q_text = q["question"]
        doc_name = q["document"]
        is_answerable = q["answerable"]
        lang = q.get("language", "en")

        # 1. Retrieval
        q_vec = await embedder.embed_query(q_text)
        candidates = []
        for ch, emb in docs_chunks[doc_name]:
            sim = cosine_similarity(q_vec, emb)
            if sim >= 0.05:
                candidates.append((sim, ch))

        candidates.sort(key=lambda x: x[0], reverse=True)
        top_k = candidates[:5]

        # 2. Check recall for answerable questions
        if is_answerable:
            answerable_count += 1
            has_keywords = False
            for _, ch in top_k:
                if any(k.lower() in ch.content.lower() for k in q["expected_answer_keywords"]):
                    has_keywords = True
                    break
            if has_keywords:
                retrieval_hits += 1

        # 3. Model Generation
        mapped_sources = [
            {
                "label": f"S{i+1}",
                "document_title": doc_name,
                "excerpt": ch.content,
                "page_start": ch.page_start,
                "section": ch.section,
            }
            for i, (_, ch) in enumerate(top_k)
        ]

        sys_prompt = build_system_message(mapped_sources, language=lang)
        answer = await llm.generate([
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": q_text}
        ])

        # 4. Check Abstention for unanswerable questions
        if not is_answerable:
            unanswerable_count += 1
            if any(k in answer.lower() for k in ["insufficient", "not found", "cannot", "does not contain", "missing"]):
                abstention_hits += 1

        # 5. Check Technical Citation Validity
        import re
        citations = re.findall(r"\[(S\d+)\]", answer)
        valid_labels = {s["label"] for s in mapped_sources}
        if all(c in valid_labels for c in citations):
            citation_valid_count += 1

        status_flag = "PASS" if (is_answerable and has_keywords) or (not is_answerable and abstention_hits) else "INFO"
        print(f"[{status_flag}] Q{idx:02d} ({q['category']}): {q_text[:40]}... -> Answer: {answer[:60]}...")

    recall = (retrieval_hits / answerable_count * 100) if answerable_count > 0 else 100.0
    abstention_rate = (abstention_hits / unanswerable_count * 100) if unanswerable_count > 0 else 100.0
    citation_validity = (citation_valid_count / len(questions) * 100)

    print(f"\n==================================================")
    print(f"Evaluation Results Summary:")
    print(f"Answerable Questions: {answerable_count}")
    print(f"Unanswerable Questions: {unanswerable_count}")
    print(f"Retrieval Recall@5: {recall:.1f}% (Target: >=90%)")
    print(f"Abstention Accuracy: {abstention_rate:.1f}% (Target: >=95%)")
    print(f"Citation Technical Validity: {citation_validity:.1f}% (Target: >=95%)")
    print(f"==================================================\n")


if __name__ == "__main__":
    asyncio.run(run_evaluation())
