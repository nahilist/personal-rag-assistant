# Quality, tests and performance gates

[Documentation index](README.md) | Version 1.0 | 31 October 2026

### Required automated checks

| Area | Critical cases |
|---|---|
| Auth | Expiry, invalid issuer, forged tokens, rotated keys, recovery redirects |
| Isolation | Two accounts attempt every read/write/download/retrieval path |
| Upload | Wrong signature, oversize, archive expansion, duplicate completion, abandoned upload |
| Ingestion | Retry, crash, duplicate job, deletion during embedding, model dimension mismatch |
| Chat | No sources, follow-up scope, invalid citation, stop, disconnect, duplicate request |
| Quotas | Concurrent reservations, release on failure, daily rollover, crash leases |
| Deletion | Immediate search revocation, old source link, cache invalidation, storage retry |
| Resilience | Queue unavailable, model timeout, database outage, exhausted provider quota |

### Evaluation dataset

Create at least 100 labeled questions across 20 representative documents, with English, Hindi and Hinglish. Include direct lookup, multi-section synthesis, conflicting statements, tables, unanswerable questions and malicious instructions embedded in text. Keep a holdout set. Store expected source spans, answerability and human scoring rubrics; use synthetic/private-test data with consent.

Track retrieval recall@k, citation correctness, factual support, abstention, latency, token cost and language quality. Automated model grading is supplementary; review launch-critical examples manually.

### Load testing

1. Seed synthetic isolated accounts and realistic document/chunk volumes.
2. Test 100 active sessions with mixed reads/uploads and up to 20 model generations.
3. Test the intended peak arrival rate, then bursts to the bounded queue limit.
4. Run a soak test and observe memory, connection pools, job leases and cancellation.
5. Use a mock model for API limits, then real inference for end-to-end capacity; label the results separately.
6. Repeat with ingestion running and with one API replica removed.

Proposed acceptance targets: p95 metadata API latency under 500 ms, retrieval under 1 second, model first token under 5 seconds excluding disclosed queue wait, 500-token answer under 30 seconds, and under 1% unexpected request failures at the launch workload. File-processing target: p95 under 2 minutes for a defined 20-page text-PDF test fixture under the stated ingestion load. These targets depend on measured hardware/provider behavior and must be revised transparently if unmet.

