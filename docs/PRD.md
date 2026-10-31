# Product requirements document

[Documentation index](README.md) | Version 1.0 | 31 October 2026

### Problem

People keep information across PDFs, notes, and documents but spend time locating and reading it. General chatbots do not automatically have access to these files and may provide unsupported answers. Users need private search and explanations with evidence.

### Goal

Allow a user to upload a document, wait for processing, ask a question, and receive an answer whose source can be opened and checked.

### Personas

| Persona | Primary need |
|---|---|
| Student | Explain notes and locate study material in English, Hindi, or Hinglish |
| Professional | Find facts across private documents and summarize relevant sections |
| Administrator | Monitor service health, quotas, and abuse without routinely reading private content |

### MVP scope

1. Email signup, verification, login, logout, and password recovery.
2. Private document uploads: text-based PDF, DOCX, TXT, Markdown.
3. Scan PDFs detected with a clear OCR-required message; OCR is a later optional feature.
4. Processing state, retry, and actionable failure messages.
5. Chat scoped to selected documents or all ready documents belonging to that user.
6. Streaming answers, source excerpts, document title and page/section.
7. Chat history, rename/delete conversation, stop answer, retry failed request.
8. Delete document and account; explain deletion timing.
9. Storage/request quotas and usage display.
10. Responsive, accessible desktop and mobile UI.

### Deferred features

Shared workspaces, web crawling, email/drive connectors, voice, autonomous agents, code execution, billing, image understanding, OCR at scale, and live collaborative editing. Do not implement tools that can send messages, change files, or execute code in the MVP.

### User stories and acceptance criteria

| ID | Story | Acceptance |
|---|---|---|
| AUTH-01 | As a user, I can recover my password | Valid recovery opens password update flow, including when an existing session exists; expired/reused link shows a safe retry screen |
| DOC-01 | I can upload a file | Ownership, quota, signature, size and supported format validated before processing |
| DOC-02 | I can see processing | UI displays queued, extracting, chunking, embedding, ready, failed, or deleting |
| CHAT-01 | I can ask from my notes | Retrieval uses only my authorized ready documents |
| CHAT-02 | I can verify an answer | Each displayed citation resolves to an authorized retrieved excerpt |
| CHAT-03 | I can ask an unanswerable question | Assistant explicitly states insufficient document evidence |
| PRIV-01 | My files stay private | A second test account cannot list, retrieve, cite, download or delete my data |
| DEL-01 | I can delete a document | Search access is revoked immediately; active data purged asynchronously under the deletion SLA |
| REL-01 | A worker failure is recoverable | Job retries without duplicate active chunks or double quota charging |

### Success measures

- At least 90% retrieval recall@10 on a curated, answerable document-question dataset before launch.
- At least 90% supported factual claims in human-reviewed grounded answers.
- At least 95% citations resolve to the claimed excerpt; target 100% technical citation validity.
- Zero cross-user data exposures in authorization tests; any exposure blocks launch.
- At least 95% abstention on a curated set of out-of-document questions.
- Track task completion and user feedback; these quality targets must be validated, not advertised as guaranteed accuracy.

