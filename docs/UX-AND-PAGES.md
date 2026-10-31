# UX and page map

[Documentation index](README.md) | Version 1.0 | 31 October 2026

| Route | Purpose |
|---|---|
| `/` | Product overview and sign in |
| `/auth/login` | Sign in |
| `/auth/signup` | Create account |
| `/auth/forgot-password` | Request recovery email |
| `/auth/callback` | Handle the configured authentication callback |
| `/auth/reset-password` | Complete valid password recovery |
| `/app` | Recent chats and upload entry point |
| `/app/chat/[id]` | Messages, document scope, streaming answer, citations |
| `/app/documents` | File list, statuses, upload and delete |
| `/app/documents/[id]` | Authorized document details and source preview |
| `/app/settings` | Language, account, privacy and usage |
| `/admin` | Restricted operational metrics and failures |

Chat layout: conversation sidebar, central message area, composer with selected-document chips, and citation drawer. On mobile, use drawers and keep the composer visible above the keyboard.

Required UI states: empty library, processing, no ready sources, no evidence, stream interrupted, quota exceeded, provider unavailable, expired session, invalid recovery link, deletion pending. Never show an empty dashboard as a substitute for a password reset error.

