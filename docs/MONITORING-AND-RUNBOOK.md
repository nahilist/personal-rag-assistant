# Monitoring and operating runbook

[Documentation index](README.md) | Version 1.0 | 31 October 2026

Measure API latency/error rate, active/queued generations, queue age, job failures, database pool usage, retrieval latency, vector recall regression, token usage, provider throttles, storage utilization and deletion backlog. Use request/job IDs to correlate logs. Aggregate metrics avoid user text.

Alerts: sustained elevated 5xx, missing worker heartbeats, oldest queue job above threshold, failing backups, database saturation, unusual usage growth, exhausted budget, and deletion jobs older than 24 hours.

| Incident | Immediate response | Recovery |
|---|---|---|
| Model unavailable | Stop admitting excess work; show retry state | Verify credentials/health, resume gradually |
| Worker backlog | Pause new uploads if needed | Add workers after checking embedding/database capacity |
| Database saturated | Reduce admission and pool sizes | Inspect slow queries/indexes before increasing compute |
| Suspected data leak | Disable affected endpoint and revoke exposed access | Investigate audit trail, fix authorization, follow incident obligations |
| Queue data lost | Stop duplicate dispatch races | Reconcile durable pending jobs/outbox and republish idempotently |
| Bad release | Route to prior healthy application version | Verify schema compatibility and replay safe jobs |

Backups: database backup/PITR according to the purchased plan; verify object-storage backups/versioning independently because a database backup alone does not preserve original files. Proposed RPO 24 hours and RTO 8 hours are acceptance objectives, not guarantees. Perform a restore drill including database, private files and re-indexing before launch.

