# NimConnect permissions (Phase 1)

Supported today via `@nimconnect/profile-client`:

- Public handle resolution
- Public profile fields (display name, bio, links)

Not available as production APIs yet — mocked behind adapters:

- `friends:read`
- `achievements:read`
- `inventory:read`
- `messages:summary`
- `payments:request` (payment flows use Mini App SDK / request links separately)

NimWorld must never assume access to private invoices, full payment history, private messages, savings buckets, or split-bill history.
