# Definition of done

[Documentation index](README.md) | Version 1.0 | 31 October 2026

A feature is complete when the user flow works, server authorization is enforced, relevant failure states are visible, meaningful tests pass, sensitive data is excluded from logs, and documentation reflects the actual behavior. Capacity is complete only after a documented real-inference benchmark passes; configuration alone is insufficient.

### Launch checklist

- [ ] No production secrets in browser bundles or repository history.
- [ ] All user data paths pass cross-user isolation tests.
- [ ] Password reset works for existing/new sessions and production domains.
- [ ] Upload limits, retries and cleanup verified.
- [ ] Sources are authorized and citations technically valid.
- [ ] Rate limits and hard spend ceilings enforced server-side.
- [ ] Overload produces bounded queueing and clear retry behavior.
- [ ] Deletion, backups and restore tested.
- [ ] Model license, provider processing settings and privacy notice reviewed.
- [ ] Named operator, incident contacts and release rollback documented.
- [ ] Registered-account limit and concurrent-generation capacity stated separately.

