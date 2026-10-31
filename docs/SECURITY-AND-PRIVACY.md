# Security and privacy requirements

[Documentation index](README.md) | Version 1.0 | 31 October 2026

### Authentication

- Configure allowed callback URLs separately for local, preview and production domains. Reject arbitrary redirect targets.
- Recovery routes must handle recovery state before ordinary logged-in dashboard redirects. Test valid, expired, reused, logged-in and different-browser cases.
- Email verification and production email delivery must work before public launch.
- Rate-limit login, signup, password reset and upload initiation. Do not reveal whether an email exists.
- Restrict CORS to approved origins. For cookie-authenticated mutations use appropriate CSRF protection; do not treat CORS as CSRF protection.

### Untrusted files and model content

- Validate extension, MIME and file signature; reject encrypted PDFs and macro-enabled files in MVP.
- DOCX is an archive: limit entry count and decompressed size. Avoid unsafe XML external entities and HTML rendering.
- Scan uploads according to the selected threat model; never serve active content inline as trusted HTML.
- Display Markdown with a safe renderer and sanitize dangerous links/HTML.
- Disable outbound document URL fetching in MVP to avoid SSRF.
- Treat document instructions as untrusted. No autonomous actions or executable tools.

### Data handling

- TLS for traffic; use provider-supported encryption at rest and managed secrets.
- Logs exclude tokens, passwords, document bodies and full prompts by default.
- Signed download links expire quickly and are created only after current ownership checks.
- Re-check document authorization and active generation when serving historical citations. Deleted documents must not remain accessible through old source IDs.
- Historical generated answers may contain document information: disclose that deleting a document does not automatically erase already saved chat text; provide conversation deletion and full account deletion.
- Before sending excerpts to any model provider, disclose the external processing and verify provider retention/training settings. “Private assistant” must not imply all processing stays on the user's device.
- Admin metrics should use IDs and failure categories. Content inspection requires a controlled, audited support process.

### Retention and deletion proposal

Revoke document access immediately. Purge active original files, chunks, derived previews and caches within 24 hours under normal operation. Account deletion additionally removes chats, profile and user-linked artifacts. Keep only minimal permitted security/accounting metadata under a documented retention policy. Backup copies expire according to the configured backup retention; do not promise immediate deletion from immutable backups. Track failures and retry until completion.

