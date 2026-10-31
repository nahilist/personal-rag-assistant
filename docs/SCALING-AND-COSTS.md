# Capacity and economics

[Documentation index](README.md) | Version 1.0 | 31 October 2026

### Workload arithmetic

At 200 daily active users × 20 questions = 4,000 requests/day. Assuming 6,000 input tokens and 500 output tokens per request gives approximately 24 million input tokens and 2 million output tokens/day. These are workload assumptions, not measured usage.

If 25% of daily requests occur in the busiest hour, that is 1,000 requests/hour or about 0.278 requests/second. At a measured mean 20-second request lifetime, Little's Law gives roughly 5.6 active requests on average during that hour. A limit of 20 allows some burst room, but p95/burst tests are still required.

If 20 answers simultaneously need 25 output tokens/second each, the inference layer must sustain around 500 aggregate output tokens/second, in addition to prompt processing. Do not assume a single consumer GPU achieves this for your model/context configuration.

### Storage sizing example

1,000 users × 20 documents × 50 chunks/document = 1 million chunks. For a 768-dimensional float32 vector, raw vectors alone are about 3.07 GB decimal. Text, metadata, indexes, WAL, replicas and backups add substantial overhead; measure using representative data. At a 2 MB mean original file size, originals occupy about 40 GB. The 200 MB/account quota is a maximum allowance, not this average forecast.

### Rate and concurrency limits

- Starting limits: 10 chat requests/minute/user, 2 active generations/user, 20 active generations globally.
- Allow a bounded pending queue, for example 100 requests with a 30-second maximum wait; reject excess with a retryable capacity error.
- Keep the global slot lease and atomic counters in shared storage, so two API replicas do not each admit 20.
- Enforce per-day usage/token budgets and upstream provider limits before starting generation.
- Limit simultaneous uploads and ingestion jobs separately. Reserve sufficient resources so ingestion cannot starve chat.
- Stop/cancel requests release leases reliably, including process crashes via TTL and reconciliation.

### Cost options

| Option | Advantage | Constraint |
|---|---|---|
| Local Ollama development | No hosted inference API bill | Laptop must run the model; capacity and uptime limited |
| Hosted model API | Fastest launch and no GPU operations | Token charges, limits and document excerpts leave your infrastructure |
| Self-hosted open-weight model | Greater infrastructure control | GPU rental/purchase, operations and model license review |
| User-supplied API key | Users fund their model usage | Requires secure key storage and provider-specific support |

Open-source/open-weight does not mean free cloud inference. Free endpoints and trial quotas are suitable for experiments only until their terms, capacity and reliability meet your needs. A friend's browser connects to your deployed backend, which calls the deployed model; the friend does not need Ollama installed in the centrally hosted architecture.

Monthly estimate formula:

```text
total = web + API + workers + database + storage/egress + Redis
      + embedding inference + LLM inference + monitoring + backup

hosted_LLM = input_tokens/1,000,000 * input_rate
           + output_tokens/1,000,000 * output_rate

self_hosted_LLM = GPU_hourly_rate * provisioned_hours
               + host_storage + networking + operations
```

No current vendor prices are quoted here. Get quotations for your region and required service limits before committing. For a strict zero hosting budget, deliver a local demo rather than promise a reliable public 1,000-user service.

### Path to 1,000 concurrent users

First clarify how many generate answers simultaneously. Scale API connections, database pool budget, queue limits and inference independently. Benchmark increasing model replicas and GPU batches, then distribute requests across healthy inference endpoints. At 1,000 simultaneous generations × 25 output tokens/second, demand is 25,000 output tokens/second plus prompt ingestion; this is a different deployment class from 1,000 accounts.

